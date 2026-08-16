// Two-phase, resumable WordPress → Supabase importer.
//
//   node --env-file=.env.local scripts/wp-import.mjs fetch [count]
//   node --env-file=.env.local scripts/wp-import.mjs push  [count]
//
// `fetch` pulls posts from the old site's REST API and converts their HTML
// to our block format, writing everything to scripts/.wp-import-state.json.
// Read-only against WordPress, no Supabase/Cloudflare writes, safe to rerun
// (never re-fetches a post already in the file).
//
// `push` uploads each post's images to Cloudflare (one at a time, throttled,
// with retry on rate limits) and writes the post as a draft. Every image's
// outcome is recorded back into the state file — a post with some failed
// images still gets created (status "partial"), and rerunning `push` only
// retries what didn't succeed. Nothing is ever deleted from the file.
//
// Needs WP_IMPORT_ADMIN_EMAIL / WP_IMPORT_ADMIN_PASSWORD in .env.local for
// `push` (an existing admin login here, not WordPress — WordPress reads are
// public). `fetch` needs no credentials at all.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { convertContent, decodeEntities, stripTags, pendingFeaturedImage } from "./lib/wp-convert.mjs";
import { uploadImageFromUrl } from "./lib/upload.mjs";
import { CATEGORY_MAP } from "./lib/category-map.mjs";

const STATE_PATH = fileURLToPath(new URL("./.wp-import-state.json", import.meta.url));
const WP_SOURCE = (process.env.WP_IMPORT_SOURCE || "https://awomansconfidence.com").replace(/\/$/, "");
const UPLOAD_DELAY_MS = 300;

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadState() {
	if (!existsSync(STATE_PATH)) return { source: WP_SOURCE, updatedAt: null, posts: {} };
	return JSON.parse(readFileSync(STATE_PATH, "utf8"));
}

