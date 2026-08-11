import type { Metadata } from "next";
import { PolicyArticle } from "@/components/public/PolicyArticle";
import { ManageCookiesButton } from "@/components/public/ManageCookiesButton";

export const revalidate = 60;

export const metadata: Metadata = {
	title: "Cookie Policy",
};

export default function CookiePolicyPage() {
	return (
		<PolicyArticle slug="cookie-policy">
			<ManageCookiesButton />
		</PolicyArticle>
	);
}
