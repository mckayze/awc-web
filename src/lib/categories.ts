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
