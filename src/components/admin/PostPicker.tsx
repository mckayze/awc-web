"use client";

import { useEffect, useState } from "react";
import { Search, X, Check } from "lucide-react";
import { searchPosts } from "@/lib/posts";
import type { EditorsPick } from "@/lib/categories";
import { Heading } from "@/components/ui/Heading";
import { Button } from "@/components/ui/Button";

const SEARCH_DEBOUNCE_MS = 250;

// A server-searched multi-select over posts — a plain dropdown or client-side
// filter falls over once there are hundreds of posts, so every keystroke
// queries Supabase for a small matching page instead of loading them all.
// Selection is staged locally (as id+title pairs, so already-picked posts
// still show correctly even once they scroll out of the current search) and
// only committed on "Done".
export function PostPicker({
	selected,
	onChange,
	onClose,
}: {
	selected: EditorsPick[];
	onChange: (next: EditorsPick[]) => void;
	onClose: () => void;
}) {
	const [query, setQuery] = useState("");
	const [staged, setStaged] = useState<EditorsPick[]>(selected);
	const [results, setResults] = useState<EditorsPick[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") onClose();
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		const timer = setTimeout(() => {
			searchPosts(query)
				.then((posts) => {
					if (cancelled) return;
					setResults(posts.map((p) => ({ id: p.id, title: p.title })));
					setError(null);
				})
				.catch((e: Error) => !cancelled && setError(e.message))
				.finally(() => !cancelled && setLoading(false));
		}, SEARCH_DEBOUNCE_MS);
		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [query]);

	function toggle(pick: EditorsPick) {
		setStaged((cur) =>
			cur.some((p) => p.id === pick.id) ? cur.filter((p) => p.id !== pick.id) : [...cur, pick],
		);
	}

	function handleDone() {
		onChange(staged);
		onClose();
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
				className="border-border bg-background animate-fade-in flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden border shadow-xl"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="border-border flex items-center justify-between gap-3 border-b px-5 py-4">
					<Heading as="h2" variant="h3">
						Select posts
					</Heading>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close"
						className="text-body/60 hover:text-body"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Search */}
				<div className="border-border border-b px-5 py-3">
					<div className="relative">
						<Search
							className="text-body/40 pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
							aria-hidden="true"
						/>
						<input
							type="search"
							autoFocus
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search posts by title…"
							className="border-border placeholder:text-body/40 text-body min-h-10 w-full border bg-white pr-3 pl-9 text-sm focus:outline-none"
						/>
					</div>
				</div>

				{/* List */}
				<div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
					{error ? (
						<div className="py-16 text-center text-sm text-red-600">{error}</div>
					) : loading ? (
						<div className="text-body/50 py-16 text-center text-sm">Searching…</div>
					) : results.length === 0 ? (
						<div className="text-body/50 py-16 text-center text-sm">No posts found.</div>
					) : (
						<ul>
							{results.map((post) => {
								const isSelected = staged.some((p) => p.id === post.id);
								return (
									<li key={post.id}>
										<button
											type="button"
											onClick={() => toggle(post)}
											className="hover:bg-nav flex w-full items-center gap-3 px-3 py-2.5 text-left"
										>
											<span
												className={`flex h-5 w-5 shrink-0 items-center justify-center border ${
													isSelected
														? "border-body bg-body text-background"
														: "border-border"
												}`}
											>
												{isSelected && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
											</span>
											<span className="min-w-0 flex-1 truncate text-sm">{post.title}</span>
										</button>
									</li>
								);
							})}
						</ul>
					)}
				</div>

				{/* Footer */}
				<div className="border-border flex items-center justify-between gap-3 border-t px-5 py-4">
					<span className="text-body/60 text-sm">
						{staged.length} post{staged.length === 1 ? "" : "s"} selected
					</span>
					<div className="flex items-center gap-2">
						<Button type="button" variant="outline" className="min-h-9 px-4 text-sm" onClick={onClose}>
							Cancel
						</Button>
						<Button
							type="button"
							variant="dark"
							className="min-h-9 px-4 text-sm"
							onClick={handleDone}
						>
							Done
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
