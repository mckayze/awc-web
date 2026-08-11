"use client";

import { useEffect, useState } from "react";
import type { Block } from "@/lib/posts";

// A lightweight "block clipboard" backed by localStorage, so blocks copied in
// one post can be pasted into another (the admin is a single-origin app, so the
// store is shared across pages and tabs — no OS-clipboard permissions needed).

const KEY = "awc.blockClipboard";
// Fired on the same tab after a copy (the native `storage` event only reaches
// *other* tabs), so the paste button updates immediately where you copied.
const CHANGE_EVENT = "awc:block-clipboard";

type ClipboardPayload = { version: 1; blocks: Block[]; copiedAt: string };

export function copyBlocksToClipboard(blocks: Block[]): void {
	const payload: ClipboardPayload = {
		version: 1,
		blocks,
		copiedAt: new Date().toISOString(),
	};
	localStorage.setItem(KEY, JSON.stringify(payload));
	window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function readBlockClipboard(): Block[] | null {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as ClipboardPayload;
		if (parsed?.version !== 1 || !Array.isArray(parsed.blocks)) return null;
		return parsed.blocks;
	} catch {
		return null;
	}
}

// Deep-clones blocks with fresh ids (incl. column ids + nested block ids) so a
// paste never collides with existing blocks' React keys / identity.
export function withNewIds(blocks: Block[]): Block[] {
	return blocks.map((b) => {
		const clone = structuredClone(b);
		clone.id = crypto.randomUUID();
		if (clone.type === "columns") {
			clone.data.columns = clone.data.columns.map((col) => ({
				id: crypto.randomUUID(),
				blocks: withNewIds(col.blocks),
			}));
		}
		return clone;
	});
}

// Number of blocks currently on the clipboard, kept in sync across copies and
// across tabs. 0 means nothing to paste. Starts at 0 so the server render and
// the first client render agree; localStorage is read after mount.
export function useBlockClipboardCount(): number {
	const [count, setCount] = useState(0);
	useEffect(() => {
		const refresh = () => setCount(readBlockClipboard()?.length ?? 0);
		refresh();
		window.addEventListener("storage", refresh);
		window.addEventListener(CHANGE_EVENT, refresh);
		return () => {
			window.removeEventListener("storage", refresh);
			window.removeEventListener(CHANGE_EVENT, refresh);
		};
	}, []);
	return count;
}
