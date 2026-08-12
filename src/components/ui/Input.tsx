"use client";

import type { InputHTMLAttributes } from "react";
import { twMerge } from "@/lib/twMerge";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
	label?: string;
};

export function Input({ className = "", label, ...props }: InputProps) {
	const input = (
		<input
			className={twMerge(
				"w-full bg-white border border-border rounded-md px-3 min-h-11 text-base text-body placeholder:text-body/40 focus:outline-none",
				className,
			)}
			{...props}
		/>
	);

	if (!label) return input;

	return (
		<div className="flex flex-col gap-1">
			<label className="text-caption font-medium text-body/70" htmlFor={props.id}>
				{label}
			</label>
			{input}
		</div>
	);
}
