"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Editor } from "@tiptap/react";
import {
	ArrowUp,
	ArrowDown,
	Bold,
	ChevronDown,
	Heading2,
	Heading3,
	Heading4,
	Italic,
	Link2,
	List as ListIcon,
	ListOrdered,
	PanelTop,
	Trash2,
} from "lucide-react";
import { twMerge } from "@/lib/twMerge";
import type { Block, BlockType } from "@/lib/posts";
import { BLOCK_META, TEXT_TRANSFORMS } from "./registry";

const TEXT_TYPES: BlockType[] = ["paragraph", "subtext", "heading", "quote", "list"];

// Re-render the toolbar whenever the editor selection/content changes so the
// active states of B / I / link stay in sync.
function useEditorTick(editor: Editor | null) {
	const [, force] = useReducer((x: number) => x + 1, 0);
	useEffect(() => {
		if (!editor) return;
		const cb = () => force();
		editor.on("transaction", cb);
		return () => {
			editor.off("transaction", cb);
		};
	}, [editor]);
}

export function BlockToolbar({
	block,
	editor,
	index,
	total,
	onMove,
	onDelete,
	onTransform,
	onSetLevel,
	onToggleOrdered,
	onToggleHeader,
}: {
	block: Block;
	editor: Editor | null;
	index: number;
	total: number;
	onMove: (dir: -1 | 1) => void;
	onDelete: () => void;
	onTransform: (type: BlockType) => void;
	onSetLevel: (level: 2 | 3 | 4) => void;
	onToggleOrdered: (ordered: boolean) => void;
	onToggleHeader: (header: boolean) => void;
}) {
	useEditorTick(editor);
	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!menuOpen) return;
		function onDown(e: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setMenuOpen(false);
			}
		}
		document.addEventListener("mousedown", onDown);
		return () => document.removeEventListener("mousedown", onDown);
	}, [menuOpen]);

	const isText = TEXT_TYPES.includes(block.type);
	// Tables aren't transformable, but their cells are rich text.
	const canFormat = (isText || block.type === "table") && editor;

	function toggleLink() {
		if (!editor) return;
		if (editor.isActive("link")) {
			editor.chain().focus().unsetLink().run();
			return;
		}
		const url = window.prompt("Link URL");
		if (url) editor.chain().focus().setLink({ href: url }).run();
	}

	return (
		<div
			// Keep the editor selection alive while clicking toolbar buttons.
			onMouseDown={(e) => e.preventDefault()}
			className="border-border absolute -top-2 left-0 z-30 flex -translate-y-full items-center border bg-white shadow-md"
		>
			{/* Transform menu */}
			{isText && (
				<div ref={menuRef} className="relative">
					<ToolbarButton label="Change block type" onClick={() => setMenuOpen((o) => !o)}>
						{(() => {
							const Icon = BLOCK_META[block.type].icon;
							return <Icon className="h-4 w-4" />;
						})()}
						<ChevronDown className="h-3 w-3" />
					</ToolbarButton>
					{menuOpen && (
						<div className="border-border absolute left-0 top-full z-40 mt-1 w-44 border bg-white p-1 shadow-lg">
							{TEXT_TRANSFORMS.map((t) => {
								const Icon = BLOCK_META[t].icon;
								return (
									<button
										key={t}
										type="button"
										onClick={() => {
											setMenuOpen(false);
											onTransform(t);
										}}
										className={twMerge(
											"hover:bg-nav flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm",
											t === block.type && "font-semibold",
										)}
									>
										<Icon className="h-4 w-4" />
										{BLOCK_META[t].label}
									</button>
								);
							})}
						</div>
					)}
				</div>
			)}

			{/* Heading levels */}
			{block.type === "heading" && (
				<>
					<Divider />
					{([2, 3, 4] as const).map((lvl) => {
						const Icon = lvl === 2 ? Heading2 : lvl === 3 ? Heading3 : Heading4;
						return (
							<ToolbarButton
								key={lvl}
								label={`Heading ${lvl}`}
								active={block.data.level === lvl}
								onClick={() => onSetLevel(lvl)}
							>
								<Icon className="h-4 w-4" />
							</ToolbarButton>
						);
					})}
				</>
			)}

			{/* List style */}
			{block.type === "list" && (
				<>
					<Divider />
					<ToolbarButton
						label="Bulleted list"
						active={!block.data.ordered}
						onClick={() => onToggleOrdered(false)}
					>
						<ListIcon className="h-4 w-4" />
					</ToolbarButton>
					<ToolbarButton
						label="Numbered list"
						active={block.data.ordered}
						onClick={() => onToggleOrdered(true)}
					>
						<ListOrdered className="h-4 w-4" />
					</ToolbarButton>
				</>
			)}

			{/* Table header row */}
			{block.type === "table" && (
				<>
					<Divider />
					<ToolbarButton
						label="Header row"
						active={block.data.header}
						onClick={() => onToggleHeader(!block.data.header)}
					>
						<PanelTop className="h-4 w-4" />
					</ToolbarButton>
				</>
			)}

			{/* Inline formatting */}
			{canFormat && (
				<>
					<Divider />
					<ToolbarButton
						label="Bold"
						active={editor.isActive("bold")}
						onClick={() => editor.chain().focus().toggleBold().run()}
					>
						<Bold className="h-4 w-4" />
					</ToolbarButton>
					<ToolbarButton
						label="Italic"
						active={editor.isActive("italic")}
						onClick={() => editor.chain().focus().toggleItalic().run()}
					>
						<Italic className="h-4 w-4" />
					</ToolbarButton>
					<ToolbarButton label="Link" active={editor.isActive("link")} onClick={toggleLink}>
						<Link2 className="h-4 w-4" />
					</ToolbarButton>
				</>
			)}

			{/* Move + delete */}
			<Divider />
			<ToolbarButton label="Move up" disabled={index === 0} onClick={() => onMove(-1)}>
				<ArrowUp className="h-4 w-4" />
			</ToolbarButton>
			<ToolbarButton label="Move down" disabled={index === total - 1} onClick={() => onMove(1)}>
				<ArrowDown className="h-4 w-4" />
			</ToolbarButton>
			<Divider />
			<ToolbarButton label="Delete block" onClick={onDelete}>
				<Trash2 className="h-4 w-4" />
			</ToolbarButton>
		</div>
	);
}

function Divider() {
	return <span className="bg-border mx-0.5 h-5 w-px self-center" />;
}

function ToolbarButton({
	label,
	onClick,
	active,
	disabled,
	children,
}: {
	label: string;
	onClick: () => void;
	active?: boolean;
	disabled?: boolean;
	children: ReactNode;
}) {
	return (
		<button
			type="button"
			title={label}
			aria-label={label}
			disabled={disabled}
			onClick={onClick}
			className={twMerge(
				"text-body hover:bg-nav flex h-9 min-w-9 items-center justify-center gap-0.5 px-1.5 disabled:opacity-30",
				active && "bg-body hover:bg-body text-white",
			)}
		>
			{children}
		</button>
	);
}
