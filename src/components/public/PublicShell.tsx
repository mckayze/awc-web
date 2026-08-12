import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { CookieBanner } from "@/components/public/CookieBanner";

// The public site's chrome — navbar, footer, cookie banner — as a component
// rather than living directly in `(public)/layout.tsx`. Draft preview renders
// under /admin (so it inherits the auth gate and never touches the ISR cache)
// but has to look exactly like the real page, which means it needs this same
// shell from outside the (public) route group.

const leftLinks = [
	{ label: "MAKEUP", href: "/makeup" },
	{ label: "SKINCARE", href: "/skincare" },
	{ label: "LIFESTYLE", href: "/lifestyle" },
];

const rightLinks = [
	{ label: "SEARCH", href: "#" },
	{ label: "BLOG", href: "/blog" },
	{ label: "ABOUT", href: "/about" },
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

export function PublicShell({ children }: { children: React.ReactNode }) {
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
