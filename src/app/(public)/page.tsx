import { ArrowRight } from "lucide-react";
import { Section } from "@/components/public/Section";
import { Container } from "@/components/public/Container";
import { SectionHeading } from "@/components/public/SectionHeading";
import { FeaturedPostCard } from "@/components/public/FeaturedPostCard";
import { SidePostCard } from "@/components/public/SidePostCard";
import { TrendingPostCard } from "@/components/public/TrendingPostCard";
import { MailingListCTA } from "@/components/public/MailingListCTA";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { listPosts } from "@/lib/public/posts";
import type { PostSummary } from "@/lib/public/posts";

const trendingPosts: PostSummary[] = [
	{
		title: "The Lip Liner Renaissance: Why Everyone's Obsessed Again",
		slug: "lip-liner-renaissance",
		categories: ["Makeup"],
		date: "7th April, 2026",
		excerpt:
			"Lip liners have made a full comeback — and not just for overdrawn lips. Here's how to use them to transform any look.",
		image_url: "",
	},
	{
		title: "SPF Myths Debunked: What Dermatologists Actually Say",
		slug: "spf-myths-debunked",
		categories: ["Skincare"],
		date: "6th April, 2026",
		excerpt:
			"From 'you don't need it indoors' to 'darker skin tones are protected', we're busting the most common SPF misconceptions.",
		image_url: "",
	},
	{
		title: "The Scalp Care Routine That Changed Everything",
		slug: "scalp-care-routine",
		categories: ["Hair Care"],
		date: "4th April, 2026",
		excerpt:
			"Healthy hair starts at the root. These scalp treatments and serums are worth adding to your weekly wash day ritual.",
		image_url: "",
	},
	{
		title: "Perfume Layering 101: Building Your Signature Scent",
		slug: "perfume-layering",
		categories: ["Fragrance"],
		date: "3rd April, 2026",
		excerpt:
			"Layering fragrances is an art form — but it's easier than you think. These combinations are a great place to start.",
		image_url: "",
	},
	{
		title: "Morning Supplements Worth Adding to Your Routine",
		slug: "morning-supplements",
		categories: ["Wellness", "Lifestyle"],
		date: "31st March, 2026",
		excerpt:
			"From collagen to adaptogens, we break down which supplements are backed by evidence and which are just hype.",
		image_url: "",
	},
	{
		title: "Blush Placement Tricks That Work for Every Face Shape",
		slug: "blush-placement-tricks",
		categories: ["Makeup"],
		date: "29th March, 2026",
		excerpt:
			"Forget the one-size-fits-all approach. These placement techniques are tailored to your actual bone structure.",
		image_url: "",
	},
];

export const revalidate = 60;

export default async function Home() {
	const posts = await listPosts();
	// Left is the most recent post; the right column runs 2nd-most-recent at
	// the top down to 4th-most-recent at the bottom.
	const [featuredPost, ...sidePosts] = posts.slice(0, 4);

	return (
		<>
			{featuredPost && (
				<Section className="border-b border-border bg-white">
					<Container>
						<div className="grid grid-cols-1 gap-8 md:grid-cols-2">
							<div>
								<FeaturedPostCard post={featuredPost} />
							</div>
							<div className="grid grid-rows-3 gap-8">
								{sidePosts.map((post) => (
									<SidePostCard key={post.slug} post={post} />
								))}
							</div>
						</div>
					</Container>
				</Section>
			)}

			<Section className="border-b border-border bg-white">
				<Container>
					<SectionHeading
						title="Trending Posts"
						action={
							<Button variant="text" rightIcon={<ArrowRight size={16} />}>
								View all
							</Button>
						}
					/>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
						{trendingPosts.map((post) => (
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
