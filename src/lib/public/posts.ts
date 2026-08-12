import { supabasePublic } from "@/lib/supabase/public";
import { cfImageUrl } from "@/lib/images";
import { EMPTY_CONTENT } from "@/lib/content";
import type { PostContent } from "@/lib/content";

// The public read model for posts. Separate from `lib/posts.ts` (the admin's
// read/write model over the base tables) because the two are genuinely
// different shapes: this one is card-sized, pre-formatted, published-only, and
// never writes. The block content model is shared — both import `lib/content`.

// ── Public post shapes ─────────────────────────────────────────────

// Card-sized summary used on the blog index and every post card.
export type PostSummary = {
	title: string;
	slug: string;
	categories: string[];
	date: string;
	excerpt: string;
	image_url?: string;
};

// Full post for the detail page, including rendered block content and the
// resolved URLs for any image blocks (keyed by mediaId).
export type FullPost = PostSummary & {
	content: PostContent;
	mediaUrls: Record<string, string>;
};

// ── RPC payloads ───────────────────────────────────────────────────
// Reads go through SECURITY DEFINER functions (get_published_posts /
// get_published_post) so anon never touches the base tables — only the
// curated, published-only shape below is ever exposed.

type SummaryRpc = {
	title: string;
	slug: string;
	excerpt: string | null;
	published_at: string | null;
	categories: string[] | null;
	featured_external_id: string | null;
	author_name: string | null;
};

type FullRpc = SummaryRpc & {
	content: PostContent | null;
	content_images: Record<string, string> | null;
};

// Exported so draft preview renders its date identically to the live page.
export function formatDate(iso: string | null): string {
	if (!iso) return "";
	return new Date(iso).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

function mapSummary(r: SummaryRpc): PostSummary {
	return {
		title: r.title,
		slug: r.slug,
		excerpt: r.excerpt ?? "",
		date: formatDate(r.published_at),
		categories: r.categories ?? [],
		image_url: r.featured_external_id ? cfImageUrl(r.featured_external_id) : undefined,
	};
}

// ── Queries ────────────────────────────────────────────────────────

export async function listPosts(): Promise<PostSummary[]> {
	const { data, error } = await supabasePublic.rpc("get_published_posts");
	if (error) throw new Error(error.message);
	return ((data as SummaryRpc[]) ?? []).map(mapSummary);
}

export async function getPostBySlug(slug: string): Promise<FullPost | null> {
	const { data, error } = await supabasePublic.rpc("get_published_post", {
		p_slug: slug,
	});
	if (error) throw new Error(error.message);
	if (!data) return null;

	const r = data as FullRpc;
	const content = r.content ?? EMPTY_CONTENT;

	// content_images maps mediaId → Cloudflare external_id; turn it into URLs.
	const mediaUrls: Record<string, string> = {};
	for (const [id, externalId] of Object.entries(r.content_images ?? {})) {
		mediaUrls[id] = cfImageUrl(externalId);
	}

	return { ...mapSummary(r), content, mediaUrls };
}
