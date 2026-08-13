import type { Metadata } from "next";
import { CategoryPage } from "@/components/public/CategoryPage";
import type { Product } from "@/components/public/ProductCard";
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

const latestPosts: PostSummary[] = [
	{
		title: "Battle of the Brands: Bullet Lipsticks – Satin and Matte Formulas Ranked",
		slug: "bullet-lipsticks-ranked",
		categories: ["Makeup"],
		date: "8th April, 2026",
		excerpt:
			"We tested over a dozen bullet lipsticks to find the best satin and matte formulas across every price point.",
		image_url: "",
	},
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
		title: "Blush Placement Tricks That Work for Every Face Shape",
		slug: "blush-placement-tricks",
		categories: ["Makeup"],
		date: "29th March, 2026",
		excerpt:
			"Forget the one-size-fits-all approach. These placement techniques are tailored to your actual bone structure.",
		image_url: "",
	},
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

export default function MakeupPage() {
	return (
		<CategoryPage
			category="Makeup"
			tagline="Honest reviews, tutorials, and the products actually worth your money."
			products={products}
			latestPosts={latestPosts}
			editorsPicks={editorsPicks}
		/>
	);
}
