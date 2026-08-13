import type { Metadata } from "next";
import { CategoryPage } from "@/components/public/CategoryPage";
import type { Product } from "@/components/public/ProductCard";
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

const latestPosts: PostSummary[] = [
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
		title: "Clean Beauty: What the Labels Actually Mean",
		slug: "clean-beauty-labels",
		categories: ["Skincare"],
		date: "28th March, 2026",
		excerpt:
			"Natural, non-toxic, clean — the buzzwords are everywhere but the definitions are murky. Here's how to cut through the noise.",
		image_url: "",
	},
	{
		title: "The Best Eye Creams for Dark Circles and Puffiness",
		slug: "best-eye-creams",
		categories: ["Skincare"],
		date: "27th March, 2026",
		excerpt:
			"Tired eyes meet their match. We tested the top eye creams to see which ones actually deliver on their promises.",
		image_url: "",
	},
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

export default function SkincarePage() {
	return (
		<CategoryPage
			category="Skincare"
			tagline="Science-backed picks and no-nonsense guides for every skin type."
			products={products}
			latestPosts={latestPosts}
			editorsPicks={editorsPicks}
		/>
	);
}
