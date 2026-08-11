import type { Metadata } from "next";
import { CategoryPage } from "@/components/public/CategoryPage";
import type { Product } from "@/components/public/ProductCard";
import type { Post } from "@/components/public/BlogCard";

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

const latestPosts: Post[] = [
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
		title: "Body Care Rituals Worth Adding to Your Week",
		slug: "body-care-rituals",
		categories: ["Body Care", "Lifestyle"],
		date: "April 2, 2026",
		excerpt:
			"From dry brushing to whipped body butters, these simple rituals make a real difference to how your skin looks and feels.",
		image_url: "",
	},
	{
		title: "Journaling for Mental Wellness: Where to Start",
		slug: "journaling-mental-wellness",
		categories: ["Wellness", "Lifestyle"],
		date: "March 21, 2026",
		excerpt:
			"Putting pen to paper is one of the most underrated wellness tools. Here's a simple framework to make it stick.",
		image_url: "",
	},
];

const editorsPicks: Post[] = [
	{
		title: "The Sunday Reset Routine That Actually Sticks",
		slug: "sunday-reset-routine",
		categories: ["Lifestyle", "Wellness"],
		date: "March 9, 2026",
		excerpt:
			"A weekly reset doesn't have to be elaborate. These simple habits make Monday feel like a fresh start.",
		image_url: "",
	},
	{
		title: "Movement Practices That Don't Feel Like Exercise",
		slug: "movement-practices",
		categories: ["Wellness"],
		date: "March 12, 2026",
		excerpt:
			"If the gym isn't for you, there are still plenty of ways to move your body joyfully. Here are some worth trying.",
		image_url: "",
	},
	{
		title: "How to Build a Capsule Fragrance Wardrobe",
		slug: "capsule-fragrance-wardrobe",
		categories: ["Fragrance", "Lifestyle"],
		date: "March 15, 2026",
		excerpt:
			"Three to five scents can cover every occasion if you choose them wisely. Here's the framework to build yours.",
		image_url: "",
	},
];

export default function LifestylePage() {
	return (
		<CategoryPage
			category="Lifestyle"
			tagline="The rituals, habits, and products that make everyday life feel a little better."
			products={products}
			latestPosts={latestPosts}
			editorsPicks={editorsPicks}
		/>
	);
}
