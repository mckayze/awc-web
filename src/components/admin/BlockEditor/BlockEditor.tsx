"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Copy, ClipboardPaste, Check } from "lucide-react";
import type { Block, PostContent } from "@/lib/posts";
import { listMedia } from "@/lib/media";
import { BlockList } from "./BlockList";
import { EditorProvider } from "./context";
import type { EditorCtx } from "./context";
import {
	copyBlocksToClipboard,
	readBlockClipboard,
	withNewIds,
	useBlockClipboardCount,
} from "./blockClipboard";
import "./editor.css";

// Gathers media ids from every image block, descending into columns.
function collectMediaIds(blocks: Block[]): string[] {
	const ids: string[] = [];
	for (const b of blocks) {
		if (b.type === "image" && b.data.mediaId) ids.push(b.data.mediaId);
		else if (b.type === "columns")
			for (const c of b.data.columns) ids.push(...collectMediaIds(c.blocks));
	}
	return ids;
}

export function BlockEditor({
	value,
	onChange,
}: {
	value: PostContent;
	onChange: (next: PostContent) => void;
}) {
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [autoFocusId, setAutoFocusId] = useState<string | null>(null);
	const [activeEditor, setActiveEditor] = useState<Editor | null>(null);
	const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
	const [justCopied, setJustCopied] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);

	const clipboardCount = useBlockClipboardCount();

	function handleCopyAll() {
		if (value.blocks.length === 0) return;
		copyBlocksToClipboard(value.blocks);
		setJustCopied(true);
	}

	// Append the clipboard's blocks (with fresh ids) to the end of this post.
	function handlePaste() {
		const copied = readBlockClipboard();
		if (!copied || copied.length === 0) return;
		onChange({ version: 1, blocks: [...value.blocks, ...withNewIds(copied)] });
	}

	// Reset the "Copied" confirmation shortly after it shows.
	useEffect(() => {
		if (!justCopied) return;
		const t = setTimeout(() => setJustCopied(false), 2000);
		return () => clearTimeout(t);
	}, [justCopied]);

	// Clicking outside the editor clears the selection so the floating block
	// toolbar (which overlaps the content above a block) goes away.
	useEffect(() => {
		function onDown(e: MouseEvent) {
			if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
				setSelectedId(null);
			}
		}
		document.addEventListener("mousedown", onDown);
		return () => document.removeEventListener("mousedown", onDown);
	}, []);

	// Resolve URLs for any image blocks loaded from a saved post (incl. nested).
	const mediaKey = collectMediaIds(value.blocks).join(",");
	useEffect(() => {
		const missing = mediaKey.split(",").some((id) => id && !mediaUrls[id]);
		if (!missing) return;
		let cancelled = false;
		listMedia()
			.then((items) => {
				if (cancelled) return;
				setMediaUrls((prev) => {
					const next = { ...prev };
					for (const it of items) if (it.url) next[it.id] = it.url;
					return next;
				});
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mediaKey]);

	const ctx = useMemo<EditorCtx>(
		() => ({
			selectedId,
			select: setSelectedId,
			autoFocusId,
			setAutoFocus: setAutoFocusId,
			activeEditor,
			focusBlock: (id, editor) => {
				setSelectedId(id);
				setActiveEditor(editor);
				setAutoFocusId(null);
			},
			resolveUrl: (mediaId) => mediaUrls[mediaId],
			cacheUrl: (id, url) => setMediaUrls((prev) => ({ ...prev, [id]: url })),
		}),
		[selectedId, autoFocusId, activeEditor, mediaUrls],
	);

	return (
		<EditorProvider value={ctx}>
			<div ref={rootRef} className="be-editor border-border border bg-white">
				<div className="border-border flex items-center justify-end gap-1 border-b px-3 py-1.5">
					<button
						type="button"
						onClick={handleCopyAll}
						disabled={value.blocks.length === 0}
						className="text-body/70 hover:bg-nav hover:text-body flex items-center gap-1.5 px-2 py-1 text-xs disabled:pointer-events-none disabled:opacity-40"
					>
						{justCopied ? (
							<>
								<Check className="h-3.5 w-3.5" aria-hidden="true" />
								Copied
							</>
						) : (
							<>
								<Copy className="h-3.5 w-3.5" aria-hidden="true" />
								Copy all
							</>
						)}
					</button>
					{clipboardCount > 0 && (
						<button
							type="button"
							onClick={handlePaste}
							className="text-body/70 hover:bg-nav hover:text-body flex items-center gap-1.5 px-2 py-1 text-xs"
						>
							<ClipboardPaste className="h-3.5 w-3.5" aria-hidden="true" />
							Paste {clipboardCount} block{clipboardCount === 1 ? "" : "s"}
						</button>
					)}
				</div>
				<div className="mx-auto max-w-[800px] px-6 py-8">
					<BlockList
						blocks={value.blocks}
						onChange={(blocks) => onChange({ version: 1, blocks })}
					/>
				</div>
			</div>
		</EditorProvider>
	);
}
