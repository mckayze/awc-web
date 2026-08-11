"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { Search, X, Check, Plus, Upload } from "lucide-react";
import { listMedia, uploadImage, deleteMedia } from "@/lib/media";
import type { MediaItem } from "@/lib/media";
import { Thumb } from "@/components/admin/MediaCard";
import { Heading } from "@/components/ui/Heading";
import { Button } from "@/components/ui/Button";
import { MediaDetails } from "@/components/admin/MediaDetails";
import { ConfirmModal } from "@/components/admin/ConfirmModal";

// Reuses the media library in "pick one" mode, with upload and inline detail
// editing. Only images are listed — that's all the picker is used for (featured
// images, image blocks). Single-click an image to edit/select it in the side
// panel; double-click to pick it straight away.
export function MediaPicker({
	onSelect,
	onClose,
}: {
	onSelect: (item: MediaItem) => void;
	onClose: () => void;
}) {
	const [items, setItems] = useState<MediaItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [query, setQuery] = useState("");
	const [activeId, setActiveId] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);
	const [dragging, setDragging] = useState(false);
	const [confirmIds, setConfirmIds] = useState<string[] | null>(null);
	const [deleting, setDeleting] = useState(false);
	const fileInput = useRef<HTMLInputElement>(null);

	useEffect(() => {
		listMedia()
			.then((all) => setItems(all.filter((it) => it.kind === "image")))
			.catch((e: Error) => setError(e.message))
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			// Let the delete confirmation own Escape while it's open.
			if (e.key === "Escape" && !confirmIds) onClose();
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose, confirmIds]);

	const visible = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return items;
		return items.filter(
			(it) =>
				it.internalName.toLowerCase().includes(q) ||
				it.canonicalName.toLowerCase().includes(q),
		);
	}, [items, query]);

	const active = items.find((it) => it.id === activeId) ?? null;

	async function addFiles(files: FileList | null) {
		if (!files?.length) return;
		setError(null);

		const all = Array.from(files);
		const images = all.filter((f) => f.type.startsWith("image/"));
		const skipped = all.length - images.length;
		if (skipped > 0) {
			setError(`${skipped} non-image file(s) skipped — only images are supported.`);
		}
		if (images.length === 0) return;

		setUploading(true);
		try {
			const added = await Promise.all(images.map(uploadImage));
			setItems((prev) => [...added, ...prev]);
			setActiveId(added[0].id);
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setUploading(false);
		}
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		setDragging(false);
		addFiles(e.dataTransfer.files);
	}

	function handleInput(e: ChangeEvent<HTMLInputElement>) {
		addFiles(e.target.files);
		e.target.value = "";
	}

	async function confirmDelete() {
		if (!confirmIds) return;
		const ids = confirmIds;
		setError(null);
		setDeleting(true);
		try {
			await deleteMedia(ids);
			setItems((cur) => cur.filter((it) => !ids.includes(it.id)));
			if (activeId && ids.includes(activeId)) setActiveId(null);
			setConfirmIds(null);
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setDeleting(false);
		}
	}

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
				className="border-border bg-background animate-fade-in relative flex max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden border shadow-xl"
				onClick={(e) => e.stopPropagation()}
				onDragOver={(e) => {
					e.preventDefault();
					setDragging(true);
				}}
				onDragLeave={(e) => {
					if (e.currentTarget.contains(e.relatedTarget as Node)) return;
					setDragging(false);
				}}
				onDrop={handleDrop}
			>
				{/* Header */}
				<div className="border-border flex items-center justify-between gap-3 border-b px-5 py-4">
					<Heading as="h2" variant="h3">
						Select image
					</Heading>
					<div className="flex items-center gap-2">
						<Button
							type="button"
							className="min-h-9 px-4 text-sm"
							onClick={() => fileInput.current?.click()}
							disabled={uploading}
							leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
						>
							{uploading ? "Uploading…" : "Upload"}
						</Button>
						<input
							ref={fileInput}
							type="file"
							multiple
							accept="image/*"
							onChange={handleInput}
							className="hidden"
						/>
						<button
							type="button"
							onClick={onClose}
							aria-label="Close"
							className="text-body/60 hover:text-body"
						>
							<X className="h-5 w-5" />
						</button>
					</div>
				</div>

				{/* Body: grid (left) + details (right) */}
				<div className="flex min-h-0 flex-1 md:flex-row">
					{/* Grid column */}
					<div className="flex min-h-0 flex-1 flex-col">
						<div className="border-border border-b px-5 py-3">
							<div className="relative">
								<Search
									className="text-body/40 pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
									aria-hidden="true"
								/>
								<input
									type="search"
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									placeholder="Search images…"
									className="border-border placeholder:text-body/40 text-body min-h-10 w-full border bg-white pr-3 pl-9 text-sm focus:outline-none"
								/>
							</div>
						</div>

						<div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
							{error && (
								<div className="mb-3 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
									{error}
								</div>
							)}
							{loading ? (
								<div className="text-body/50 py-16 text-center text-sm">Loading…</div>
							) : visible.length === 0 ? (
								<div className="text-body/50 py-16 text-center text-sm">
									No images found. Use Upload to add one.
								</div>
							) : (
								<div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
									{visible.map((item) => {
										const selected = item.id === activeId;
										return (
											<button
												key={item.id}
												type="button"
												onClick={() => setActiveId(item.id)}
												onDoubleClick={() => onSelect(item)}
												className={`group relative flex aspect-square flex-col overflow-hidden border text-left ${
													selected ? "border-body border-2" : "border-border"
												}`}
											>
												<div className="bg-nav relative min-h-0 flex-1">
													<Thumb item={item} />
													{selected && (
														<span className="border-body bg-body text-background absolute top-1.5 left-1.5 flex h-5 w-5 items-center justify-center border">
															<Check className="h-3.5 w-3.5" />
														</span>
													)}
												</div>
												<div className="shrink-0 bg-white px-2 py-1.5">
													<p
														className="truncate text-xs font-bold"
														title={item.internalName}
													>
														{item.internalName}
													</p>
												</div>
											</button>
										);
									})}
								</div>
							)}
						</div>
					</div>

					{/* Details column */}
					<div className="border-border flex w-full shrink-0 flex-col border-t md:w-96 md:border-t-0 md:border-l">
						{active ? (
							<MediaDetails
								key={active.id}
								item={active}
								showPreview
								onUpdated={(updated) =>
									setItems((cur) =>
										cur.map((it) => (it.id === updated.id ? updated : it)),
									)
								}
								onDelete={() => setConfirmIds([active.id])}
								extraAction={
									<Button
										type="button"
										variant="dark"
										className="min-h-9 px-4 text-sm"
										onClick={() => onSelect(active)}
									>
										Select
									</Button>
								}
							/>
						) : (
							<div className="text-body/50 flex flex-1 items-center justify-center px-5 py-16 text-center text-sm">
								Select an image to view and edit its details.
							</div>
						)}
					</div>
				</div>

				{/* Drag overlay */}
				{dragging && (
					<div className="border-body bg-background/80 pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center border-2 border-dashed backdrop-blur-sm">
						<Upload className="text-body/70 h-8 w-8" aria-hidden="true" />
						<p className="mt-2 text-sm font-medium">Drop images to upload</p>
					</div>
				)}
			</div>

			{/* Delete confirmation */}
			{confirmIds && (
				<ConfirmModal
					title="Delete item?"
					message="This permanently removes the file from Cloudflare and the library. This cannot be undone."
					confirmLabel="Delete"
					destructive
					busy={deleting}
					onConfirm={confirmDelete}
					onCancel={() => setConfirmIds(null)}
				/>
			)}
		</div>
	);
}
