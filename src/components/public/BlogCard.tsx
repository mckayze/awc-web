import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { CategoryPills } from "@/components/public/CategoryPills";
import type { PostSummary } from "@/lib/public/posts";

export function BlogCard({ post }: { post: PostSummary }) {
	return (
		<div className="flex flex-col gap-6 md:flex-row md:gap-8">
			<div className="relative w-full aspect-[4/3] md:w-1/2 shrink-0 rounded-base overflow-hidden bg-nav">
				{post.image_url && (
					// eslint-disable-next-line @next/next/no-img-element
					<img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
				)}
			</div>

			<div className="flex flex-col justify-between gap-8">
				<div className="flex flex-col gap-3">
					<div className="flex flex-col gap-1">
						<CategoryPills categories={post.categories} />
						<p className="text-sm text-body shrink-0">{post.date}</p>
					</div>

					<h2 className="text-4xl font-medium text-black leading-snug font-title">{post.title}</h2>

					<p className="text-lg text-body line-clamp-3">{post.excerpt}</p>
				</div>

				<div>
					<Link href={`/blog/${post.slug}`}>
						<Button>Read more</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