function saveState(state) {
	state.updatedAt = new Date().toISOString();
	writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

// ── fetch ─────────────────────────────────────────────────────────────

function buildEntry(wp) {
	const title = decodeEntities(stripTags(wp.title?.rendered ?? "(untitled)"));
	const excerpt = stripTags(wp.excerpt?.rendered ?? "") || null;
	const { blocks, skipped } = convertContent(wp.content?.rendered);
	const featured = wp._embedded?.["wp:featuredmedia"]?.[0];
	const wpCategorySlugs = (wp._embedded?.["wp:term"] ?? [])
		.flat()
		.filter((t) => t.taxonomy === "category")
		.map((t) => t.slug);

	return {
		wpId: wp.id,
		wpSlug: wp.slug,
		wpDate: wp.date_gmt ? `${wp.date_gmt}Z` : null,
		wpLink: wp.link,
		title,
		excerpt,
		blocks,
		skipped,
		wpCategorySlugs,
		featuredImage: featured?.source_url
			? pendingFeaturedImage(featured.source_url, featured.alt_text)
			: null,
		status: "ready",
		postId: null,
		error: null,
	};
}

async function fetchCmd(count) {
	const state = loadState();
	// per_page MUST stay constant across the whole run — WordPress computes
	// each page's offset as (page - 1) * per_page using that request's own
	// per_page, so varying it between requests (e.g. shrinking it as `added`
	// approaches `count`) throws the offset off and causes overlapping,
	// re-scanned page ranges.
	const PER_PAGE = 100;
	let page = 1;
	let added = 0;
	let alreadyPresent = 0;

	while (added < count) {
		const url = `${WP_SOURCE}/wp-json/wp/v2/posts?per_page=${PER_PAGE}&page=${page}&_embed&orderby=date&order=desc`;
		const res = await fetch(url, {
			headers: { "User-Agent": "Mozilla/5.0 (compatible; AWC-Import/1.0)" },
		});
		if (res.status === 400) break; // past the last page
		if (!res.ok) throw new Error(`WordPress fetch failed: ${res.status} ${res.statusText}`);
		const items = await res.json();
		if (items.length === 0) break;

		for (const wp of items) {
			if (added >= count) break;
			if (state.posts[wp.id]) {
				alreadyPresent++;
				continue;
			}
			state.posts[wp.id] = buildEntry(wp);
			added++;
		}
		if (items.length < PER_PAGE) break; // that was the last page
		page++;
	}

	saveState(state);
	console.log(
		`Fetched ${added} new post(s), skipped ${alreadyPresent} already in the file. ` +
			`${Object.keys(state.posts).length} total in ${STATE_PATH}.`,
	);
}

// ── push ─────────────────────────────────────────────────────────────

function collectPendingImages(blocks, out = []) {
	for (const b of blocks) {
		if (b.type === "image" && b.data.mediaId == null && b.data.pending) out.push(b);
		if (b.type === "columns") {
			for (const col of b.data.columns) collectPendingImages(col.blocks, out);
		}
	}
	return out;
}

// Drops any image still unresolved (and any column/columns-block that ends
// up empty as a result) and strips the `pending` bookkeeping field — this
// runs on a fresh tree each time, the stored state itself is never pruned.
function pruneAndClean(blocks) {
	const out = [];
	for (const b of blocks) {
		if (b.type === "image") {
			if (!b.data.mediaId) continue;
			const { pending, ...data } = b.data;
			out.push({ ...b, data });
			continue;
		}
		if (b.type === "columns") {
			const columns = b.data.columns
				.map((col) => ({ ...col, blocks: pruneAndClean(col.blocks) }))
				.filter((col) => col.blocks.length > 0);
			if (columns.length === 0) continue;
			out.push({ ...b, data: { ...b.data, columns } });
			continue;
		}
		out.push(b);
	}
	return out;
}

async function resolveImage(supabase, pending) {
	const result = await uploadImageFromUrl(supabase, pending);
	if (result.mediaId) {
		pending.status = "uploaded";
		pending.step = null;
		pending.error = null;
		return result.mediaId;
	}
	pending.status = "failed";
	pending.step = result.step;
	pending.error = result.error;
	return null;
}

async function resolveCategoryIds(entry, categoryLookup) {
	const targetSlugs = new Set();
	const unmapped = [];
	for (const wpSlug of entry.wpCategorySlugs ?? []) {
		const mapped = CATEGORY_MAP[wpSlug];
		if (mapped === undefined) {
			unmapped.push(wpSlug);
			continue;
		}
		for (const ourSlug of mapped) targetSlugs.add(ourSlug);
	}
	const ids = [];
	for (const slug of targetSlugs) {
		const id = categoryLookup.get(slug);
		if (id) ids.push(id);
		else unmapped.push(`${slug} (not found in categories table)`);
	}
	entry.unmappedCategories = unmapped;
	return ids;
}

async function pushPost(supabase, entry, categoryLookup) {
	const pendingBlocks = collectPendingImages(entry.blocks);
	for (const block of pendingBlocks) {
		const mediaId = await resolveImage(supabase, block.data.pending);
		if (mediaId) block.data.mediaId = mediaId;
		await sleep(UPLOAD_DELAY_MS);
	}

	if (entry.featuredImage && entry.featuredImage.status !== "uploaded") {
		const mediaId = await resolveImage(supabase, entry.featuredImage);
		if (mediaId) entry.featuredImage.mediaId = mediaId;
		await sleep(UPLOAD_DELAY_MS);
	}

	const finalBlocks = pruneAndClean(entry.blocks);
	const featuredMediaId = entry.featuredImage?.status === "uploaded" ? entry.featuredImage.mediaId : null;

	const payload = {
		title: entry.title,
		slug: entry.wpSlug,
		excerpt: entry.excerpt,
		content: { version: 1, blocks: finalBlocks },
		status: "draft",
		featured_image_id: featuredMediaId,
	};

	let dbError = null;
	if (!entry.postId) {
		const { data, error } = await supabase.from("posts").insert(payload).select("id").single();
		if (error) dbError = error.message;
		else entry.postId = data.id;
	} else {
		const { error } = await supabase.from("posts").update(payload).eq("id", entry.postId);
		if (error) dbError = error.message;
	}

	if (!dbError && entry.postId) {
		const categoryIds = await resolveCategoryIds(entry, categoryLookup);
		// Delete-then-insert, same pattern as the admin's setPostCategories —
		// makes this safe to redo on a retried/partial push.
		const { error: delErr } = await supabase
			.from("post_categories")
			.delete()
			.eq("post_id", entry.postId);
		if (delErr) dbError = delErr.message;
		else if (categoryIds.length > 0) {
			const { error: catErr } = await supabase
				.from("post_categories")
				.insert(categoryIds.map((category_id) => ({ post_id: entry.postId, category_id })));
			if (catErr) dbError = catErr.message;
		}
	}

	const stillUnresolved =
		collectPendingImages(entry.blocks).length > 0 ||
		(entry.featuredImage && entry.featuredImage.status === "failed") ||
		(entry.unmappedCategories && entry.unmappedCategories.length > 0);

	entry.error = dbError;
	entry.status = dbError ? "failed" : stillUnresolved ? "partial" : "done";
}

async function pushCmd(limit) {
	const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
	const ADMIN_EMAIL = process.env.WP_IMPORT_ADMIN_EMAIL;
	const ADMIN_PASSWORD = process.env.WP_IMPORT_ADMIN_PASSWORD;
	const missing = [
		["NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL],
		["NEXT_PUBLIC_SUPABASE_ANON_KEY", SUPABASE_ANON_KEY],
		["WP_IMPORT_ADMIN_EMAIL", ADMIN_EMAIL],
		["WP_IMPORT_ADMIN_PASSWORD", ADMIN_PASSWORD],
	].filter(([, v]) => !v);
	if (missing.length > 0) {
		console.error(`Missing env var(s): ${missing.map(([k]) => k).join(", ")}`);
		process.exit(1);
	}

	if (!existsSync(STATE_PATH)) {
		console.error(`No state file at ${STATE_PATH} — run "fetch" first.`);
		process.exit(1);
	}
	const state = loadState();

	const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
	const { error: authError } = await supabase.auth.signInWithPassword({
		email: ADMIN_EMAIL,
		password: ADMIN_PASSWORD,
	});
	if (authError) {
		console.error(`Sign-in failed: ${authError.message}`);
		process.exit(1);
	}

	const { data: categoryRows, error: catFetchErr } = await supabase
		.from("categories")
		.select("id, slug");
	if (catFetchErr) {
		console.error(`Failed to load categories: ${catFetchErr.message}`);
		process.exit(1);
	}
	const categoryLookup = new Map(categoryRows.map((c) => [c.slug, c.id]));

	const eligible = Object.values(state.posts).filter(
		(e) => e.status === "ready" || e.status === "partial",
	);
	const batch = limit ? eligible.slice(0, limit) : eligible;
	console.log(`Pushing ${batch.length} post(s) (${eligible.length} eligible, ${limit ? `limit ${limit}` : "no limit"}).\n`);

	for (const entry of batch) {
		await pushPost(supabase, entry, categoryLookup);
		saveState(state);
		const mark = entry.status === "done" ? "✓" : entry.status === "partial" ? "△" : "✗";
		console.log(`${mark} ${entry.title} — ${entry.status}${entry.error ? ` (${entry.error})` : ""}`);
	}

	printReport(state);
}

// ── dates ────────────────────────────────────────────────────────────

// Backfills posts.published_at from each entry's wpDate. Only touches posts
// that were actually pushed (postId set) and skips those already carrying
// the target value, so it's safe to rerun.
async function datesCmd() {
	const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
	const ADMIN_EMAIL = process.env.WP_IMPORT_ADMIN_EMAIL;
	const ADMIN_PASSWORD = process.env.WP_IMPORT_ADMIN_PASSWORD;
	const missing = [
		["NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL],
		["NEXT_PUBLIC_SUPABASE_ANON_KEY", SUPABASE_ANON_KEY],
		["WP_IMPORT_ADMIN_EMAIL", ADMIN_EMAIL],
		["WP_IMPORT_ADMIN_PASSWORD", ADMIN_PASSWORD],
	].filter(([, v]) => !v);
	if (missing.length > 0) {
		console.error(`Missing env var(s): ${missing.map(([k]) => k).join(", ")}`);
		process.exit(1);
	}

	if (!existsSync(STATE_PATH)) {
		console.error(`No state file at ${STATE_PATH} — run "fetch" first.`);
		process.exit(1);
	}
	const state = loadState();

	const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
	const { error: authError } = await supabase.auth.signInWithPassword({
		email: ADMIN_EMAIL,
		password: ADMIN_PASSWORD,
	});
	if (authError) {
		console.error(`Sign-in failed: ${authError.message}`);
		process.exit(1);
	}

	const entries = Object.values(state.posts).filter((e) => e.postId && e.wpDate);
	console.log(`Setting published_at on ${entries.length} post(s).\n`);

	let ok = 0;
	let failed = 0;
	for (const entry of entries) {
		const { error } = await supabase
			.from("posts")
			.update({ published_at: entry.wpDate })
			.eq("id", entry.postId);
		if (error) {
			failed++;
			console.log(`✗ ${entry.title} — ${error.message}`);
		} else {
			ok++;
		}
	}
	console.log(`\nDone: ${ok} updated, ${failed} failed.`);
}

// ── report ───────────────────────────────────────────────────────────

function printReport(state) {
	const all = Object.values(state.posts);
	const counts = all.reduce((acc, e) => {
		acc[e.status] = (acc[e.status] || 0) + 1;
		return acc;
	}, {});
	console.log(
		`\nState file totals: ${JSON.stringify(counts)} (${all.length} posts total in ${STATE_PATH})`,
	);

	const withIssues = all.filter((e) => e.status === "partial" || e.status === "failed");
	if (withIssues.length === 0) return;

	console.log("\n── Needs attention ──");
	for (const e of withIssues) {
		console.log(`\n${e.title} (${e.wpLink})`);
		if (e.error) console.log(`  post error: ${e.error}`);
		for (const block of collectPendingImages(e.blocks)) {
			const p = block.data.pending;
			console.log(`  image failed at ${p.step}: ${p.error} — ${p.src}`);
		}
		if (e.featuredImage?.status === "failed") {
			console.log(
				`  featured image failed at ${e.featuredImage.step}: ${e.featuredImage.error} — ${e.featuredImage.src}`,
			);
		}
		if (e.skipped?.length) {
			for (const s of e.skipped) console.log(`  content skipped <${s.tag}>: ${s.preview}`);
		}
		if (e.unmappedCategories?.length) {
			for (const c of e.unmappedCategories) console.log(`  unmapped category: ${c}`);
		}
	}
}

// ── CLI ──────────────────────────────────────────────────────────────

const [, , cmd, arg] = process.argv;

if (cmd === "fetch") {
	await fetchCmd(Number(arg) || 20);
} else if (cmd === "push") {
	await pushCmd(Number(arg) || 5);
} else if (cmd === "dates") {
	await datesCmd();
} else if (cmd === "report") {
	printReport(loadState());
} else {
	console.error(
		"Usage:\n" +
			"  node --env-file=.env.local scripts/wp-import.mjs fetch [count]\n" +
			"  node --env-file=.env.local scripts/wp-import.mjs push [count]\n" +
			"  node --env-file=.env.local scripts/wp-import.mjs dates\n" +
			"  node scripts/wp-import.mjs report",
	);
	process.exit(1);
}
