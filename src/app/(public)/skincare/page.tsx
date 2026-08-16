import type { Metadata } from "next";
import { CategoryPage } from "@/components/public/CategoryPage";
import type { Product } from "@/components/public/ProductCard";
import { listPosts } from "@/lib/public/posts";
import type { PostSummary } from "@/lib/public/posts";

export const metadata: Metadata = {
	title: "Skincare | A Woman's Confidence",
	description: "Science-backed picks and no-nonsense guides for every skin type.",
};

const products: Product[] = [
	{ brand: "The Ordinary", name: "Niacinamide 10% + Zinc 1%", href: "/" },
	{ brand: "CeraVe", name: "Hydrating Facial Cleanser", href: "/" },
	{ brand: "La Roche-Posay", name: "Anthelios SPF 50+ Invisible Fluid", href: "/" },
	{ brand: "Paula's Choice", name: "2% BHA Liquid Exfoliant", href: "/" },
	{ brand: "Drunk Elephant", name: "C-Firma Fresh Day Serum", href: "/" },
	{ brand: "Tatcha", name: "The Water Cream", href: "/" },
	{ brand: "SkinCeuticals", name: "C E Ferulic Serum", href: "/" },
];

const editorsPicks: PostSummary[] = [
	{
		title: "The Truth About Retinol: Myths vs. Facts",
		slug: "retinol-myths-facts",
		categories: ["Skincare"],
		date: "14th March, 2026",
		excerpt:
			"Retinol is one of the most talked-about skincare ingredients — and one of the most misunderstood. Let's set the record straight.",
		image_url: "",
	},
	{
		title: "The Case for a Minimal Skincare Routine",
		slug: "minimal-skincare-routine",
		categories: ["Skincare"],
		date: "23rd March, 2026",
		excerpt:
			"More steps doesn't mean better skin. We break down a streamlined routine that still covers all the bases.",
		image_url: "",
	},
	{
		title: "The Gut-Skin Connection: What the Research Says",
		slug: "gut-skin-connection",
		categories: ["Skincare", "Wellness"],
		date: "17th March, 2026",
		excerpt:
			"Your gut health and your complexion are more linked than you might think. Here's what the science actually supports.",
		image_url: "",
	},
];

export const revalidate = 60;

export default async function SkincarePage() {
	const posts = await listPosts();
	const categoryPosts = posts.filter((p) => p.categories.includes("Skincare"));
	const [featuredPost, ...sidePosts] = categoryPosts.slice(0, 4);
	const latestPosts = categoryPosts.slice(4, 7);

	return (
		<CategoryPage
			category="Skincare"
			tagline="Science-backed picks and no-nonsense guides for every skin type."
			products={products}
			featuredPost={featuredPost}
			sidePosts={sidePosts}
			latestPosts={latestPosts}
			editorsPicks={editorsPicks}
		/>
	);
}
