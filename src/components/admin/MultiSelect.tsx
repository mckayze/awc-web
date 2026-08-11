"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { twMerge } from "@/lib/twMerge";

export type Option = { value: string; label: string };

// A click-to-open multiselect. Trigger shows chosen options as removable pills;
// the panel lists every option with a check on the selected ones.
export function MultiSelect({
	options,
	selected,
	onChange,
	placeholder = "Select…",
	emptyText = "No options.",
}: {
	options: Option[];
	selected: string[];
	onChange: (next: string[]) => void;
	placeholder?: string;
	emptyText?: string;
}) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		function onDown(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		}
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") setOpen(false);
		}
		document.addEventListener("mousedown", onDown);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onDown);
			document.removeEventListener("keydown", onKey);
		};
	}, [open]);

	function toggle(value: string) {
		onChange(
			selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value],
		);
	}

	const chosen = options.filter((o) => selected.includes(o.value));

	return (
		<div ref={ref} className="relative">
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				className="border-border flex min-h-11 w-full items-center justify-between gap-2 border bg-white px-3 py-1.5 text-left text-sm"
			>
				<span className="flex flex-1 flex-wrap gap-1.5">
					{chosen.length === 0 ? (
						<span className="text-body/40">{placeholder}</span>
					) : (
						chosen.map((o) => (
							<span
								key={o.value}
								className="bg-nav text-body inline-flex items-center gap-1 px-2 py-0.5 text-xs"
							>
								{o.label}
								<span
									role="button"
									tabIndex={-1}
									aria-label={`Remove ${o.label}`}
									onClick={(e) => {
										e.stopPropagation();
										toggle(o.value);
									}}
									className="text-body/50 hover:text-body"
								>
									<X className="h-3 w-3" />
								</span>
							</span>
						))
					)}
				</span>
				<ChevronDown
					className={twMerge(
						"text-body/50 h-4 w-4 shrink-0 transition-transform",
						open && "rotate-180",
					)}
					aria-hidden="true"
				/>
			</button>

			{open && (
				<div className="border-border absolute z-30 mt-1 max-h-60 w-full overflow-y-auto border bg-white p-1 shadow-lg">
					{options.length === 0 ? (
						<p className="text-body/50 px-2 py-2 text-sm">{emptyText}</p>
					) : (
						options.map((o) => {
							const active = selected.includes(o.value);
							return (
								<button
									key={o.value}
									type="button"
									onClick={() => toggle(o.value)}
									className="hover:bg-nav flex w-full items-center justify-between gap-2 px-2 py-2 text-left text-sm"
								>
									{o.label}
									{active && <Check className="text-body h-4 w-4 shrink-0" />}
								</button>
							);
						})
					)}
				</div>
			)}
		</div>
	);
}
