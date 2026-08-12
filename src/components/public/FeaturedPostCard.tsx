import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import type { PostSummary } from "@/lib/public/posts";

export function FeaturedPostCard({ post }: { post: PostSummary }) {
	return (
		<div className="flex flex-col gap-4 h-full">
			{/* Image */}
			<div className="w-full aspect-[16/9] rounded-md bg-nav overflow-hidden">
				{post.image_url && (
					// eslint-disable-next-line @next/next/no-img-element
					<img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
				)}
			</div>

			{/* Content */}
			<div className="flex flex-col gap-3 flex-1">
				<div className="flex items-center justify-between gap-4">
					<div className="flex flex-wrap gap-2">
						{post.categories.map((cat) => (
							<Pill key={cat} label={cat} />
						))}
					</div>
					<p className="text-sm text-body shrink-0">{post.date}</p>
				</div>

				<h2 className="text-3xl sm:text-5xl font-medium text-black leading-snug font-title">
					{post.title}
				</h2>

				<p className="text-sm sm:text-lg text-body/70 line-clamp-3 flex-1">{post.excerpt}</p>

				<div>
					<Link href={`/blog/${post.slug}`}>
						<Button variant="dark">Read more</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
