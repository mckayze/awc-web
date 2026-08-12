import Link from "next/link";
import { Pill } from "@/components/ui/Pill";
import type { PostSummary } from "@/lib/public/posts";

export function FeaturedPostCard({ post }: { post: PostSummary }) {
	const href = `/blog/${post.slug}`;

	// The image and the title are the two links into the post. Only those two
	// trigger the title underline — hovering the tags or date leaves it alone.
	return (
		<div className="group flex flex-col gap-4 h-full">
			{/* Image */}
			<Link
				href={href}
				aria-hidden="true"
				tabIndex={-1}
				className="card-media w-full aspect-[16/9] rounded-md bg-nav overflow-hidden block"
			>
				{post.image_url && (
					// eslint-disable-next-line @next/next/no-img-element
					<img src={post.image_url} alt="" className="w-full h-full object-cover" />
				)}
			</Link>

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
					<Link
						href={href}
						className="underline-offset-4 decoration-1 hover:underline focus-visible:underline group-has-[.card-media:hover]:underline"
					>
						{post.title}
					</Link>
				</h2>
			</div>
		</div>
	);
}
