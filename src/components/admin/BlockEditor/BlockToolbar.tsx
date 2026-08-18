"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Editor } from "@tiptap/react";
import {
	AlignCenter,
	AlignLeft,
	AlignRight,
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
import type { Block, BlockType, Post } from "@/lib/posts";
import { postState, searchPosts } from "@/lib/posts";
import { Button } from "@/components/ui/Button";
import { BLOCK_META, TEXT_TRANSFORMS } from "./registry";

const TEXT_TYPES: BlockType[] = ["paragraph", "subtext", "heading", "quote", "list"];
const INTERNAL_LINK_RE = /^\/blog\/(.+)$/;
const SEARCH_DEBOUNCE_MS = 250;

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
	activeTableCol,
	onSetAlign,
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
	activeTableCol: number | null;
	onSetAlign: (align: "left" | "center" | "right") => void;
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

	const [linkMenuOpen, setLinkMenuOpen] = useState(false);
	const linkMenuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!linkMenuOpen) return;
		function onDown(e: MouseEvent) {
			if (linkMenuRef.current && !linkMenuRef.current.contains(e.target as Node)) {
				setLinkMenuOpen(false);
			}
		}
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") setLinkMenuOpen(false);
		}
		document.addEventListener("mousedown", onDown);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onDown);
			document.removeEventListener("keydown", onKey);
		};
	}, [linkMenuOpen]);

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

			{/* Table column alignment — acts on whichever column has focus */}
			{block.type === "table" && activeTableCol !== null && (
				<>
					<Divider />
					{(
						[
							["left", AlignLeft, "Align left"],
							["center", AlignCenter, "Align center"],
							["right", AlignRight, "Align right"],
						] as const
					).map(([value, Icon, label]) => (
						<ToolbarButton
							key={value}
							label={label}
							active={(block.data.align?.[activeTableCol] ?? "left") === value}
							onClick={() => onSetAlign(value)}
						>
							<Icon className="h-4 w-4" />
						</ToolbarButton>
					))}
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
					<div ref={linkMenuRef} className="relative">
						<ToolbarButton
							label="Link"
							active={editor.isActive("link")}
							onClick={() => setLinkMenuOpen((o) => !o)}
						>
							<Link2 className="h-4 w-4" />
						</ToolbarButton>
						{linkMenuOpen && (
							<LinkMenu editor={editor} onClose={() => setLinkMenuOpen(false)} />
						)}
					</div>
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

// The link tool's popover: either type an external URL, or search for and
// pick an already-published post (so editors never have to know/paste the
// exact live slug, and can't accidentally link to a draft or a post
// scheduled for the future that isn't visible on the frontend yet).
function LinkMenu({ editor, onClose }: { editor: Editor; onClose: () => void }) {
	const currentHref = (editor.getAttributes("link").href as string | undefined) ?? "";
	const internalMatch = currentHref.match(INTERNAL_LINK_RE);

	const [tab, setTab] = useState<"post" | "url">(internalMatch ? "post" : "url");
	const [url, setUrl] = useState(internalMatch ? "" : currentHref);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<Post[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (tab !== "post" || !query.trim()) {
			setResults([]);
			setLoading(false);
			return;
		}
		let cancelled = false;
		setLoading(true);
		const timer = setTimeout(() => {
			searchPosts(query)
				.then((posts) => {
					if (cancelled) return;
					setResults(posts.filter((p) => postState(p.status, p.publishedAt) === "published"));
				})
				.finally(() => !cancelled && setLoading(false));
		}, SEARCH_DEBOUNCE_MS);
		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [tab, query]);

	function applyUrl() {
		const trimmed = url.trim();
		if (!trimmed) return;
		editor.chain().focus().setLink({ href: trimmed }).run();
		onClose();
	}

	function pickPost(post: Post) {
		editor
			.chain()
			.focus()
			.extendMarkRange("link")
			.setLink({ href: `/blog/${post.slug}` })
			.run();
		onClose();
	}

	function removeLink() {
		editor.chain().focus().unsetLink().run();
		onClose();
	}

	return (
		<div
			// Stop this from bubbling to the toolbar's own onMouseDown, which
			// preventDefault()s to keep the editor selection alive when clicking
			// buttons — that would also block focusing the inputs in here.
			onMouseDown={(e) => e.stopPropagation()}
			className="border-border absolute left-0 top-full z-40 mt-1 w-72 border bg-white p-2 shadow-lg"
		>
			<div className="mb-2 flex items-center gap-1">
				<button
					type="button"
					onClick={() => setTab("post")}
					className={twMerge(
						"flex-1 px-2 py-1 text-sm",
						tab === "post" ? "bg-body text-white" : "hover:bg-nav text-body",
					)}
				>
					Post
				</button>
				<button
					type="button"
					onClick={() => setTab("url")}
					className={twMerge(
						"flex-1 px-2 py-1 text-sm",
						tab === "url" ? "bg-body text-white" : "hover:bg-nav text-body",
					)}
				>
					URL
				</button>
			</div>

			{tab === "post" ? (
				<>
					{internalMatch && (
						<p className="text-body/50 mb-1.5 truncate text-xs">
							Currently linked to {currentHref}
						</p>
					)}
					<input
						type="search"
						autoFocus
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search posts by title…"
						className="border-border placeholder:text-body/40 text-body mb-1.5 min-h-9 w-full border bg-white px-2 text-sm focus:outline-none"
					/>
					<div className="max-h-60 overflow-y-auto">
						{loading ? (
							<p className="text-body/50 px-2 py-2 text-sm">Searching…</p>
						) : !query.trim() ? (
							<p className="text-body/50 px-2 py-2 text-sm">Type to search posts by title.</p>
						) : results.length === 0 ? (
							<p className="text-body/50 px-2 py-2 text-sm">No published posts found.</p>
						) : (
							results.map((post) => (
								<button
									key={post.id}
									type="button"
									onClick={() => pickPost(post)}
									className="hover:bg-nav flex w-full items-center px-2 py-1.5 text-left text-sm"
								>
									<span className="truncate">{post.title}</span>
								</button>
							))
						)}
					</div>
				</>
			) : (
				<div className="flex items-center gap-1.5">
					<input
						type="url"
						autoFocus
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") applyUrl();
						}}
						placeholder="https://…"
						className="border-border placeholder:text-body/40 text-body min-h-9 w-full border bg-white px-2 text-sm focus:outline-none"
					/>
					<Button type="button" variant="dark" className="min-h-9 px-3 text-sm" onClick={applyUrl}>
						Apply
					</Button>
				</div>
			)}

			{editor.isActive("link") && (
				<button
					type="button"
					onClick={removeLink}
					className="text-body/60 hover:text-body mt-2 w-full px-2 py-1 text-left text-sm underline underline-offset-2"
				>
					Remove link
				</button>
			)}
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
