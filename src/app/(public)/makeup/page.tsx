import type { Metadata } from "next";
import { CategoryPage } from "@/components/public/CategoryPage";
import type { Product } from "@/components/public/ProductCard";
import { getEditorsPicks, listPosts } from "@/lib/public/posts";

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

export const revalidate = 60;

export default async function MakeupPage() {
	const [posts, editorsPicks] = await Promise.all([listPosts(), getEditorsPicks("makeup")]);
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
