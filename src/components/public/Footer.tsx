import Link from "next/link";
import { Container } from "./Container";
import { Text } from "@/components/ui/Text";

type FooterLink = {
	label: string;
	href: string;
};

type FooterColumn = {
	heading: string;
	links: FooterLink[];
};

type FooterProps = {
	columns: FooterColumn[];
	logo?: React.ReactNode;
};

const SOCIALS = [
	{
		label: "Instagram",
		href: "https://www.instagram.com/awomansconfidence_",
		icon: (
			<svg
				viewBox="0 0 24 24"
				width="20"
				height="20"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.75"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<rect x="2" y="2" width="20" height="20" rx="5" />
				<circle cx="12" cy="12" r="4" />
				<circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
			</svg>
		),
	},
	{
		label: "Facebook",
		href: "https://www.facebook.com/awomansconfidence",
		icon: (
			<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
				<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
			</svg>
		),
	},
	{
		label: "Pinterest",
		href: "https://uk.pinterest.com/awomansconfidence",
		icon: (
			<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
				<path d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.482c0-1.388.806-2.428 1.808-2.428.852 0 1.265.64 1.265 1.408 0 .858-.546 2.141-.828 3.33-.236.995.499 1.806 1.476 1.806 1.771 0 3.132-1.867 3.132-4.563 0-2.387-1.716-4.055-4.165-4.055-2.837 0-4.502 2.128-4.502 4.328 0 .856.33 1.775.741 2.276a.3.3 0 0 1 .069.286c-.076.312-.244.995-.277 1.134-.044.183-.146.222-.337.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.966-.527-2.292-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z" />
			</svg>
		),
	},
];

export function Footer({ columns, logo = "A Woman's Confidence" }: FooterProps) {
	return (
		<footer className="bg-background mt-auto border-t-2 border-border">
			<Container>
				<div className="py-12">
					<div className="grid grid-cols-1 gap-10 md:grid-cols-5 mt-10">
						{/* Blurb */}
						<div className="md:col-span-2">
							<div className="mb-4">
								<Link
									href="/"
									className="text-[40px] font-bold text-slate-950 text-center leading-none font-title"
								>
									{logo}
								</Link>
							</div>
							<Text className="text-slate-950/60">
								A beauty, skincare and lifestyle journal for the modern woman.
							</Text>
						</div>

						{/* Link columns */}
						{columns.map((col) => (
							<div key={col.heading}>
								<p className="text-base font-medium text-body uppercase tracking-widest mb-4">
									{col.heading}
								</p>
								<ul className="flex flex-col gap-2">
									{col.links.map((link) => (
										<li key={link.label}>
											<Link href={link.href} className="text-base text-body/70 hover:text-body">
												{link.label}
											</Link>
										</li>
									))}
								</ul>
							</div>
						))}

						{/* Social */}
						<div>
							<p className="text-base font-medium text-body uppercase tracking-widest mb-4">
								Follow Us
							</p>
							<ul className="flex flex-col gap-3">
								{SOCIALS.map(({ label, href, icon }) => (
									<li key={label}>
										<Link
											href={href}
											className="flex items-center gap-3 text-base text-body/70 hover:text-body"
										>
											{icon}
											{label}
										</Link>
									</li>
								))}
							</ul>
						</div>
					</div>

					{/* Bottom bar */}
					<div className="border-t border-border mt-12 pt-6 text-xs text-body">
						© {new Date().getFullYear() + " "} A Woman&#39;s Confidence. All rights reserved.
					</div>
				</div>
			</Container>
		</footer>
	);
}
