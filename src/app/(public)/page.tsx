import { ArrowRight } from "lucide-react";
import { Section } from "@/components/public/Section";
import { Container } from "@/components/public/Container";
import { SectionHeading } from "@/components/public/SectionHeading";
import { FeaturedPostCard } from "@/components/public/FeaturedPostCard";
import { SidePostCard } from "@/components/public/SidePostCard";
import { TrendingPostCard } from "@/components/public/TrendingPostCard";
import { CategoryScroller } from "@/components/public/CategoryScroller";
import { MailingListCTA } from "@/components/public/MailingListCTA";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import type { PostSummary } from "@/lib/public/posts";

const featuredPost: PostSummary = {
	title: "Battle of the brands: Bullet lipsticks – Satin and matte formulas ranking",
	slug: "skincare-routine",
	categories: ["Skincare", "Lifestyle"],
	date: "April 8, 2026",
	excerpt:
		"We tested over a dozen products to find the perfect morning routine for every skin type. From cleansers to SPF, here's what actually works and why simplicity is the key to glowing skin.",
	// image_url:
	//   "https://awomansconfidence.com/wp-content/uploads/2026/03/Battle-of-the-brands-bullet-lipsticks-1.png",
};

const trendingPosts: PostSummary[] = [
	{
		title: "The Lip Liner Renaissance: Why Everyone's Obsessed Again",
		slug: "lip-liner-renaissance",
		categories: ["Makeup"],
		date: "April 7, 2026",
		excerpt:
			"Lip liners have made a full comeback — and not just for overdrawn lips. Here's how to use them to transform any look.",
		image_url: "",
	},
	{
		title: "SPF Myths Debunked: What Dermatologists Actually Say",
		slug: "spf-myths-debunked",
		categories: ["Skincare"],
		date: "April 6, 2026",
		excerpt:
			"From 'you don't need it indoors' to 'darker skin tones are protected', we're busting the most common SPF misconceptions.",
		image_url: "",
	},
	{
		title: "The Scalp Care Routine That Changed Everything",
		slug: "scalp-care-routine",
		categories: ["Hair Care"],
		date: "April 4, 2026",
		excerpt:
			"Healthy hair starts at the root. These scalp treatments and serums are worth adding to your weekly wash day ritual.",
		image_url: "",
	},
	{
		title: "Perfume Layering 101: Building Your Signature Scent",
		slug: "perfume-layering",
		categories: ["Fragrance"],
		date: "April 3, 2026",
		excerpt:
			"Layering fragrances is an art form — but it's easier than you think. These combinations are a great place to start.",
		image_url: "",
	},
	{
		title: "Morning Supplements Worth Adding to Your Routine",
		slug: "morning-supplements",
		categories: ["Wellness", "Lifestyle"],
		date: "March 31, 2026",
		excerpt:
			"From collagen to adaptogens, we break down which supplements are backed by evidence and which are just hype.",
		image_url: "",
	},
	{
		title: "Blush Placement Tricks That Work for Every Face Shape",
		slug: "blush-placement-tricks",
		categories: ["Makeup"],
		date: "March 29, 2026",
		excerpt:
			"Forget the one-size-fits-all approach. These placement techniques are tailored to your actual bone structure.",
		image_url: "",
	},
];

const sidePosts: PostSummary[] = [
	{
		title: "The Best Foundations for Every Skin Tone",
		slug: "best-foundations",
		categories: ["Makeup"],
		date: "April 5, 2026",
		excerpt:
			"Finding the right foundation shouldn't be a guessing game. We break down the top picks across every shade range and finish.",
		image_url: "",
	},
	{
		title: "Body Care Rituals Worth Adding to Your Week",
		slug: "body-care-rituals",
		categories: ["Body Care", "Lifestyle"],
		date: "April 2, 2026",
		excerpt:
			"From dry brushing to whipped body butters, these simple rituals make a real difference to how your skin looks and feels.",
		image_url: "",
	},
	{
		title: "Clean Beauty: What the Labels Actually Mean",
		slug: "clean-beauty-labels",
		categories: ["Skincare"],
		date: "March 28, 2026",
		excerpt:
			"Natural, non-toxic, clean — the buzzwords are everywhere but the definitions are murky. Here's how to cut through the noise.",
		image_url: "",
	},
];

export default function Home() {
	return (
		<>
			<Section className="border-b border-border bg-white">
				<Container>
					<div className="grid grid-cols-1 gap-8 md:grid-cols-2">
						<div>
							<FeaturedPostCard post={featuredPost} />
						</div>
						<div className="flex flex-col gap-8">
							{sidePosts.map((post) => (
								<div key={post.slug} className="flex-1">
									<SidePostCard post={post} />
								</div>
							))}
						</div>
					</div>
				</Container>
			</Section>

			<Section className="bg-brand border-b border-border">
				<Container>
					<SectionHeading title="Browse by Categories" />
				</Container>
				<CategoryScroller />
			</Section>

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
