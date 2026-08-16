import type { Metadata } from "next";
import { CategoryPage } from "@/components/public/CategoryPage";
import type { Product } from "@/components/public/ProductCard";
import { getEditorsPicks, listPosts } from "@/lib/public/posts";

export const metadata: Metadata = {
	title: "Lifestyle | A Woman's Confidence",
	description:
		"The rituals, habits, and products that make everyday life feel a little better.",
};

const products: Product[] = [
	{ brand: "Lumie", name: "Bodyclock Shine 300 Wake-Up Light", href: "/" },
	{ brand: "Bamford", name: "Lavender Pillow Mist", href: "/" },
	{ brand: "Nourished", name: "Personalised Vitamin Stack", href: "/" },
	{ brand: "Muji", name: "Ultrasonic Aroma Diffuser", href: "/" },
	{ brand: "Casper", name: "Reverie Sleep Spray", href: "/" },
	{ brand: "Aromatherapy Associates", name: "Deep Relax Bath Oil", href: "/" },
	{ brand: "Therabody", name: "TheraFace Mask", href: "/" },
];

export const revalidate = 60;

export default async function LifestylePage() {
	const [posts, editorsPicks] = await Promise.all([listPosts(), getEditorsPicks("lifestyle")]);
	const categoryPosts = posts.filter((p) => p.categories.includes("Lifestyle"));
	const [featuredPost, ...sidePosts] = categoryPosts.slice(0, 4);
	const latestPosts = categoryPosts.slice(4, 7);

	return (
		<CategoryPage
			category="Lifestyle"
			tagline="The rituals, habits, and products that make everyday life feel a little better."
			products={products}
			featuredPost={featuredPost}
			sidePosts={sidePosts}
			latestPosts={latestPosts}
			editorsPicks={editorsPicks}
		/>
	);
}
