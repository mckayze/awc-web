"use client";

import { createContext, useContext } from "react";
import type { Editor } from "@tiptap/react";

// Editor-wide state shared across every (possibly nested) block list: which
// block is selected, which should grab focus next, the active text editor for
// the toolbar, and the media-URL cache for image blocks.
export type EditorCtx = {
	selectedId: string | null;
	select: (id: string | null) => void;
	autoFocusId: string | null;
	setAutoFocus: (id: string | null) => void;
	activeEditor: Editor | null;
	// Which column of a table block currently has focus, so the floating
	// toolbar's alignment buttons know which column to act on.
	activeTableCol: number | null;
	focusBlock: (id: string, editor: Editor, tableCol?: number) => void;
	resolveUrl: (mediaId: string) => string | undefined;
	cacheUrl: (id: string, url: string) => void;
};

const Ctx = createContext<EditorCtx | null>(null);

export const EditorProvider = Ctx.Provider;

export function useEditorCtx(): EditorCtx {
	const v = useContext(Ctx);
	if (!v) throw new Error("useEditorCtx must be used within the BlockEditor");
	return v;
}
