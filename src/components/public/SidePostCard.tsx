import { Pill } from "@/components/ui/Pill";
import type { Post } from "./BlogCard";

export function SidePostCard({ post }: { post: Post }) {
	return (
		<div className="flex gap-3 items-stretch h-full">
			{/* Image */}
			<div className="w-44 sm:w-44 self-stretch rounded-base bg-nav shrink-0 border border-border overflow-hidden">
				{post.image_url && (
					// eslint-disable-next-line @next/next/no-img-element
					<img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
				)}
			</div>

			{/* Content */}
			<div className="flex flex-col gap-5 flex-1 py-3 pr-3">
				<div className="flex flex-wrap gap-2">
					{post.categories.map((cat) => (
						<Pill key={cat} label={cat} />
					))}
				</div>

				<h3 className="text-2xl sm:text-3xl font-medium text-black leading-snug font-title">
					{post.title}
				</h3>
			</div>
		</div>
	);
}
