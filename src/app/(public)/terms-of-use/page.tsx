import type { Metadata } from "next";
import { PolicyArticle } from "@/components/public/PolicyArticle";

export const revalidate = 60;

export const metadata: Metadata = {
	title: "Terms of Use",
};

export default function TermsOfUsePage() {
	return <PolicyArticle slug="terms-of-use" />;
}
