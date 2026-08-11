"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import type { BlockType } from "@/lib/posts";
import { BLOCK_MENU } from "./registry";

// The block-type picker, reused by the inserter and the slash command. A search
// box filters a scrollable grid of square tiles, so the list stays compact no
// matter how many block types exist.
export function BlockMenu({
	onPick,
	className = "",
}: {
	onPick: (type: BlockType) => void;
	className?: string;
}) {
	const [query, setQuery] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	const results = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return BLOCK_MENU;
		return BLOCK_MENU.filter(
			(m) => m.label.toLowerCase().includes(q) || m.description.toLowerCase().includes(q),
		);
	}, [query]);

	return (
		<div className={`border-border w-72 border bg-white p-2 shadow-lg ${className}`}>
			<div className="relative mb-2">
				<Search
					className="text-body/40 pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2"
					aria-hidden="true"
				/>
				<input
					ref={inputRef}
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && results[0]) {
							e.preventDefault();
							onPick(results[0].type);
						}
					}}
					placeholder="Search blocks…"
					className="border-border placeholder:text-body/40 w-full border bg-white py-1.5 pr-2 pl-8 text-sm focus:outline-none"
				/>
			</div>

			{results.length === 0 ? (
				<p className="text-body/50 px-1 py-6 text-center text-xs">No blocks found.</p>
			) : (
				<div className="grid max-h-52 grid-cols-3 gap-1 overflow-y-auto">
					{results.map((m) => (
						<button
							key={m.type}
							type="button"
							onClick={() => onPick(m.type)}
							title={m.description}
							className="border-border hover:bg-nav hover:border-body/30 flex aspect-square flex-col items-center justify-center gap-2 border p-2 text-center transition-colors"
						>
							<m.icon className="text-body h-5 w-5" aria-hidden="true" />
							<span className="text-body text-xs leading-tight font-medium">{m.label}</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
}

// A "+" control that opens the block menu. `line` sits in the gap between
// blocks (revealed on hover); `appender` is the persistent button at the end.
export function Inserter({
	onPick,
	variant = "line",
}: {
	onPick: (type: BlockType) => void;
	variant?: "line" | "appender";
}) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		function onDown(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		}
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") setOpen(false);
		}
		document.addEventListener("mousedown", onDown);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onDown);
			document.removeEventListener("keydown", onKey);
		};
	}, [open]);

	function pick(type: BlockType) {
		setOpen(false);
		onPick(type);
	}

	return (
		<div ref={ref} className="relative">
			{variant === "line" ? (
				<div className="group/ins relative flex h-3 items-center justify-center">
					<span className="bg-body/15 absolute inset-x-0 top-1/2 h-px -translate-y-1/2 opacity-0 transition-opacity group-hover/ins:opacity-100" />
					<button
						type="button"
						onClick={() => setOpen((o) => !o)}
						aria-label="Add block"
						className={`bg-body relative z-10 flex h-6 w-6 items-center justify-center text-white transition-opacity ${
							open ? "opacity-100" : "opacity-0 group-hover/ins:opacity-100"
						}`}
					>
						<Plus className="h-4 w-4" />
					</button>
				</div>
			) : (
				<button
					type="button"
					onClick={() => setOpen((o) => !o)}
					className="border-border text-body/60 hover:bg-nav flex w-full items-center gap-2 border border-dashed px-3 py-3 text-sm"
				>
					<span className="bg-body flex h-6 w-6 items-center justify-center text-white">
						<Plus className="h-4 w-4" />
					</span>
					Add block
				</button>
			)}

			{open && (
				<BlockMenu onPick={pick} className="absolute left-1/2 top-full z-30 mt-1 -translate-x-1/2" />
			)}
		</div>
	);
}
