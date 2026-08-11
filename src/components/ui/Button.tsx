"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { twMerge } from "@/lib/twMerge";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: "default" | "text" | "dark" | "outline";
	leftIcon?: ReactNode;
	rightIcon?: ReactNode;
};

const base =
	"inline-flex items-center justify-center gap-2 text-base font-medium cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none";

const variants = {
	default: "bg-brand text-body min-h-11 px-6 rounded-base border border-body hover:opacity-80",
	dark: "bg-body text-white min-h-11 px-6 rounded-base border border-body hover:opacity-80 font-bold",
	outline: "border border-body text-body min-h-11 px-6 rounded-base hover:opacity-80",
	text: "text-body hover:underline underline-offset-4",
};

export function Button({ className = "", variant = "default", leftIcon, rightIcon, children, ...props }: ButtonProps) {
	return (
		<button className={twMerge(base, variants[variant], className)} {...props}>
			{leftIcon}
			{children}
			{rightIcon}
		</button>
	);
}
