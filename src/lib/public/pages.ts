import { supabasePublic } from "@/lib/supabase/public";
import { cfImageUrl } from "@/lib/images";
import { EMPTY_CONTENT } from "@/lib/content";
import type { PostContent } from "@/lib/content";

// Site pages (Cookie Policy, Privacy Policy, …) reuse the post block model, so
// PostBody renders them unchanged. Reads go through the get_published_page
// SECURITY DEFINER RPC — anon only ever sees published pages. The admin's
// read/write model for the same rows is `lib/pages.ts`.

export type FullPage = {
	title: string;
	slug: string;
	content: PostContent;
	mediaUrls: Record<string, string>;
	updatedAt: string | null;
};

type PageRpc = {
	title: string;
	slug: string;
	content: PostContent | null;
	updated_at: string | null;
	content_images: Record<string, string> | null;
};

export async function getPageBySlug(slug: string): Promise<FullPage | null> {
	const { data, error } = await supabasePublic.rpc("get_published_page", {
		p_slug: slug,
	});
	if (error) throw new Error(error.message);
	if (!data) return null;

	const r = data as PageRpc;

	// content_images maps mediaId → Cloudflare external_id; turn it into URLs.
	const mediaUrls: Record<string, string> = {};
	for (const [id, externalId] of Object.entries(r.content_images ?? {})) {
		mediaUrls[id] = cfImageUrl(externalId);
	}

	return {
		title: r.title,
		slug: r.slug,
		content: r.content ?? EMPTY_CONTENT,
		mediaUrls,
		updatedAt: r.updated_at,
	};
}
