import { supabaseBrowser } from "@/lib/supabase/browser";
import type { PostContent } from "@/lib/posts";
import { EMPTY_CONTENT } from "@/lib/posts";

// Site pages (Privacy Policy, Terms of Use, …). Content reuses the post block
// model, so the BlockEditor and the frontend renderer work unchanged.
// `isSystem` pages are built-in and can't be deleted (enforced in RLS too).

export type PageStatus = "draft" | "published";

export type Page = {
	id: string;
	title: string;
	slug: string;
	content: PostContent;
	status: PageStatus;
	isSystem: boolean;
	createdAt: string;
	updatedAt: string;
};

type PageRow = {
	id: string;
	title: string;
	slug: string;
	content: PostContent | null;
	status: PageStatus;
	is_system: boolean;
	created_at: string;
	updated_at: string;
};

function mapRow(r: PageRow): Page {
	return {
		id: r.id,
		title: r.title,
		slug: r.slug,
		content: r.content ?? EMPTY_CONTENT,
		status: r.status,
		isSystem: r.is_system,
		createdAt: r.created_at,
		updatedAt: r.updated_at,
	};
}

const LIST_SELECT = "id, title, slug, status, is_system, created_at, updated_at";
const FULL_SELECT = `${LIST_SELECT}, content`;

export async function listPages(): Promise<Page[]> {
	const { data, error } = await supabaseBrowser().from("pages").select(LIST_SELECT).order("title");
	if (error) throw new Error(error.message);
	return ((data as unknown as PageRow[]) ?? []).map(mapRow);
}

export async function getPageById(id: string): Promise<Page | null> {
	const { data, error } = await supabaseBrowser()
		.from("pages")
		.select(FULL_SELECT)
		.eq("id", id)
		.maybeSingle();
	if (error) throw new Error(error.message);
	return data ? mapRow(data as unknown as PageRow) : null;
}

// Pages are edit-only for now: title, content and status. Slug is fixed (the
// frontend links to system pages by slug), so it isn't part of the update.
export type PageInput = {
	title: string;
	content: PostContent;
	status: PageStatus;
};

export async function updatePage(id: string, input: PageInput): Promise<void> {
	const { error } = await supabaseBrowser()
		.from("pages")
		.update({ title: input.title, content: input.content, status: input.status })
		.eq("id", id);
	if (error) throw new Error(error.message);
}
