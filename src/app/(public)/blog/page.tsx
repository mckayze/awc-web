import { BlogIndex } from "./BlogIndex";
import { listPosts } from "@/lib/public/posts";

export const revalidate = 60;

// Deliberately does not read `searchParams` — doing so opts the route out of
// caching entirely, so the page would re-render on every visit and never reach
// R2. The `?q=` from the navbar is picked up client-side in BlogIndex instead.
export default async function BlogPage() {
	const posts = await listPosts();
	// The filter list is just the categories that actually appear on posts.
	const categories = Array.from(new Set(posts.flatMap((p) => p.categories))).sort();

	return <BlogIndex posts={posts} categories={categories} />;
}
