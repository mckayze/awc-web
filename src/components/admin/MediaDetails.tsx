"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Copy, Check, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { KIND_ICON, formatBytes, formatDate, updateMedia } from "@/lib/media";
import type { MediaItem } from "@/lib/media";

// The editable detail panel for one media item: facts, metadata fields, URL
// copy, plus a footer with Save / Delete. Shared by the Media library modal and
// the post image picker so both edit the same way. Manages its own save state;
// `onUpdated` bubbles the persisted item back to the parent's list.
export function MediaDetails({
	item,
	onUpdated,
	onDelete,
	showPreview = false,
	extraAction,
}: {
	item: MediaItem;
	onUpdated: (item: MediaItem) => void;
	// Omit to hide the Delete button (e.g. where deleting isn't offered).
	onDelete?: () => void;
	// Render a compact preview at the top — used when there's no separate image
	// column (the picker side panel).
	showPreview?: boolean;
	// Extra footer action rendered left of Save (e.g. the picker's "Select").
	extraAction?: ReactNode;
}) {
	const [copied, setCopied] = useState(false);
	const [internalName, setInternalName] = useState(item.internalName);
	const [alt, setAlt] = useState(item.alt ?? "");
	const [caption, setCaption] = useState(item.caption ?? "");
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const fileUrl = item.url ?? "";
	const ext = item.canonicalName.split(".").pop()?.toUpperCase() ?? "—";
	const Icon = KIND_ICON[item.kind];

	const dirty =
		internalName.trim() !== item.internalName ||
		alt !== (item.alt ?? "") ||
		caption !== (item.caption ?? "");

	function copyUrl() {
		if (!fileUrl) return;
		navigator.clipboard?.writeText(fileUrl);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	}

	async function save() {
		setSaveError(null);
		setSaving(true);
		try {
			const updated = await updateMedia(item.id, {
				internalName: internalName.trim(),
				alt,
				caption,
			});
			onUpdated(updated);
		} catch (e) {
			setSaveError((e as Error).message);
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="flex-1 overflow-y-auto px-5 py-5">
				{showPreview && (
					<div className="bg-nav border-border mb-5 flex aspect-video items-center justify-center overflow-hidden border">
						{item.kind === "image" && item.url ? (
							<img
								src={item.url}
								alt={item.alt ?? item.internalName}
								className="h-full w-full object-contain"
							/>
						) : (
							<Icon className="text-body/30 h-16 w-16" aria-hidden="true" />
						)}
					</div>
				)}

				{/* Facts grid */}
				<div className="border-border border">
					<dl className="grid grid-cols-2">
						<Fact
							label="Size"
							value={formatBytes(item.size)}
							className="border-border border-r border-b"
						/>
						<Fact
							label="Dimensions"
							value={item.width ? `${item.width} × ${item.height}` : "—"}
							className="border-border border-b"
						/>
						<Fact
							label="Date"
							value={formatDate(item.uploadedAt)}
							className="border-border border-r"
						/>
						<Fact label="Extension" value={ext} />
					</dl>
				</div>
				<p className="text-caption text-body/40 mt-2 truncate font-mono" title={item.externalId}>
					ID: {item.externalId}
				</p>

				{/* Fields */}
				<div className="mt-5">
					<Input
						label="Internal name"
						value={internalName}
						onChange={(e) => setInternalName(e.target.value)}
						placeholder="Readable name shown to users"
					/>
				</div>
				<div className="mt-4">
					<Input
						label="Canonical name"
						defaultValue={item.canonicalName}
						readOnly
						className="bg-nav text-body/70"
					/>
				</div>
				<div className="mt-4">
					<Input
						label="Alt text"
						value={alt}
						onChange={(e) => setAlt(e.target.value)}
						placeholder="Describe this file for accessibility"
					/>
				</div>
				<div className="mt-4">
					<Textarea
						label="Caption"
						rows={2}
						value={caption}
						onChange={(e) => setCaption(e.target.value)}
					/>
				</div>

				{/* URL copy */}
				<div className="mt-4">
					<label className="text-sm font-medium text-black">File URL</label>
					<div className="mt-1.5 flex">
						<input
							readOnly
							value={fileUrl}
							placeholder="No URL — not a Cloudflare image"
							className="border-border bg-nav text-body/70 min-w-0 grow border px-3 py-2 text-sm outline-none"
						/>
						<button
							type="button"
							onClick={copyUrl}
							disabled={!fileUrl}
							className="border-border hover:bg-nav -ml-px flex items-center gap-1 border px-3 text-sm disabled:opacity-50"
						>
							{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
							{copied ? "Copied" : "Copy"}
						</button>
					</div>
				</div>
			</div>

			{/* Footer actions */}
			{saveError && <p className="border-border border-t px-5 pt-3 text-sm text-red-600">{saveError}</p>}
			<div className="border-border flex items-center justify-between gap-2 border-t px-5 py-4">
				{onDelete ? (
					<button
						type="button"
						onClick={onDelete}
						className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:underline"
					>
						<Trash2 className="h-4 w-4" />
						Delete
					</button>
				) : (
					<span />
				)}
				<div className="flex items-center gap-2">
					{extraAction}
					<Button
						type="button"
						variant="dark"
						className="min-h-9 px-4 text-sm"
						onClick={save}
						disabled={!dirty || saving}
					>
						{saving ? "Saving…" : "Save"}
					</Button>
				</div>
			</div>
		</div>
	);
}

function Fact({ label, value, className = "" }: { label: string; value: string; className?: string }) {
	return (
		<div className={`px-4 py-3 ${className}`}>
			<dt className="text-caption text-body/40 uppercase">{label}</dt>
			<dd className="text-body mt-0.5 truncate text-sm" title={value}>
				{value}
			</dd>
		</div>
	);
}
