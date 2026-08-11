"use client";

import { Fragment, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
	Camera,
	ExternalLink,
	ImagePlus,
	Pencil,
	Plus,
	RefreshCw,
	Star,
	Tag,
	X,
} from "lucide-react";
import { twMerge } from "@/lib/twMerge";
import type { Block, BlockType, PostColumn } from "@/lib/posts";
import { getMedia } from "@/lib/media";
import type { MediaItem } from "@/lib/media";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { MediaEditModal } from "@/components/admin/MediaEditModal";
import { RichText } from "./RichText";
import { Inserter, BlockMenu } from "./Inserter";
import { BlockToolbar } from "./BlockToolbar";
import { createBlock, newColumn, transformBlock } from "./registry";
import { useEditorCtx } from "./context";

// Block types that don't hold a text cursor, so insertion shouldn't autofocus.
const NON_TEXT: BlockType[] = ["image", "divider", "columns", "linkbutton", "rating", "instagram"];

// Pasted text is plain — escape it before it becomes a block's html.
function escapeHtml(s: string): string {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Renders one ordered list of blocks. Reused at the top level and inside every
// column, so layout blocks are just nested BlockLists.
export function BlockList({
	blocks,
	onChange,
	compact = false,
}: {
	blocks: Block[];
	onChange: (next: Block[]) => void;
	compact?: boolean;
}) {
	const ctx = useEditorCtx();

	function replaceBlock(id: string, next: Block) {
		onChange(blocks.map((b) => (b.id === id ? next : b)));
	}

	function insertAt(index: number, type: BlockType) {
		const block = createBlock(type);
		const next = [...blocks];
		next.splice(index, 0, block);
		onChange(next);
		ctx.select(block.id);
		if (!NON_TEXT.includes(type)) ctx.setAutoFocus(block.id);
	}

	function transform(id: string, type: BlockType) {
		const block = blocks.find((b) => b.id === id);
		if (!block) return;
		replaceBlock(id, transformBlock(block, type));
		if (!NON_TEXT.includes(type)) ctx.setAutoFocus(id);
	}

	function remove(id: string) {
		const index = blocks.findIndex((b) => b.id === id);
		const next = blocks.filter((b) => b.id !== id);
		onChange(next);
		const neighbour = next[index - 1] ?? next[index] ?? null;
		ctx.select(neighbour?.id ?? null);
		if (neighbour && !NON_TEXT.includes(neighbour.type)) ctx.setAutoFocus(neighbour.id);
	}

	function move(id: string, dir: -1 | 1) {
		const i = blocks.findIndex((b) => b.id === id);
		const j = i + dir;
		if (j < 0 || j >= blocks.length) return;
		const next = [...blocks];
		[next[i], next[j]] = [next[j], next[i]];
		onChange(next);
	}

	// Multi-line paste → one paragraph block per line. Every line becomes a fresh
	// block so its editor mounts with the right content (reusing the focused
	// paste target would leave it visually empty — a focused editor won't re-sync
	// its content). If we pasted into an empty paragraph, replace it.
	function pasteParagraphs(index: number, lines: string[]) {
		const current = blocks[index];
		const created: Block[] = lines.map((line) => ({
			id: crypto.randomUUID(),
			type: "paragraph" as const,
			data: { html: escapeHtml(line) },
		}));
		const next = [...blocks];
		if (current.type === "paragraph" && !current.data.html.trim()) {
			next.splice(index, 1, ...created);
		} else {
			next.splice(index + 1, 0, ...created);
		}
		onChange(next);
		const lastId = created[created.length - 1].id;
		ctx.select(lastId);
		ctx.setAutoFocus(lastId);
	}

	if (blocks.length === 0) {
		return (
			<div>
				{!compact && (
					<button
						type="button"
						onClick={() => insertAt(0, "paragraph")}
						className="text-body/35 hover:text-body/50 block w-full py-2 text-left"
					>
						Type / to choose a block, or start writing…
					</button>
				)}
				<div className={compact ? "" : "mt-3"}>
					<Inserter variant="appender" onPick={(t) => insertAt(0, t)} />
				</div>
			</div>
		);
	}

	return (
		<div>
			{blocks.map((block, i) => (
				<Fragment key={block.id}>
					<Inserter onPick={(t) => insertAt(i, t)} />
					<BlockItem
						block={block}
						index={i}
						total={blocks.length}
						inColumn={compact}
						onReplace={(n) => replaceBlock(block.id, n)}
						onEnterAfter={() => insertAt(i + 1, "paragraph")}
						onRemove={() => remove(block.id)}
						onMove={(d) => move(block.id, d)}
						onTransform={(t) => transform(block.id, t)}
						onPasteSplit={(lines) => pasteParagraphs(i, lines)}
					/>
				</Fragment>
			))}
			<div className="pt-3">
				<Inserter variant="appender" onPick={(t) => insertAt(blocks.length, t)} />
			</div>
		</div>
	);
}

function BlockItem({
	block,
	index,
	total,
	inColumn,
	onReplace,
	onEnterAfter,
	onRemove,
	onMove,
	onTransform,
	onPasteSplit,
}: {
	block: Block;
	index: number;
	total: number;
	inColumn: boolean;
	onReplace: (next: Block) => void;
	onEnterAfter: () => void;
	onRemove: () => void;
	onMove: (dir: -1 | 1) => void;
	onTransform: (type: BlockType) => void;
	onPasteSplit: (lines: string[]) => void;
}) {
	const ctx = useEditorCtx();
	const selected = ctx.selectedId === block.id;
	const [slashOpen, setSlashOpen] = useState(false);

	return (
		<div
			// stopPropagation so clicking a block inside a column selects the inner
			// block, not the parent columns block.
			onMouseDown={(e) => {
				e.stopPropagation();
				ctx.select(block.id);
			}}
			className={twMerge(
				"relative -mx-3 px-3 py-1.5",
				selected
					? "outline outline-1 outline-body"
					: "hover:outline hover:outline-1 hover:outline-border",
			)}
		>
			{selected && (
				<BlockToolbar
					block={block}
					editor={ctx.activeEditor}
					index={index}
					total={total}
					onMove={onMove}
					onDelete={onRemove}
					onTransform={onTransform}
					onSetLevel={(level) =>
						block.type === "heading" && onReplace({ ...block, data: { ...block.data, level } })
					}
					onToggleOrdered={(ordered) =>
						block.type === "list" && onReplace({ ...block, data: { ...block.data, ordered } })
					}
				/>
			)}

			<BlockBody
				block={block}
				autoFocus={ctx.autoFocusId === block.id}
				inColumn={inColumn}
				onReplace={onReplace}
				onEnterAfter={onEnterAfter}
				onRemove={onRemove}
				onSlash={() => setSlashOpen(true)}
				onPasteSplit={onPasteSplit}
			/>

			{slashOpen && (
				<BlockMenu
					onPick={(t) => {
						setSlashOpen(false);
						onTransform(t);
					}}
					className="absolute left-3 top-full z-30 mt-1"
				/>
			)}
		</div>
	);
}

const HEADING_CLASS: Record<2 | 3 | 4, string> = {
	2: "text-h2 font-title font-bold",
	3: "text-h3 font-title font-bold",
	4: "text-xl font-title font-bold",
};

function BlockBody({
	block,
	autoFocus,
	inColumn,
	onReplace,
	onEnterAfter,
	onRemove,
	onSlash,
	onPasteSplit,
}: {
	block: Block;
	autoFocus: boolean;
	inColumn: boolean;
	onReplace: (next: Block) => void;
	onEnterAfter: () => void;
	onRemove: () => void;
	onSlash: () => void;
	onPasteSplit: (lines: string[]) => void;
}) {
	const ctx = useEditorCtx();
	const onFocus = (editor: Editor) => ctx.focusBlock(block.id, editor);

	switch (block.type) {
		case "paragraph":
			return (
				<RichText
					html={block.data.html}
					autoFocus={autoFocus}
					placeholder="Type / to choose a block"
					onChange={(html) => onReplace({ ...block, data: { html } })}
					onFocus={onFocus}
					onEnter={onEnterAfter}
					onBackspaceEmpty={onRemove}
					onSlash={onSlash}
					onPaste={onPasteSplit}
					className="text-base leading-relaxed"
				/>
			);
		case "subtext":
			return (
				<div className="bg-nav px-4 py-3">
					<RichText
						html={block.data.html}
						autoFocus={autoFocus}
						placeholder="Subtext"
						onChange={(html) => onReplace({ ...block, data: { html } })}
						onFocus={onFocus}
						onEnter={onEnterAfter}
						onBackspaceEmpty={onRemove}
						onSlash={onSlash}
						className="text-sm italic text-body/70"
					/>
				</div>
			);
		case "heading":
			return (
				<RichText
					html={block.data.html}
					autoFocus={autoFocus}
					placeholder={`Heading ${block.data.level}`}
					onChange={(html) => onReplace({ ...block, data: { ...block.data, html } })}
					onFocus={onFocus}
					onEnter={onEnterAfter}
					onBackspaceEmpty={onRemove}
					onSlash={onSlash}
					className={HEADING_CLASS[block.data.level]}
				/>
			);
		case "quote":
			return (
				<blockquote className="border-brand border-l-4 py-2 pl-6">
					<RichText
						html={block.data.html}
						autoFocus={autoFocus}
						placeholder="Quote"
						onChange={(html) => onReplace({ ...block, data: { ...block.data, html } })}
						onFocus={onFocus}
						onEnter={onEnterAfter}
						onBackspaceEmpty={onRemove}
						onSlash={onSlash}
						className="text-xl font-medium leading-snug text-black md:text-2xl"
					/>
				</blockquote>
			);
		case "list":
			return (
				<ListBlock
					block={block}
					autoFocus={autoFocus}
					onFocus={onFocus}
					onReplace={onReplace}
					onRemove={onRemove}
				/>
			);
		case "image":
			return <ImageBlock block={block} inColumn={inColumn} onReplace={onReplace} />;
		case "linkbutton":
			return <LinkButtonBlock block={block} onReplace={onReplace} />;
		case "rating":
			return <RatingBlock block={block} onReplace={onReplace} />;
		case "instagram":
			return <InstagramBlock block={block} onReplace={onReplace} />;
		case "columns":
			return <ColumnsBlock block={block} onReplace={onReplace} />;
		case "divider":
			return (
				<div className="py-3">
					<hr className="border-border border-t" />
				</div>
			);
	}
}

function ListBlock({
	block,
	autoFocus,
	onFocus,
	onReplace,
	onRemove,
}: {
	block: Extract<Block, { type: "list" }>;
	autoFocus: boolean;
	onFocus: (editor: Editor) => void;
	onReplace: (next: Block) => void;
	onRemove: () => void;
}) {
	const { ordered, items } = block.data;
	const [focusItem, setFocusItem] = useState<number | null>(autoFocus ? 0 : null);

	function setItems(nextItems: string[]) {
		onReplace({ ...block, data: { ...block.data, items: nextItems } });
	}

	function handleEnter(i: number) {
		const next = [...items];
		next.splice(i + 1, 0, "");
		setItems(next);
		setFocusItem(i + 1);
	}

	function handleBackspace(i: number) {
		if (items.length === 1) {
			onRemove();
			return;
		}
		const next = items.filter((_, idx) => idx !== i);
		setItems(next);
		setFocusItem(Math.max(0, i - 1));
	}

	return (
		<div className="space-y-1">
			{items.map((item, i) => (
				<div key={i} className="flex items-baseline gap-2">
					<span className="text-body w-5 shrink-0 select-none text-right text-base font-semibold">
						{ordered ? `${i + 1}.` : "•"}
					</span>
					<div className="min-w-0 flex-1">
						<RichText
							html={item}
							autoFocus={focusItem === i}
							placeholder="List item"
							onChange={(html) => {
								const next = [...items];
								next[i] = html;
								setItems(next);
							}}
							onFocus={(ed) => {
								setFocusItem(null);
								onFocus(ed);
							}}
							onEnter={() => handleEnter(i)}
							onBackspaceEmpty={() => handleBackspace(i)}
							className="text-base leading-relaxed"
						/>
					</div>
				</div>
			))}
		</div>
	);
}

function ImageBlock({
	block,
	inColumn,
	onReplace,
}: {
	block: Extract<Block, { type: "image" }>;
	inColumn: boolean;
	onReplace: (next: Block) => void;
}) {
	const ctx = useEditorCtx();
	const [pickerOpen, setPickerOpen] = useState(false);
	const [editItem, setEditItem] = useState<MediaItem | null>(null);
	const url = block.data.mediaId ? ctx.resolveUrl(block.data.mediaId) : undefined;

	// The caption shown beneath the image mirrors the media-library record and is
	// read-only here: editing happens only in the image details (Edit) panel,
	// which flows the new value back into block.data.caption.

	// Load the underlying media record so its details (name/alt) can be edited in
	// place, exactly as in the media library.
	async function openEdit() {
		if (!block.data.mediaId) return;
		try {
			setEditItem(await getMedia(block.data.mediaId));
		} catch {
			// The image may have been deleted from the library; nothing to edit.
		}
	}

	// In a column, lock images to a fixed height so every image is identical
	// regardless of column width (true WYSIWYG). Full-width images stay 16:9.
	const boxClass = inColumn ? "h-[360px]" : "aspect-video";

	return (
		<>
			{!block.data.mediaId || !url ? (
				<button
					type="button"
					onClick={() => setPickerOpen(true)}
					className={twMerge(
						"border-border text-body/60 hover:bg-nav flex w-full flex-col items-center justify-center gap-2 border border-dashed text-sm",
						boxClass,
					)}
				>
					<ImagePlus className="h-7 w-7" aria-hidden="true" />
					Choose image
				</button>
			) : (
				<figure className="space-y-2">
					<div className={twMerge("group/img relative overflow-hidden", boxClass)}>
						<img src={url} alt={block.data.alt ?? ""} className="block h-full w-full object-cover" />
						<div className="absolute right-2 top-2 flex items-center gap-1.5 opacity-0 transition-opacity group-hover/img:opacity-100">
							<button
								type="button"
								onMouseDown={(e) => e.stopPropagation()}
								onClick={openEdit}
								className="bg-body/80 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white"
							>
								<Pencil className="h-3.5 w-3.5" />
								Edit
							</button>
							<button
								type="button"
								onMouseDown={(e) => e.stopPropagation()}
								onClick={() => setPickerOpen(true)}
								className="bg-body/80 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white"
							>
								<RefreshCw className="h-3.5 w-3.5" />
								Replace
							</button>
						</div>
					</div>
					{block.data.caption ? (
						<figcaption className="text-body/70 w-full text-center text-sm">
							{block.data.caption}
						</figcaption>
					) : null}
				</figure>
			)}

			{pickerOpen && (
				<MediaPicker
					onClose={() => setPickerOpen(false)}
					onSelect={(item) => {
						if (item.url) ctx.cacheUrl(item.id, item.url);
						// Seed both alt and the caption from the library record.
						onReplace({
							...block,
							data: {
								...block.data,
								mediaId: item.id,
								alt: item.alt ?? "",
								caption: item.caption ?? "",
							},
						});
						setPickerOpen(false);
					}}
				/>
			)}

			{editItem && (
				<MediaEditModal
					item={editItem}
					onClose={() => setEditItem(null)}
					onUpdated={(updated) => {
						if (updated.url) ctx.cacheUrl(updated.id, updated.url);
						// Keep the block's alt and caption in step with the saved media
						// record (caption edited in the panel flows back here).
						onReplace({
							...block,
							data: {
								...block.data,
								alt: updated.alt ?? "",
								caption: updated.caption ?? "",
							},
						});
						setEditItem(updated);
					}}
				/>
			)}
		</>
	);
}

function ColumnsBlock({
	block,
	onReplace,
}: {
	block: Extract<Block, { type: "columns" }>;
	onReplace: (next: Block) => void;
}) {
	const columns = block.data.columns;

	function setColumns(next: PostColumn[]) {
		onReplace({ ...block, data: { columns: next } });
	}

	return (
		<div className="flex items-stretch gap-3">
			{columns.map((col) => (
				<div
					key={col.id}
					className="group/col border-border relative min-w-0 flex-1 border border-dashed p-2"
				>
					{columns.length > 1 && (
						<button
							type="button"
							aria-label="Remove column"
							onMouseDown={(e) => e.stopPropagation()}
							onClick={() => setColumns(columns.filter((c) => c.id !== col.id))}
							className="bg-body absolute -right-2 -top-2 z-10 flex h-5 w-5 items-center justify-center text-white opacity-0 transition-opacity group-hover/col:opacity-100"
						>
							<X className="h-3 w-3" />
						</button>
					)}
					<BlockList
						blocks={col.blocks}
						compact
						onChange={(b) =>
							setColumns(columns.map((c) => (c.id === col.id ? { ...c, blocks: b } : c)))
						}
					/>
				</div>
			))}

			<button
				type="button"
				aria-label="Add column"
				onMouseDown={(e) => e.stopPropagation()}
				onClick={() => setColumns([...columns, newColumn()])}
				className="border-border text-body/50 hover:bg-nav hover:text-body flex w-9 shrink-0 items-center justify-center border border-dashed"
			>
				<Plus className="h-4 w-4" />
			</button>
		</div>
	);
}

// A CTA button linking out to a product/page (opens in a new tab on the site).
// The button preview matches the published look; the URL is edited beneath it.
function LinkButtonBlock({
	block,
	onReplace,
}: {
	block: Extract<Block, { type: "linkbutton" }>;
	onReplace: (next: Block) => void;
}) {
	const { url, label } = block.data;
	return (
		<div className="space-y-2">
			<div className="border-body bg-brand text-body flex w-full items-center gap-3 border px-5 py-3">
				<Tag className="h-5 w-5 shrink-0" aria-hidden="true" />
				<input
					type="text"
					value={label}
					onChange={(e) => onReplace({ ...block, data: { ...block.data, label: e.target.value } })}
					placeholder="Button label"
					className="placeholder:text-body/40 min-w-0 flex-1 bg-transparent font-medium focus:outline-none"
				/>
				<ExternalLink className="h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />
			</div>
			<input
				type="url"
				value={url}
				onChange={(e) => onReplace({ ...block, data: { ...block.data, url: e.target.value } })}
				placeholder="https://example.com/product"
				className="border-border text-body/70 placeholder:text-body/40 block w-full border bg-white px-3 py-1.5 text-sm focus:outline-none"
			/>
		</div>
	);
}

// A 0–5 star rating in half-star steps. Each star has two click targets: the
// left half sets x.5, the right half sets a whole star. Clicking the value's
// current target again clears back to 0.
function RatingBlock({
	block,
	onReplace,
}: {
	block: Extract<Block, { type: "rating" }>;
	onReplace: (next: Block) => void;
}) {
	const value = block.data.value;
	const set = (target: number) =>
		onReplace({ ...block, data: { value: value === target ? 0 : target } });

	return (
		<div className="bg-nav flex flex-col items-center gap-3 border border-body/15 px-4 py-8">
			<span className="text-body text-xl font-bold">
				My Rating: {value} Star{value === 1 ? "" : "s"}
			</span>
			<div className="flex items-center gap-2">
				{[1, 2, 3, 4, 5].map((star) => {
					const fill = Math.max(0, Math.min(1, value - (star - 1)));
					return (
						<div key={star} className="relative h-8 w-8">
							<StarIcon fill={fill} className="h-8 w-8" />
							<button
								type="button"
								aria-label={`${star - 0.5} stars`}
								onClick={() => set(star - 0.5)}
								className="absolute inset-y-0 left-0 w-1/2"
							/>
							<button
								type="button"
								aria-label={`${star} star${star > 1 ? "s" : ""}`}
								onClick={() => set(star)}
								className="absolute inset-y-0 right-0 w-1/2"
							/>
						</div>
					);
				})}
			</div>
		</div>
	);
}

// One star filled `fill` of the way across (0, 0.5 or 1). An empty star sits
// underneath; a width-clipped amber star is layered on top.
function StarIcon({ fill, className }: { fill: number; className?: string }) {
	return (
		<span className={twMerge("relative inline-block", className)}>
			<Star className={twMerge("fill-body/15 text-transparent", className)} />
			{fill > 0 && (
				<span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
					<Star className={twMerge("fill-brand-dark text-brand-dark", className)} />
				</span>
			)}
		</span>
	);
}

// Pulls the /embed URL out of a pasted Instagram post/reel link, so the editor
// can show a live preview. Published rendering uses the official widget instead.
// Accepts the plural `/reels/` form (what the app copies) and normalises it to
// the singular `/reel/` permalink that Instagram's embed expects.
function instagramEmbedUrl(url: string): string | null {
	const m = url.match(/instagram\.com\/(p|reels?|tv)\/([A-Za-z0-9_-]+)/);
	if (!m) return null;
	const type = m[1] === "reels" ? "reel" : m[1];
	return `https://www.instagram.com/${type}/${m[2]}/embed`;
}

// An Instagram post/reel embed. The author pastes a URL; the editor previews it
// with a plain iframe (no third-party script needed in the admin). On the site it
// renders via Instagram's official embed.js widget.
function InstagramBlock({
	block,
	onReplace,
}: {
	block: Extract<Block, { type: "instagram" }>;
	onReplace: (next: Block) => void;
}) {
	const embedUrl = instagramEmbedUrl(block.data.url);
	return (
		<div className="space-y-2">
			{embedUrl ? (
				<iframe
					src={embedUrl}
					title="Instagram embed"
					scrolling="no"
					className="mx-auto block h-[560px] w-full max-w-[540px] border border-border"
				/>
			) : (
				<div className="border-border text-body/60 flex h-[200px] w-full flex-col items-center justify-center gap-2 border border-dashed text-sm">
					<Camera className="h-7 w-7" aria-hidden="true" />
					Paste an Instagram post or reel URL
				</div>
			)}
			<input
				type="url"
				value={block.data.url}
				onChange={(e) => onReplace({ ...block, data: { url: e.target.value } })}
				placeholder="https://www.instagram.com/p/…"
				className="border-border text-body/70 placeholder:text-body/40 block w-full border bg-white px-3 py-1.5 text-sm focus:outline-none"
			/>
		</div>
	);
}
