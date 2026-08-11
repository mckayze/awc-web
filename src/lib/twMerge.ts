import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge about our custom --text-* tokens so it treats
// text-h1 / text-lead / etc. as font sizes and dedupes them correctly
// against Tailwind's built-in text-* sizes.
export const twMerge = extendTailwindMerge({
	extend: {
		classGroups: {
			"font-size": [{ text: ["display", "h1", "h2", "h3", "lead", "caption"] }],
		},
	},
});
