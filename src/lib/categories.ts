import { supabaseBrowser } from "@/lib/supabase/browser";

export { slugify } from "@/lib/slug";

export type Category = {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	created_by: string | null;
	created_at: string;
	updated_at: string;
	post_count: number;
};

export async function listCategories(): Promise<Category[]> {
	const { data, error } = await supabaseBrowser()
		.from("categories")
		.select("*, post_categories(count)")
		.order("name");
	if (error) throw new Error(error.message);
	return (data ?? []).map(({ post_categories, ...c }) => ({
		...c,
		post_count: (post_categories as { count: number }[])[0]?.count ?? 0,
	}));
}

export async function getCategoryById(id: string): Promise<Category | null> {
	const { data, error } = await supabaseBrowser()
		.from("categories")
		.select("*")
		.eq("id", id)
		.maybeSingle();
	if (error) throw new Error(error.message);
	return data ? { ...data, post_count: 0 } : null;
}

export type CategoryInput = {
	name: string;
	slug: string;
	description?: string | null;
};

// created_by defaults to auth.uid() in the DB (required by the insert RLS policy).
export async function createCategory(input: CategoryInput) {
	const { error } = await supabaseBrowser().from("categories").insert(input);
	if (error) throw new Error(error.message);
}

export async function updateCategory(id: string, input: CategoryInput) {
	const { error } = await supabaseBrowser().from("categories").update(input).eq("id", id);
	if (error) throw new Error(error.message);
}

export async function deleteCategory(id: string) {
	const { error } = await supabaseBrowser().from("categories").delete().eq("id", id);
	if (error) throw new Error(error.message);
}

export async function countCategoryPosts(id: string): Promise<number> {
	const { count, error } = await supabaseBrowser()
		.from("post_categories")
		.select("post_id", { count: "exact", head: true })
		.eq("category_id", id);
	if (error) throw new Error(error.message);
	return count ?? 0;
}

// Adds toId to every post currently in fromId (duplicates ignored via the
// post_categories (post_id, category_id) primary key), so a post that already
// has both categories just keeps toId once the old one is removed. Doesn't
// remove fromId itself — the caller deletes the category, which cascades.
export async function migrateCategoryPosts(fromId: string, toId: string): Promise<void> {
	const { data, error } = await supabaseBrowser()
		.from("post_categories")
		.select("post_id")
		.eq("category_id", fromId);
	if (error) throw new Error(error.message);
	if (!data || data.length === 0) return;

	const { error: upsertErr } = await supabaseBrowser()
		.from("post_categories")
		.upsert(
			data.map(({ post_id }) => ({ post_id, category_id: toId })),
			{ onConflict: "post_id,category_id", ignoreDuplicates: true },
		);
	if (upsertErr) throw new Error(upsertErr.message);
}

export type EditorsPick = { id: string; title: string };

// Posts currently featured as Editor's Picks under this category, in display
// order. Titles come along so the admin UI never has to fetch the full post
// list just to label a handful of picks.
export async function listEditorsPicks(categoryId: string): Promise<EditorsPick[]> {
	const { data, error } = await supabaseBrowser()
		.from("editors_picks")
		.select("post_id, post:post_id(title)")
		.eq("category_id", categoryId)
		.order("position");
	if (error) throw new Error(error.message);
	return (data ?? []).map((r) => ({
		id: r.post_id as string,
		title: (r.post as unknown as { title: string } | null)?.title ?? "Untitled post",
	}));
}

// Replaces the category's Editor's Picks set (delete-all then insert-selected,
// same pattern as setPostCategories). Order of postIds becomes display order.
export async function setEditorsPicks(categoryId: string, postIds: string[]): Promise<void> {
	const { error: delErr } = await supabaseBrowser()
		.from("editors_picks")
		.delete()
		.eq("category_id", categoryId);
	if (delErr) throw new Error(delErr.message);

	if (postIds.length === 0) return;

	const { error: insErr } = await supabaseBrowser()
		.from("editors_picks")
		.insert(postIds.map((post_id, position) => ({ category_id: categoryId, post_id, position })));
	if (insErr) throw new Error(insErr.message);
}
