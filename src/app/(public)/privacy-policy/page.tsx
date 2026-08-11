import type { Metadata } from "next";
import { PolicyArticle } from "@/components/public/PolicyArticle";

export const revalidate = 60;

export const metadata: Metadata = {
	title: "Privacy Policy",
};

export default function PrivacyPolicyPage() {
	return <PolicyArticle slug="privacy-policy" />;
}
