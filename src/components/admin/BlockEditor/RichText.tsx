"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { twMerge } from "@/lib/twMerge";

// A single-block inline rich-text field. Each block owns its own editor; block
// creation/splitting is handled by the parent (Enter / Backspace / "/" bubble
// up), so this editor only ever holds inline content inside one paragraph.
type RichTextProps = {
	html: string;
	placeholder?: string;
	className?: string;
	autoFocus?: boolean;
	onChange: (html: string) => void;
	onFocus?: (editor: Editor) => void;
	onEnter?: () => void;
	onBackspaceEmpty?: () => void;
	onSlash?: () => void;
	// Called when pasted plain text spans multiple lines, so the parent can turn
	// each line into its own block. Returning here means default paste is skipped.
	onPaste?: (paragraphs: string[]) => void;
	// For table cells: given the raw pasted text, the parent parses it as a
	// tab/newline-separated grid and fills surrounding cells. Returns the text
	// that belongs in *this* cell so it can be inserted directly, or `false` to
	// fall through to normal single-cell paste (e.g. a plain value with no
	// tabs/newlines).
	onPasteGrid?: (text: string) => string | false;
};

// Strip the wrapping <p>/<h*> so `data.html` stays inline-only.
function innerHtml(editor: Editor): string {
	const html = editor.getHTML();
	const m = html.match(/^<(p|h[1-6])[^>]*>([\s\S]*)<\/\1>\s*$/i);
	return m ? m[2] : html;
}

export function RichText({
	html,
	placeholder,
	className,
	autoFocus,
	onChange,
	onFocus,
	onEnter,
	onBackspaceEmpty,
	onSlash,
	onPaste,
	onPasteGrid,
}: RichTextProps) {
	const editor = useEditor({
		// The editor renders client-side only: SSR would emit markup the browser
		// then re-creates, which React flags as a hydration mismatch.
		immediatelyRender: false,
		extensions: [
			StarterKit.configure({
				heading: false,
				bulletList: false,
				orderedList: false,
				listItem: false,
				blockquote: false,
				codeBlock: false,
				horizontalRule: false,
				link: { openOnClick: false },
			}),
			Placeholder.configure({ placeholder: placeholder ?? "Type / to choose a block" }),
		],
		content: html ? `<p>${html}</p>` : "",
		editorProps: {
			attributes: { class: twMerge("be-rich", className) },
			handlePaste(view, event) {
				if (onPasteGrid) {
					const raw = event.clipboardData?.getData("text/plain") ?? "";
					const cellText = onPasteGrid(raw);
					if (cellText !== false) {
						event.preventDefault();
						const tr = view.state.tr.insertText(cellText, 0, view.state.doc.content.size);
						view.dispatch(tr);
						return true;
					}
				}
				if (!onPaste) return false;
				const text = event.clipboardData?.getData("text/plain") ?? "";
				const parts = text
					.split(/\r?\n/)
					.map((s) => s.trim())
					.filter(Boolean);
				if (parts.length <= 1) return false; // single line — let default paste run
				event.preventDefault();
				onPaste(parts);
				return true;
			},
			handleKeyDown(view, event) {
				const empty = view.state.doc.textContent.length === 0;
				if (event.key === "Enter" && !event.shiftKey) {
					event.preventDefault();
					onEnter?.();
					return true;
				}
				if (event.key === "Backspace") {
					const sel = view.state.selection;
					if (sel.empty && sel.$from.parentOffset === 0 && empty) {
						event.preventDefault();
						onBackspaceEmpty?.();
						return true;
					}
				}
				if (event.key === "/" && empty) {
					event.preventDefault();
					onSlash?.();
					return true;
				}
				return false;
			},
		},
		onUpdate({ editor }) {
			onChange(innerHtml(editor));
		},
		onFocus({ editor }) {
			onFocus?.(editor);
		},
	});

	useEffect(() => {
		if (editor && autoFocus) editor.commands.focus("end");
	}, [editor, autoFocus]);

	// Pull in external changes (e.g. a type transform) without disturbing typing.
	useEffect(() => {
		if (!editor || editor.isFocused) return;
		if (innerHtml(editor) !== html) {
			editor.commands.setContent(html ? `<p>${html}</p>` : "");
		}
	}, [editor, html]);

	return <EditorContent editor={editor} />;
}
