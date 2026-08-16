import type { Metadata } from "next";
import { CategoryPage } from "@/components/public/CategoryPage";
import type { Product } from "@/components/public/ProductCard";
import { listPosts } from "@/lib/public/posts";
import type { PostSummary } from "@/lib/public/posts";

export const metadata: Metadata = {
	title: "Makeup | A Woman's Confidence",
	description: "Honest reviews, tutorials, and the products actually worth your money.",
};

const products: Product[] = [
	{ brand: "Charlotte Tilbury", name: "Pillow Talk Lipstick", href: "/" },
	{ brand: "NARS", name: "Sheer Glow Foundation", href: "/" },
	{ brand: "Rare Beauty", name: "Soft Pinch Liquid Blush", href: "/" },
	{ brand: "Fenty Beauty", name: "Gloss Bomb Universal Lip Luminizer", href: "/" },
	{ brand: "Dior", name: "Diorshow Iconic Overcurl Mascara", href: "/" },
	{ brand: "Armani Beauty", name: "Luminous Silk Foundation", href: "/" },
	{ brand: "Hourglass", name: "Ambient Lighting Powder", href: "/" },
];

const editorsPicks: PostSummary[] = [
	{
		title: "Eyeshadow Palettes Worth the Investment",
		slug: "eyeshadow-palettes-investment",
		categories: ["Makeup"],
		date: "16th March, 2026",
		excerpt:
			"Not every palette deserves a place in your kit. These are the ones with payoff, blendability, and staying power.",
		image_url: "",
	},
	{
		title: "Concealer 101: Matching, Blending, and Setting",
		slug: "concealer-101",
		categories: ["Makeup"],
		date: "11th March, 2026",
		excerpt:
			"Concealer is deceptively tricky. Here's the full breakdown on shades, undertones, textures, and how to make it last.",
		image_url: "",
	},
	{
		title: "5 Mascaras That Deliver on Length Without Clumping",
		slug: "mascaras-length-no-clump",
		categories: ["Makeup"],
		date: "22nd March, 2026",
		excerpt:
			"Long, separated lashes without the spider effect. These formulas passed every blink test we threw at them.",
		image_url: "",
	},
];

export const revalidate = 60;

export default async function MakeupPage() {
	const posts = await listPosts();
	const categoryPosts = posts.filter((p) => p.categories.includes("Makeup"));
	const [featuredPost, ...sidePosts] = categoryPosts.slice(0, 4);
	const latestPosts = categoryPosts.slice(4, 7);

	return (
		<CategoryPage
			category="Makeup"
			tagline="Honest reviews, tutorials, and the products actually worth your money."
			products={products}
			featuredPost={featuredPost}
			sidePosts={sidePosts}
			latestPosts={latestPosts}
			editorsPicks={editorsPicks}
		/>
	);
}
