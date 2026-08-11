"use client";

import { X } from "lucide-react";
import { Heading } from "@/components/ui/Heading";
import { MediaDetails } from "@/components/admin/MediaDetails";
import { KIND_ICON } from "@/lib/media";
import type { MediaItem } from "@/lib/media";

// A centred overlay showing one media item's full preview alongside the
// editable detail panel. Shared by the Media library and the post image block
// so "edit this image" looks and behaves the same everywhere. Stays fixed to
// the viewport, so it's reachable regardless of scroll position.
export function MediaEditModal({
	item,
	onClose,
	onUpdated,
	onDelete,
}: {
	item: MediaItem;
	onClose: () => void;
	onUpdated: (item: MediaItem) => void;
	// Omit to hide the Delete action (e.g. when editing from within a post).
	onDelete?: () => void;
}) {
	const Icon = KIND_ICON[item.kind];

	return (
		<div
			className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
			role="dialog"
			aria-modal="true"
		>
			<div
				className="border-border bg-background animate-fade-in flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden border shadow-xl md:flex-row"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Full image (left) */}
				<div className="bg-nav relative flex min-h-64 flex-1 items-center justify-center overflow-hidden p-4 md:min-h-0">
					{item.kind === "image" && item.url ? (
						<img
							src={item.url}
							alt={item.alt ?? item.internalName}
							className="max-h-[85vh] w-full object-contain"
						/>
					) : (
						<Icon className="text-body/30 h-20 w-20" aria-hidden="true" />
					)}
				</div>

				{/* Details (right) */}
				<div className="border-border flex w-full shrink-0 flex-col md:w-96 md:border-l">
					<div className="border-border flex items-center justify-between border-b px-5 py-4">
						<Heading as="h2" variant="h3" className="truncate">
							Details
						</Heading>
						<button
							type="button"
							onClick={onClose}
							aria-label="Close"
							className="text-body/60 hover:text-body"
						>
							<X className="h-5 w-5" />
						</button>
					</div>

					<MediaDetails item={item} onUpdated={onUpdated} onDelete={onDelete} />
				</div>
			</div>
		</div>
	);
}
