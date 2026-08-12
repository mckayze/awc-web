import { supabaseServer } from "@/lib/supabase/server";
import { cfImageUrl } from "@/lib/images";
import { EMPTY_CONTENT } from "@/lib/content";
import type { Block, PostContent } from "@/lib/content";
import { FULL_SELECT, postState } from "@/lib/posts";
import type { PostState, PostStatus } from "@/lib/posts";
import { formatDate } from "@/lib/public/posts";
import type { FullPost } from "@/lib/public/posts";

// The draft-preview read model: the same post shape the public site renders,
// but sourced from the base tables instead of the published-only RPCs.
//
// `lib/public/posts.ts` physically cannot return a draft — it goes through
// SECURITY DEFINER functions that filter to published rows, which is the point
// of them. So preview reads `posts` directly through the *server* client, which
// carries the signed-in editor's cookies. RLS on the base table is the gate:
// this returns exactly the rows that user is already allowed to see in the
// admin, and nothing for anyone else.
//
// Lookup is by id, not slug: slugs get edited while a post is still a draft and
// aren't reliably unique before publish.

type PreviewRow = {
	id: string;
	title: string;
	slug: string;
	excerpt: string | null;
	content: PostContent | null;
	status: PostStatus;
	published_at: string | null;
	updated_at: string;
	featured: { external_id: string; mime_type: string } | null;
	categories: { category: { name: string } | null }[] | null;
};

export type PostPreview = {
	post: FullPost;
	state: PostState;
};

// Image blocks reference a media row id; the public RPC resolves those to
// Cloudflare ids server-side as `content_images`. Reading the base table gets
// no such help, so walk the tree ourselves — `columns` blocks nest, so this
// has to recurse or it silently misses every image inside a two-column layout.
function collectMediaIds(blocks: Block[], into: Set<string>): void {
	for (const block of blocks) {
		if (block.type === "image") {
			if (block.data.mediaId) into.add(block.data.mediaId);
		} else if (block.type === "columns") {
			for (const column of block.data.columns) collectMediaIds(column.blocks, into);
		}
	}
}

export async function getPostPreviewById(id: string): Promise<PostPreview | null> {
	const supabase = await supabaseServer();

	const { data, error } = await supabase.from("posts").select(FULL_SELECT).eq("id", id).maybeSingle();
	// RLS turns "not allowed" into "no row", so a null here covers both a bad id
	// and a user without access. Either way the caller renders a 404.
	if (error) throw new Error(error.message);
	if (!data) return null;

	const r = data as unknown as PreviewRow;
	const content = r.content ?? EMPTY_CONTENT;

	const mediaIds = new Set<string>();
	collectMediaIds(content.blocks, mediaIds);

	const mediaUrls: Record<string, string> = {};
	if (mediaIds.size > 0) {
		const { data: media, error: mediaError } = await supabase
			.from("media")
			.select("id, external_id")
			.in("id", [...mediaIds]);
		if (mediaError) throw new Error(mediaError.message);
		for (const m of (media as { id: string; external_id: string }[]) ?? []) {
			mediaUrls[m.id] = cfImageUrl(m.external_id);
		}
	}

	return {
		state: postState(r.status, r.published_at),
		post: {
			title: r.title,
			slug: r.slug,
			excerpt: r.excerpt ?? "",
			// A draft has no published_at, and a blank date leaves a gap in the
			// header. Fall back to when it was last touched so the layout matches
			// what publishing will produce.
			date: formatDate(r.published_at ?? r.updated_at),
			categories: (r.categories ?? [])
				.map((c) => c.category?.name)
				.filter((n): n is string => Boolean(n)),
			image_url:
				r.featured && r.featured.mime_type.startsWith("image/")
					? cfImageUrl(r.featured.external_id)
					: undefined,
			content,
			mediaUrls,
		},
	};
}
