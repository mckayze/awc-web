import Link from "next/link";
import { CategoryPills } from "@/components/public/CategoryPills";
import type { PostSummary } from "@/lib/public/posts";

export function SidePostCard({ post }: { post: PostSummary }) {
	const href = `/blog/${post.slug}`;

	// The image and the title are the two links into the post. Only those two
	// trigger the title underline — hovering the tags leaves it alone.
	return (
		<div className="group flex gap-3 items-stretch h-full">
			{/* Image */}
			<Link
				href={href}
				aria-hidden="true"
				tabIndex={-1}
				className="card-media w-44 sm:w-44 self-stretch rounded-md bg-nav shrink-0 overflow-hidden block"
			>
				{post.image_url && (
					// eslint-disable-next-line @next/next/no-img-element
					<img src={post.image_url} alt="" className="w-full h-full object-cover" />
				)}
			</Link>

			{/* Content */}
			<div className="flex flex-col gap-5 flex-1 py-3 pr-3">
				<CategoryPills categories={post.categories} />

				<h3 className="text-2xl sm:text-4xl font-medium text-black leading-snug font-title line-clamp-2 min-h-[calc(2*1.375em)]">
					<Link
						href={href}
						className="underline-offset-4 decoration-1 hover:underline focus-visible:underline group-has-[.card-media:hover]:underline"
					>
						{post.title}
					</Link>
				</h3>
			</div>
		</div>
	);
}
