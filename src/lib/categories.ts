import { supabaseBrowser } from "@/lib/supabase/browser";

export type Category = {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	created_by: string | null;
	created_at: string;
	updated_at: string;
	/** Number of posts using this category. 0 until posts + the
	 * post_categories join table exist (see listCategories). */
	post_count: number;
};

/** Lowercase, hyphenated, alphanumeric slug derived from a name. */
export function slugify(value: string): string {
	return value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export async function listCategories(): Promise<Category[]> {
	// TODO(posts): once the post_categories join table exists, swap the select
	// for `*, post_count:post_categories(count)` to get a live count per row.
	const { data, error } = await supabaseBrowser().from("categories").select("*").order("name");
	if (error) throw new Error(error.message);
	return (data ?? []).map((c) => ({ ...c, post_count: 0 }));
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
