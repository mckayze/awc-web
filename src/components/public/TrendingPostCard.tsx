import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import type { Post } from "./BlogCard";

type TrendingPostCardProps = {
	post: Post;
	variant?: "default" | "minimal";
};

export function TrendingPostCard({ post, variant = "default" }: TrendingPostCardProps) {
	const minimal = variant === "minimal";

	return (
		<div className="flex flex-col gap-3 h-full">
			{/* Image */}
			<div className="w-full aspect-[16/9] rounded-base bg-nav overflow-hidden border border-border">
				{post.image_url && (
					// eslint-disable-next-line @next/next/no-img-element
					<img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
				)}
			</div>

			{/* Content */}
			<div className="flex flex-col gap-2 flex-1 justify-between">
				{!minimal && (
					<div className="flex items-center justify-between gap-4">
						<div className="flex flex-wrap gap-2">
							{post.categories.map((cat) => (
								<Pill key={cat} label={cat} />
							))}
						</div>
						<p className="text-xs text-body shrink-0">{post.date}</p>
					</div>
				)}

				<h2 className="text-[22px] font-medium text-black leading-snug mt-1">{post.title}</h2>

				{!minimal && <p className="text-base text-body line-clamp-2 flex-1">{post.excerpt}</p>}

				<div className="mt-4">
					<Link href={`/blog/${post.slug}`}>
						<Button variant="dark">Read more</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
