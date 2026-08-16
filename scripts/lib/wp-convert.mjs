// Pure HTML → block conversion. No network, no Supabase — just text in,
// block tree out. Images become "pending" image blocks (mediaId: null, plus
// a `pending` record holding the source URL) rather than being uploaded here;
// `wp-import.mjs push` resolves those later, one at a time, against Cloudflare.

const NAMED_ENTITIES = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: '"',
	apos: "'",
	nbsp: " ",
	hellip: "…",
	mdash: "—",
	ndash: "–",
	rsquo: "’",
	lsquo: "‘",
	rdquo: "”",
	ldquo: "“",
	copy: "©",
	reg: "®",
	trade: "™",
};

export function decodeEntities(str) {
	if (!str) return str;
	return str
		.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
		.replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
		.replace(/&([a-zA-Z]+);/g, (m, name) => NAMED_ENTITIES[name] ?? m);
}

export function stripTags(html) {
	return decodeEntities((html || "").replace(/<[^>]+>/g, " "))
		.replace(/\s+/g, " ")
		.trim();
}

export function newId() {
	return Math.random().toString(36).slice(2, 10);
}

// Splits a block of HTML into its top-level elements. WP's Gutenberg output
// is always flat block wrappers at the top level, so depth only needs to be
// tracked for tags matching the element currently being opened — not a full
// DOM parse. Non-whitespace text found between/outside elements is reported
// rather than silently dropped.
const TAG_RE = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^<>]*)>/g;
const VOID_TAGS = new Set(["br", "hr", "img", "input", "meta", "link", "source", "col", "area"]);

export function splitTopLevelElements(html) {
	const chunks = [];
	const strayText = [];
	let depth = 0;
	let currentTag = null;
	let elStart = null;
	let cursor = 0;

	TAG_RE.lastIndex = 0;
	let m;
	while ((m = TAG_RE.exec(html))) {
		const [full, closingSlash, tagNameRaw, rest] = m;
		const tagName = tagNameRaw.toLowerCase();
		const isClosing = closingSlash === "/";
		const isSelfClosing = rest.trim().endsWith("/") || VOID_TAGS.has(tagName);

		if (depth === 0) {
			if (isClosing) continue;
			const gap = html.slice(cursor, m.index);
			if (gap.trim()) strayText.push(gap.trim());
			elStart = m.index;
			currentTag = tagName;
			if (isSelfClosing) {
				chunks.push(html.slice(elStart, m.index + full.length));
				cursor = m.index + full.length;
				elStart = null;
				currentTag = null;
			} else {
				depth = 1;
			}
			continue;
		}

		if (!isClosing && tagName === currentTag && !isSelfClosing) {
			depth++;
		} else if (isClosing && tagName === currentTag) {
			depth--;
			if (depth === 0) {
				chunks.push(html.slice(elStart, m.index + full.length));
				cursor = m.index + full.length;
				elStart = null;
				currentTag = null;
			}
		}
	}
	const trailing = html.slice(cursor);
	if (trailing.trim()) strayText.push(trailing.trim());

	return { chunks, strayText };
}

function outerTag(chunk) {
	const m = /^<([a-zA-Z][a-zA-Z0-9]*)([^<>]*)>/.exec(chunk);
	return m ? { tag: m[1].toLowerCase(), attrs: m[2] || "" } : null;
}

function innerHtml(chunk, tag) {
	const open = /^<[a-zA-Z][a-zA-Z0-9]*[^<>]*>/.exec(chunk);
	const openLen = open ? open[0].length : 0;
	const closeIdx = chunk.lastIndexOf(`</${tag}>`);
	return (closeIdx >= 0 ? chunk.slice(openLen, closeIdx) : chunk.slice(openLen)).trim();
}

function hasClass(attrs, cls) {
	const m = /class="([^"]*)"/.exec(attrs || "");
	return !!m && m[1].split(/\s+/).includes(cls);
}

function extractAttr(tagStr, name) {
	const m = new RegExp(`${name}="([^"]*)"`).exec(tagStr);
	return m ? decodeEntities(m[1]) : undefined;
}

function parseTable(tableInnerHtml) {
	const rowMatches = [...tableInnerHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)];
	if (rowMatches.length === 0) return null;
	const rows = [];
	let header = false;
	let align;
	rowMatches.forEach((rm, ri) => {
		const cellMatches = [...rm[1].matchAll(/<(th|td)([^>]*)>([\s\S]*?)<\/\1>/g)];
		rows.push(cellMatches.map((cm) => cm[3].trim()));
		if (ri === 0) {
			header = cellMatches.length > 0 && cellMatches.every((cm) => cm[1] === "th");
			align = cellMatches.map((cm) => {
				const a = /data-align="([^"]*)"/.exec(cm[2]);
				return a && ["left", "center", "right"].includes(a[1]) ? a[1] : "left";
			});
		}
	});
	return { id: newId(), type: "table", data: { header, rows, align } };
}

// A "pending" image block: same shape the real block will eventually have,
// except mediaId is null and `pending` carries what's needed to upload it.
// `push` resolves these in place; anything still unresolved at DB-write time
// gets pruned from a copy of the tree, never from the stored state.
function pendingImage(imgTag, figureChunk) {
	const src = extractAttr(imgTag, "src");
	if (!src) return null;
	const alt = extractAttr(imgTag, "alt") || undefined;
	const width = Number(extractAttr(imgTag, "width")) || undefined;
	const height = Number(extractAttr(imgTag, "height")) || undefined;
	const capMatch = figureChunk && /<figcaption[^>]*>([\s\S]*?)<\/figcaption>/.exec(figureChunk);
	const caption = capMatch ? stripTags(capMatch[1]) : undefined;
	return {
		id: newId(),
		type: "image",
		data: {
			mediaId: null,
			variant: "default",
			...(alt ? { alt } : {}),
			...(caption ? { caption } : {}),
			pending: { src, width, height, alt, status: "pending", step: null, error: null },
		},
	};
}

