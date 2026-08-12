import Link from "next/link";
import type { ReactNode } from "react";

// A titled dashboard card with an optional link in the header.
export function Panel({
	title,
	action,
	children,
}: {
	title: string;
	action?: { label: string; href: string };
	children: ReactNode;
}) {
	return (
		<section className="border-border border bg-white">
			<header className="border-border flex items-center justify-between gap-3 border-b px-4 py-3">
				<h2 className="text-sm font-bold">{title}</h2>
				{action && (
					<Link
						href={action.href}
						className="text-caption text-body/60 hover:text-body font-medium underline underline-offset-4"
					>
						{action.label}
					</Link>
				)}
			</header>
			<div className="px-4 py-4">{children}</div>
		</section>
	);
}
