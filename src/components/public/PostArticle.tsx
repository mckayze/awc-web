import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Section } from "@/components/public/Section";
import { Container } from "@/components/public/Container";
import { Pill } from "@/components/ui/Pill";
import { NewsletterBar } from "@/components/public/NewsletterBar";
import { TrendingPostCard } from "@/components/public/TrendingPostCard";
import { PostBody } from "@/components/public/PostBody";
import { PROSE_WIDTH } from "@/lib/layout";
import type { FullPost, PostSummary } from "@/lib/public/posts";

// The rendered post, with no data fetching of its own. Two routes render it:
// the live page at /blog/[slug], and the draft preview under /admin. Keeping
// it here is what makes the preview a real preview — one copy of the markup,
// so the two can't drift.
//
// Neighbours and related posts are optional because they come from the
// published list, which a draft isn't in. Preview passes none and the sections
// drop out, rather than showing an arbitrary two posts as "related".

export function PostArticle({
	post,
	prevPost = null,
	nextPost = null,
	related = [],
}: {
	post: FullPost;
	prevPost?: PostSummary | null;
	nextPost?: PostSummary | null;
	related?: PostSummary[];
}) {
	return (
		<div className="bg-white">
			<Section className="border-b border-border">
				<Container>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
						{/* Left column */}
						<div className="flex flex-col gap-6">
							<div className="flex items-center justify-between">
								<div className="flex flex-wrap gap-2">
									{post.categories.map((cat) => (
										<Pill key={cat} label={cat} />
									))}
								</div>
								<span className="text-sm text-body/60">{post.date}</span>
							</div>

							<h1 className="text-4xl md:text-5xl font-bold text-black leading-tight">
								{post.title}
							</h1>

							{post.excerpt && <p className="text-xl text-body">{post.excerpt}</p>}
						</div>

						{/* Right column — featured image */}
						<div className="bg-nav border border-border aspect-[4/3] w-full overflow-hidden">
							{post.image_url && (
								// eslint-disable-next-line @next/next/no-img-element
								<img
									src={post.image_url}
									alt={post.title}
									className="w-full h-full object-cover"
								/>
							)}
						</div>
					</div>
				</Container>
			</Section>

			<Section className="bg-brand border-b border-border" py="py-14">
				<Container>
					<NewsletterBar />
				</Container>
			</Section>

			<Section>
				<Container>
					<div className={`${PROSE_WIDTH} mx-auto w-full`}>
						<PostBody content={post.content} mediaUrls={post.mediaUrls} />
					</div>
				</Container>
			</Section>

			{(prevPost || nextPost) && (
				<>
					<Section py="py-0">
						<Container>
							<div className={`${PROSE_WIDTH} mx-auto w-full`}>
								<hr className="border-border" />
							</div>
						</Container>
					</Section>

					<Section>
						<Container>
							<div className={`${PROSE_WIDTH} mx-auto w-full grid grid-cols-1 md:grid-cols-2`}>
								{prevPost && (
									<Link
										href={`/blog/${prevPost.slug}`}
										className="flex flex-col gap-3 transition-colors group"
									>
										<span className="flex items-center gap-2 text-sm font-medium text-body/60">
											<ChevronLeft size={15} />
											Previous post
										</span>
										<p className="text-xl font-bold text-black leading-snug group-hover:underline underline-offset-4">
											{prevPost.title}
										</p>
									</Link>
								)}

								{nextPost && (
									<Link
										href={`/blog/${nextPost.slug}`}
										className="flex flex-col gap-3 transition-colors group md:items-end md:col-start-2"
									>
										<span className="flex items-center gap-2 text-sm font-medium text-body/60">
											Next post
											<ChevronRight size={15} />
										</span>
										<p className="text-xl font-bold text-black leading-snug group-hover:underline underline-offset-4 md:text-right">
											{nextPost.title}
										</p>
									</Link>
								)}
							</div>
						</Container>
					</Section>
				</>
			)}

			{related.length > 0 && (
				<>
					<Section py="py-0">
						<Container>
							<div className={`${PROSE_WIDTH} mx-auto w-full`}>
								<hr className="border-border" />
							</div>
						</Container>
					</Section>

					<Section>
						<Container>
							<div className={`${PROSE_WIDTH} mx-auto w-full flex flex-col gap-8`}>
								<h2 className="text-2xl md:text-3xl font-bold text-black text-center">
									Posts you might like
								</h2>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-12">
									{related.map((p) => (
										<TrendingPostCard key={p.slug} post={p} variant="minimal" />
									))}
								</div>
							</div>
						</Container>
					</Section>
				</>
			)}
		</div>
	);
}
