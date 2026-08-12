"use client";

import type { TextareaHTMLAttributes } from "react";
import { twMerge } from "@/lib/twMerge";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
	label?: string;
};

export function Textarea({ className = "", label, ...props }: TextareaProps) {
	const textarea = (
		<textarea
			className={twMerge(
				"w-full bg-white border border-border rounded-md px-3 py-3 text-base text-body placeholder:text-body/40 focus:outline-none resize-none",
				className,
			)}
			{...props}
		/>
	);

	if (!label) return textarea;

	return (
		<div className="flex flex-col gap-1">
			<label className="text-caption font-medium text-body/70" htmlFor={props.id}>
				{label}
			</label>
			{textarea}
		</div>
	);
}
