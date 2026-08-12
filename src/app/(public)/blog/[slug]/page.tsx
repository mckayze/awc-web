import { notFound } from "next/navigation";
import { PostArticle } from "@/components/public/PostArticle";
import { getPostBySlug, listPosts } from "@/lib/public/posts";

export const revalidate = 60;

// Returning an empty list is not a no-op: it is what registers this route as
// ISR-capable, so rendered posts get stored in the R2 incremental cache. Drop
// this function and the route falls back to rendering on every request.
//
// Empty rather than the real slug list so builds don't depend on Supabase and
// don't scale with post count — `dynamicParams` (true by default) renders each
// post on first visit, then serves it from cache until `revalidate` lapses.
export async function generateStaticParams() {
	return [];
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const post = await getPostBySlug(slug);
	if (!post) notFound();

	// Adjacent + related posts come from the published list (newest first).
	const all = await listPosts();
	const idx = all.findIndex((p) => p.slug === slug);
	const prevPost = idx > 0 ? all[idx - 1] : null;
	const nextPost = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;

	const sameCategory = all.filter(
		(p) => p.slug !== slug && p.categories.some((c) => post.categories.includes(c)),
	);
	const related = (sameCategory.length ? sameCategory : all.filter((p) => p.slug !== slug)).slice(
		0,
		2,
	);

	return <PostArticle post={post} prevPost={prevPost} nextPost={nextPost} related={related} />;
}
