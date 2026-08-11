import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { CookieBanner } from "@/components/public/CookieBanner";

const leftLinks = [
	{ label: "makeup", href: "/makeup" },
	{ label: "skincare", href: "/skincare" },
	{ label: "lifestyle", href: "/lifestyle" },
];

const rightLinks = [
	{ label: "search", href: "#" },
	{ label: "blog", href: "/blog" },
	{ label: "about", href: "/about" },
];

const footerColumns = [
	{
		heading: "Company",
		links: [
			{ label: "Get in Touch", href: "/contact" },
			{ label: "About", href: "/about" },
			{ label: "Blog", href: "/blog" },
		],
	},
	{
		heading: "Legal",
		links: [
			{ label: "Privacy Policy", href: "/privacy-policy" },
			{ label: "Terms of Use", href: "/terms-of-use" },
			{ label: "Cookie Policy", href: "/cookie-policy" },
		],
	},
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen flex flex-col">
			<Navbar leftLinks={leftLinks} rightLinks={rightLinks} />
			<div id="navbar-spacer" className="h-20" />
			<main className="flex-1">{children}</main>
			<Footer columns={footerColumns} />
			<CookieBanner />
		</div>
	);
}
