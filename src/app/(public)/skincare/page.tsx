import type { Metadata } from "next";
import { CategoryPage } from "@/components/public/CategoryPage";
import type { Product } from "@/components/public/ProductCard";
import { getEditorsPicks, listPosts } from "@/lib/public/posts";

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

export const revalidate = 60;

export default async function SkincarePage() {
	const [posts, editorsPicks] = await Promise.all([listPosts(), getEditorsPicks("skincare")]);
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
