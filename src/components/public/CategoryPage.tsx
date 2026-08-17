import { Section } from "./Section";
import { Container } from "./Container";
import { SectionHeading } from "./SectionHeading";
import { TrendingPostCard } from "./TrendingPostCard";
import { FeaturedPostCard } from "./FeaturedPostCard";
import { SidePostCard } from "./SidePostCard";
import { MailingListCTA } from "./MailingListCTA";
import type { Product } from "./ProductCard";
import type { PostSummary } from "@/lib/public/posts";

type CategoryPageProps = {
	category: string;
	tagline: string;
	products: Product[];
	featuredPost?: PostSummary;
	sidePosts?: PostSummary[];
	editorsPicks: PostSummary[];
};

export function CategoryPage({
	category,
	tagline,
	products,
	featuredPost,
	sidePosts = [],
	editorsPicks,
}: CategoryPageProps) {
	return (
		<>
			{/* Hero */}
			<Section className="bg-white border-b border-border">
				<Container>
					<h1 className="text-5xl md:text-7xl font-bold leading-tight">{category}</h1>
					<p className="text-body text-xl mt-4">{tagline}</p>

					{featuredPost && (
						<div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
							<div>
								<FeaturedPostCard post={featuredPost} />
							</div>
							<div className="grid grid-rows-3 gap-8">
								{sidePosts.map((post) => (
									<SidePostCard key={post.slug} post={post} />
								))}
							</div>
						</div>
					)}
				</Container>
			</Section>

			{/* Editor's Picks */}
			<Section className="bg-white border-b border-border">
				<Container>
					<SectionHeading title="Editor's Picks" />
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
						{editorsPicks.map((post) => (
							<TrendingPostCard key={post.slug} post={post} />
						))}
					</div>
				</Container>
			</Section>

			<Section className="bg-brand">
				<Container>
					<MailingListCTA />
				</Container>
			</Section>
		</>
	);
}
