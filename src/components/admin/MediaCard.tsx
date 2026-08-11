"use client";

import { Check } from "lucide-react";
import { KIND_ICON, formatBytes } from "@/lib/media";
import type { MediaItem } from "@/lib/media";

// Shared thumbnail: real image preview when available, otherwise a kind icon
// on a bg-nav tile.
export function Thumb({ item }: { item: MediaItem }) {
	if (item.kind === "image" && item.url) {
		// Plain <img>, not next/image: Cloudflare Images already serves a
		// resized named variant, so Next's optimiser would only re-proxy it.
		return <img src={item.url} alt={item.alt ?? item.internalName} className="h-full w-full object-cover" />;
	}
	const Icon = KIND_ICON[item.kind];
	return (
		<div className="bg-nav flex h-full w-full items-center justify-center">
			<Icon className="text-body/40 h-8 w-8" aria-hidden="true" />
		</div>
	);
}

type MediaCardProps = {
	item: MediaItem;
	selected: boolean;
	onToggle: (id: string) => void;
	onOpen: (id: string) => void;
};

export function MediaCard({ item, selected, onToggle, onOpen }: MediaCardProps) {
	return (
		<div
			className={`group flex aspect-square flex-col overflow-hidden border ${
				selected ? "border-body border-2" : "border-border"
			}`}
		>
			<button type="button" onClick={() => onOpen(item.id)} className="flex min-h-0 flex-1 flex-col text-left">
				{/* Thumbnail fills the remaining space above the footer */}
				<div className="bg-nav relative min-h-0 flex-1">
					<Thumb item={item} />

					{/* Selection checkbox */}
					<span
						role="checkbox"
						aria-checked={selected}
						aria-label={`Select ${item.internalName}`}
						tabIndex={0}
						onClick={(e) => {
							e.stopPropagation();
							onToggle(item.id);
						}}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								e.stopPropagation();
								onToggle(item.id);
							}
						}}
						className={`absolute top-1.5 left-1.5 flex h-5 w-5 items-center justify-center border transition-opacity ${
							selected
								? "border-body bg-body text-background opacity-100"
								: "border-body/40 bg-background/80 opacity-0 group-hover:opacity-100"
						}`}
					>
						{selected && <Check className="h-3.5 w-3.5" />}
					</span>
				</div>

				{/* Footer */}
				<div className="shrink-0 bg-white px-2 py-1.5">
					<p className="truncate text-xs font-bold" title={item.internalName}>
						{item.internalName}
					</p>
					<p className="text-body/50 text-[0.7rem]">{formatBytes(item.size)}</p>
				</div>
			</button>
		</div>
	);
}
