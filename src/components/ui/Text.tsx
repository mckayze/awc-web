import type { HTMLAttributes } from "react";
import { twMerge } from "@/lib/twMerge";

type TextProps = HTMLAttributes<HTMLElement> & {
	as?: "p" | "span" | "div" | "li";
	variant?: "lead" | "body" | "caption" | "muted";
};

const base = "font-sans text-body";

const variants = {
	lead: "text-lead",
	body: "text-base",
	caption: "text-caption",
	muted: "text-base text-body/60",
};

export function Text({ as: Tag = "p", variant = "body", className = "", children, ...props }: TextProps) {
	return (
		<Tag className={twMerge(base, variants[variant], className)} {...props}>
			{children}
		</Tag>
	);
}
