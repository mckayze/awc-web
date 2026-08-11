import type { HTMLAttributes } from "react";
import { twMerge } from "@/lib/twMerge";

type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
	as?: "h1" | "h2" | "h3" | "h4";
	variant?: "display" | "h1" | "h2" | "h3";
};

const base = "font-title font-bold text-body";

const variants = {
	display: "text-display tracking-tight",
	h1: "text-h1",
	h2: "text-h2",
	h3: "text-h3",
};

export function Heading({ as: Tag = "h2", variant, className = "", children, ...props }: HeadingProps) {
	// looks default to the tag when not overridden (h4 has no scale -> h3)
	const resolved = variant ?? (Tag === "h4" ? "h3" : Tag);

	return (
		<Tag className={twMerge(base, variants[resolved], className)} {...props}>
			{children}
		</Tag>
	);
}
