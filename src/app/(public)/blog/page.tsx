import { BlogIndex } from "./BlogIndex";
import { listPosts } from "@/lib/public/posts";

export const revalidate = 60;

export default async function BlogPage({
	searchParams,
}: {
	searchParams: Promise<{ q?: string }>;
}) {
	const { q } = await searchParams;
	const posts = await listPosts();
	// The filter list is just the categories that actually appear on posts.
	const categories = Array.from(new Set(posts.flatMap((p) => p.categories))).sort();

	return <BlogIndex posts={posts} categories={categories} initialQuery={q ?? ""} />;
}
