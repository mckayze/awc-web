import type { Metadata } from "next";
import { CategoryPage } from "@/components/public/CategoryPage";
import type { Product } from "@/components/public/ProductCard";
import { listPosts } from "@/lib/public/posts";
import type { PostSummary } from "@/lib/public/posts";

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

const editorsPicks: PostSummary[] = [
	{
		title: "The Sunday Reset Routine That Actually Sticks",
		slug: "sunday-reset-routine",
		categories: ["Lifestyle", "Wellness"],
		date: "9th March, 2026",
		excerpt:
			"A weekly reset doesn't have to be elaborate. These simple habits make Monday feel like a fresh start.",
		image_url: "",
	},
	{
		title: "Movement Practices That Don't Feel Like Exercise",
		slug: "movement-practices",
		categories: ["Wellness"],
		date: "12th March, 2026",
		excerpt:
			"If the gym isn't for you, there are still plenty of ways to move your body joyfully. Here are some worth trying.",
		image_url: "",
	},
	{
		title: "How to Build a Capsule Fragrance Wardrobe",
		slug: "capsule-fragrance-wardrobe",
		categories: ["Fragrance", "Lifestyle"],
		date: "15th March, 2026",
		excerpt:
			"Three to five scents can cover every occasion if you choose them wisely. Here's the framework to build yours.",
		image_url: "",
	},
];

export const revalidate = 60;

export default async function LifestylePage() {
	const posts = await listPosts();
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
