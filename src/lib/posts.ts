import { supabaseBrowser } from "@/lib/supabase/browser";
import { cfImageUrl } from "@/lib/media";
import { EMPTY_CONTENT } from "@/lib/content";
import type { PostContent } from "@/lib/content";

// The admin-side model: everything the editor needs to read and write a post.
// The public site reads the same rows through `lib/public/posts.ts`, which
// exposes only the published, anon-safe shape.
//
// The block content model now lives in `lib/content.ts` — one definition for
// both halves of the app. Re-exported here because the whole BlockEditor
// imports those types from this module.
export { EMPTY_CONTENT };
export type { Block, BlockType, PostColumn, PostContent } from "@/lib/content";

// ── Post types ─────────────────────────────────────────────────────

export type PostStatus = "draft" | "published";

// "scheduled" is derived, never stored: a published post with a future
// published_at. Use postState() for the label.
export type PostState = "draft" | "scheduled" | "published";

export type PostCategory = { id: string; name: string; slug: string };

export type Post = {
	id: string;
	title: string;
	slug: string;
	excerpt: string | null;
	content: PostContent;
	status: PostStatus;
	featuredImageId: string | null;
	featuredImageUrl: string | null;
	authorId: string;
	authorName: string;
	publishedAt: string | null;
	createdAt: string;
	updatedAt: string;
	categories: PostCategory[];
};

export function postState(status: PostStatus, publishedAt: string | null): PostState {
	if (status !== "published") return "draft";
	if (publishedAt && new Date(publishedAt) > new Date()) return "scheduled";
	return "published";
}

// ── Mapping ────────────────────────────────────────────────────────

type PostRow = {
	id: string;
	title: string;
	slug: string;
	excerpt: string | null;
	content: PostContent | null;
	status: PostStatus;
	featured_image_id: string | null;
	author_id: string;
	published_at: string | null;
	created_at: string;
	updated_at: string;
	author: { full_name: string | null; username: string | null } | null;
	featured: { external_id: string; mime_type: string } | null;
	categories: { category: PostCategory | null }[] | null;
};

function mapRow(r: PostRow): Post {
	return {
		id: r.id,
		title: r.title,
		slug: r.slug,
		excerpt: r.excerpt,
		content: r.content ?? EMPTY_CONTENT,
		status: r.status,
		featuredImageId: r.featured_image_id,
		featuredImageUrl:
			r.featured && r.featured.mime_type.startsWith("image/")
				? cfImageUrl(r.featured.external_id)
				: null,
		authorId: r.author_id,
		authorName: r.author?.full_name ?? r.author?.username ?? "Unknown",
		publishedAt: r.published_at,
		createdAt: r.created_at,
		updatedAt: r.updated_at,
		categories: (r.categories ?? [])
			.map((c) => c.category)
			.filter((c): c is PostCategory => c !== null),
	};
}

const LIST_SELECT =
	"id, title, slug, excerpt, status, featured_image_id, author_id, published_at, created_at, updated_at," +
	" author:author_id(full_name, username)," +
	" featured:featured_image_id(external_id, mime_type)," +
	" categories:post_categories(category:category_id(id, name, slug))";

const FULL_SELECT = `${LIST_SELECT}, content`;

// ── Queries ────────────────────────────────────────────────────────

export async function listPosts(): Promise<Post[]> {
	const { data, error } = await supabaseBrowser()
		.from("posts")
		.select(LIST_SELECT)
		.order("created_at", { ascending: false });
	if (error) throw new Error(error.message);
	return ((data as unknown as PostRow[]) ?? []).map(mapRow);
}

export async function getPostById(id: string): Promise<Post | null> {
	const { data, error } = await supabaseBrowser()
		.from("posts")
		.select(FULL_SELECT)
		.eq("id", id)
		.maybeSingle();
	if (error) throw new Error(error.message);
	return data ? mapRow(data as unknown as PostRow) : null;
}

export type PostInput = {
	title: string;
	slug: string;
	excerpt?: string | null;
	content: PostContent;
	status: PostStatus;
	featuredImageId?: string | null;
	publishedAt?: string | null;
};

function toRow(input: PostInput) {
	return {
		title: input.title,
		slug: input.slug,
		excerpt: input.excerpt ?? null,
		content: input.content,
		status: input.status,
		featured_image_id: input.featuredImageId ?? null,
		published_at: input.publishedAt ?? null,
	};
}

// author_id defaults to auth.uid() in the DB (required by the insert policy).
export async function createPost(input: PostInput): Promise<string> {
	const { data, error } = await supabaseBrowser()
		.from("posts")
		.insert(toRow(input))
		.select("id")
		.single();
	if (error) throw new Error(error.message);
	return data.id;
}

export async function updatePost(id: string, input: PostInput): Promise<void> {
	const { error } = await supabaseBrowser().from("posts").update(toRow(input)).eq("id", id);
	if (error) throw new Error(error.message);
}

export async function deletePost(id: string): Promise<void> {
	const { error } = await supabaseBrowser().from("posts").delete().eq("id", id);
	if (error) throw new Error(error.message);
}

// Replaces the post's category set (delete-all then insert-selected).
export async function setPostCategories(postId: string, categoryIds: string[]): Promise<void> {
	const { error: delErr } = await supabaseBrowser()
		.from("post_categories")
		.delete()
		.eq("post_id", postId);
	if (delErr) throw new Error(delErr.message);

	if (categoryIds.length === 0) return;

	const { error: insErr } = await supabaseBrowser()
		.from("post_categories")
		.insert(categoryIds.map((category_id) => ({ post_id: postId, category_id })));
	if (insErr) throw new Error(insErr.message);
}