function imageBlockFromFigure(figureChunk) {
	const img = /<img\s+[^>]*>/.exec(figureChunk);
	return img ? pendingImage(img[0], figureChunk) : null;
}

function convertChunk(chunk) {
	const o = outerTag(chunk);
	if (!o) return { skip: chunk };
	const { tag, attrs } = o;

	// Older embeds show up as <center><blockquote class="instagram-media" ...>
	// rather than the block-editor's <figure> wrapper — check for the
	// permalink directly, regardless of what's wrapping it.
	const igUrl = /https:\/\/www\.instagram\.com\/(?:p|reel)\/[^\s"'<]+/.exec(chunk);
	if (igUrl) return { block: { id: newId(), type: "instagram", data: { url: igUrl[0] } } };

	if (tag === "hr") return { block: { id: newId(), type: "divider", data: {} } };

	if (tag === "p") {
		const html = innerHtml(chunk, "p");
		if (!html || html === "<br/>" || html === "<br>") return { none: true };
		return { block: { id: newId(), type: "paragraph", data: { html } } };
	}

	if (tag === "h2" || tag === "h3" || tag === "h4") {
		const html = innerHtml(chunk, tag);
		return { block: { id: newId(), type: "heading", data: { level: Number(tag[1]), html } } };
	}

	if (tag === "blockquote") {
		let html = innerHtml(chunk, "blockquote");
		const pOnly = /^<p[^>]*>([\s\S]*)<\/p>$/.exec(html);
		if (pOnly) html = pOnly[1].trim();
		return { block: { id: newId(), type: "quote", data: { html } } };
	}

	if (tag === "ul" || tag === "ol") {
		const inner = innerHtml(chunk, tag);
		const items = [...inner.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((mm) => mm[1].trim());
		if (items.length === 0) return { skip: chunk };
		return { block: { id: newId(), type: "list", data: { ordered: tag === "ol", items } } };
	}

	if (tag === "table") {
		const parsed = parseTable(innerHtml(chunk, "table"));
		return parsed ? { block: parsed } : { skip: chunk };
	}

	if (tag === "div" && hasClass(attrs, "wp-block-buttons")) {
		const inner = innerHtml(chunk, "div");
		const links = [...inner.matchAll(/<a\s+[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)];
		if (links.length === 0) return { skip: chunk };
		return {
			blocks: links.map((lm) => ({
				id: newId(),
				type: "linkbutton",
				data: { url: decodeEntities(lm[1]), label: stripTags(lm[2]) || "Learn more" },
			})),
		};
	}

	if (tag === "div" && hasClass(attrs, "wp-block-image")) {
		const img = /<img\s+[^>]*>/.exec(chunk);
		if (!img) return { skip: chunk };
		const block = pendingImage(img[0], chunk);
		return block ? { block } : { skip: chunk };
	}

	if (tag === "figure") {
		if (hasClass(attrs, "wp-block-table")) {
			const tableMatch = /<table[^>]*>([\s\S]*?)<\/table>/.exec(chunk);
			const parsed = tableMatch ? parseTable(tableMatch[1]) : null;
			return parsed ? { block: parsed } : { skip: chunk };
		}

		// Gallery: a figure wrapping several nested wp-block-image figures,
		// side by side. Maps onto our `columns` block — one column per image.
		if (hasClass(attrs, "wp-block-gallery")) {
			const inner = innerHtml(chunk, "figure");
			const { chunks: nested } = splitTopLevelElements(inner);
			const columns = nested
				.map((nc) => imageBlockFromFigure(nc))
				.filter(Boolean)
				.map((imgBlock) => ({ id: newId(), blocks: [imgBlock] }));
			if (columns.length === 0) return { skip: chunk };
			return { block: { id: newId(), type: "columns", data: { columns } } };
		}

		const img = /<img\s+[^>]*>/.exec(chunk);
		if (img) {
			const block = pendingImage(img[0], chunk);
			return block ? { block } : { skip: chunk };
		}
		return { skip: chunk };
	}

	return { skip: chunk };
}

export function convertContent(html) {
	const { chunks, strayText } = splitTopLevelElements(html || "");
	const blocks = [];
	const skipped = strayText.map((t) => ({ tag: "text", preview: t.slice(0, 140) }));

	for (const chunk of chunks) {
		const r = convertChunk(chunk);
		if (r.block) blocks.push(r.block);
		else if (r.blocks) blocks.push(...r.blocks);
		else if (r.none) continue;
		else if (r.skip) {
			const info = outerTag(r.skip);
			skipped.push({
				tag: info?.tag ?? "unknown",
				preview: r.skip.replace(/\s+/g, " ").slice(0, 140),
			});
		}
	}
	return { blocks, skipped };
}

// A standalone pending image (for the post's featured image, which isn't
// part of body content).
export function pendingFeaturedImage(sourceUrl, alt) {
	if (!sourceUrl) return null;
	return { src: sourceUrl, alt: alt || undefined, status: "pending", step: null, error: null };
}
