"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { Plus, Upload, Search, LayoutGrid, List, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { MediaCard, Thumb } from "@/components/admin/MediaCard";
import { MediaEditModal } from "@/components/admin/MediaEditModal";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { formatBytes, formatDate, listMedia, uploadImage, deleteMedia } from "@/lib/media";
import type { MediaItem } from "@/lib/media";

// ── Page ───────────────────────────────────────────────────────────

export default function Media() {
	const [items, setItems] = useState<MediaItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [query, setQuery] = useState("");
	const [view, setView] = useState<"grid" | "list">("grid");
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [activeId, setActiveId] = useState<string | null>(null);
	const [dragging, setDragging] = useState(false);
	const [confirmIds, setConfirmIds] = useState<string[] | null>(null);
	const [deleting, setDeleting] = useState(false);
	const fileInput = useRef<HTMLInputElement>(null);

	useEffect(() => {
		listMedia()
			.then(setItems)
			.catch((e: Error) => setError(e.message))
			.finally(() => setLoading(false));
	}, []);

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

	function toggleSelect(id: string) {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	function clearSelection() {
		setSelected(new Set());
	}

	async function addFiles(files: FileList | null) {
		if (!files?.length) return;
		setError(null);

		const all = Array.from(files);
		const images = all.filter((f) => f.type.startsWith("image/"));
		const skipped = all.length - images.length;
		if (skipped > 0) {
			setError(`${skipped} non-image file(s) skipped — only images are supported right now.`);
		}
		if (images.length === 0) return;

		setUploading(true);
		try {
			const added = await Promise.all(images.map(uploadImage));
			setItems((prev) => [...added, ...prev]);
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

	function requestDelete(ids: string[]) {
		if (ids.length > 0) setConfirmIds(ids);
	}

	async function confirmDelete() {
		if (!confirmIds) return;
		const ids = confirmIds;
		setError(null);
		setDeleting(true);
		try {
			await deleteMedia(ids);
			setItems((cur) => cur.filter((it) => !ids.includes(it.id)));
			setSelected((cur) => {
				const next = new Set(cur);
				ids.forEach((id) => next.delete(id));
				return next;
			});
			if (activeId && ids.includes(activeId)) setActiveId(null);
			setConfirmIds(null);
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setDeleting(false);
		}
	}

	return (
		<section
			className="animate-fade-in relative"
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
			{/* Page header */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<Heading as="h2" variant="h3">
					Media Library
				</Heading>
				<div className="flex items-center gap-2">
					<Button
						type="button"
						onClick={() => fileInput.current?.click()}
						disabled={uploading}
						leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
					>
						{uploading ? "Uploading…" : "Upload new items"}
					</Button>
					<input ref={fileInput} type="file" multiple onChange={handleInput} className="hidden" />
				</div>
			</div>

			{/* Toolbar */}
			<div className="mt-6 flex flex-wrap items-center gap-3">
				<div className="relative grow sm:grow-0">
					<Search
						className="text-body/40 pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
						aria-hidden="true"
					/>
					<input
						type="search"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search media…"
						className="border-border placeholder:text-body/40 text-body min-h-11 w-full border bg-white pr-3 pl-9 text-base focus:outline-none sm:w-64"
					/>
				</div>

				<div className="border-border ml-auto flex border">
					<button
						type="button"
						onClick={() => setView("grid")}
						aria-label="Grid view"
						aria-pressed={view === "grid"}
						className={`p-2 transition-colors ${
							view === "grid" ? "bg-body text-background" : "text-body/60 hover:bg-nav"
						}`}
					>
						<LayoutGrid className="h-4 w-4" />
					</button>
					<button
						type="button"
						onClick={() => setView("list")}
						aria-label="List view"
						aria-pressed={view === "list"}
						className={`p-2 transition-colors ${
							view === "list" ? "bg-body text-background" : "text-body/60 hover:bg-nav"
						}`}
					>
						<List className="h-4 w-4" />
					</button>
				</div>
			</div>

			{/* Selection actions */}
			{selected.size > 0 && (
				<div className="mt-4 flex items-center gap-3">
					<span className="text-sm font-medium">{selected.size} selected</span>
					<Button
						type="button"
						className="min-h-9 px-4 text-sm"
						leftIcon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
						onClick={() => requestDelete([...selected])}
					>
						Delete
					</Button>
					<Button
						type="button"
						variant="outline"
						className="min-h-9 px-4 text-sm"
						leftIcon={<X className="h-4 w-4" aria-hidden="true" />}
						onClick={clearSelection}
					>
						Clear selection
					</Button>
				</div>
			)}

			{/* Error banner */}
			{error && (
				<div className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
			)}

			{/* Empty / loading state */}
			{loading ? (
				<div className="border-border text-body/50 mt-6 border border-dashed px-4 py-16 text-center text-sm">
					Loading…
				</div>
			) : visible.length === 0 ? (
				<div className="border-border text-body/50 mt-6 border border-dashed px-4 py-16 text-center text-sm">
					No media found.
				</div>
			) : view === "grid" ? (
				<MediaGrid items={visible} selected={selected} onToggle={toggleSelect} onOpen={setActiveId} />
			) : (
				<MediaListView items={visible} selected={selected} onToggle={toggleSelect} onOpen={setActiveId} />
			)}

			{/* Drag overlay */}
			{dragging && (
				<div className="border-body bg-background/80 pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center border-2 border-dashed backdrop-blur-sm">
					<Upload className="text-body/70 h-8 w-8" aria-hidden="true" />
					<p className="mt-2 text-sm font-medium">Drop files to upload</p>
				</div>
			)}

			{/* Details drawer */}
			{active && (
				<MediaEditModal
					key={active.id}
					item={active}
					onClose={() => setActiveId(null)}
					onDelete={() => requestDelete([active.id])}
					onUpdated={(updated) =>
						setItems((cur) => cur.map((it) => (it.id === updated.id ? updated : it)))
					}
				/>
			)}

			{/* Delete confirmation */}
			{confirmIds && (
				<ConfirmModal
					title={confirmIds.length > 1 ? `Delete ${confirmIds.length} items?` : "Delete item?"}
					message="This permanently removes the file from Cloudflare and the library. This cannot be undone."
					confirmLabel="Delete"
					destructive
					busy={deleting}
					onConfirm={confirmDelete}
					onCancel={() => setConfirmIds(null)}
				/>
			)}
		</section>
	);
}

// ── Grid ───────────────────────────────────────────────────────────

function MediaGrid({
	items,
	selected,
	onToggle,
	onOpen,
}: {
	items: MediaItem[];
	selected: Set<string>;
	onToggle: (id: string) => void;
	onOpen: (id: string) => void;
}) {
	return (
		<div className="mt-6 grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
			{items.map((item) => (
				<MediaCard
					key={item.id}
					item={item}
					selected={selected.has(item.id)}
					onToggle={onToggle}
					onOpen={onOpen}
				/>
			))}
		</div>
	);
}

// ── List ───────────────────────────────────────────────────────────

function MediaListView({
	items,
	selected,
	onToggle,
	onOpen,
}: {
	items: MediaItem[];
	selected: Set<string>;
	onToggle: (id: string) => void;
	onOpen: (id: string) => void;
}) {
	return (
		<div className="border-border mt-6 overflow-x-auto border">
			<table className="w-full text-left text-sm">
				<thead className="border-border text-caption text-body/60 border-b">
					<tr>
						<th className="w-10 px-4 py-3" />
						<th className="px-4 py-3 font-medium">Name</th>
						<th className="px-4 py-3 font-medium">Type</th>
						<th className="px-4 py-3 font-medium">Size</th>
						<th className="px-4 py-3 font-medium">Dimensions</th>
						<th className="px-4 py-3 font-medium">Uploaded</th>
					</tr>
				</thead>
				<tbody>
					{items.map((item) => (
						<tr
							key={item.id}
							className="border-border hover:bg-nav/50 cursor-pointer border-b last:border-0"
							onClick={() => onOpen(item.id)}
						>
							<td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
								<input
									type="checkbox"
									checked={selected.has(item.id)}
									onChange={() => onToggle(item.id)}
									aria-label={`Select ${item.internalName}`}
								/>
							</td>
							<td className="px-4 py-2">
								<div className="flex items-center gap-3">
									<span className="border-border block h-9 w-9 shrink-0 overflow-hidden border">
										<Thumb item={item} />
									</span>
									<span className="min-w-0">
										<span className="block truncate">{item.internalName}</span>
										<span className="text-body/50 text-caption block truncate">
											{item.canonicalName}
										</span>
									</span>
								</div>
							</td>
							<td className="text-body/70 px-4 py-2 capitalize">{item.kind}</td>
							<td className="text-body/70 px-4 py-2">{formatBytes(item.size)}</td>
							<td className="text-body/70 px-4 py-2">
								{item.width ? `${item.width} × ${item.height}` : "—"}
							</td>
							<td className="text-body/70 px-4 py-2">{formatDate(item.uploadedAt)}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
