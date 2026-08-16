"use client";

import { useState, useMemo, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { Section } from "@/components/public/Section";
import { Container } from "@/components/public/Container";
import { TrendingPostCard } from "@/components/public/TrendingPostCard";
import { FilterDrawer } from "@/components/public/FilterDrawer";
import { Button } from "@/components/ui/Button";
import { MailingListCTA } from "@/components/public/MailingListCTA";
import { Separator } from "@/components/public/Separator";
import type { PostSummary } from "@/lib/public/posts";
import { slugify } from "@/lib/slug";

const POSTS_PER_PAGE = 6;

// Score a post against the search terms. Every term must appear somewhere
// (title / excerpt / category) for the post to match — terms are AND'd — and
// matches are weighted so title hits rank above category hits above excerpt
// hits. Returns null when the post doesn't match all terms.
function scorePost(post: PostSummary, terms: string[]): number | null {
	const title = post.title.toLowerCase();
	const excerpt = post.excerpt.toLowerCase();
	const categories = post.categories.join(" ").toLowerCase();

	let score = 0;
	for (const term of terms) {
		const inTitle = title.includes(term);
		const inCategories = categories.includes(term);
		const inExcerpt = excerpt.includes(term);
		if (!inTitle && !inCategories && !inExcerpt) return null;
		if (inTitle) score += 3;
		if (inCategories) score += 2;
		if (inExcerpt) score += 1;
	}
	return score;
}

function buildPageItems(current: number, total: number, delta = 2): (number | "...")[] {
	if (total <= delta * 2 + 3) return Array.from({ length: total }, (_, i) => i + 1);

	const items: (number | "...")[] = [];
	const left = Math.max(2, current - delta);
	const right = Math.min(total - 1, current + delta);

	items.push(1);
	if (left > 2) items.push("...");
	for (let i = left; i <= right; i++) items.push(i);
	if (right < total - 1) items.push("...");
	items.push(total);

	return items;
}

// Reports the navbar's `?q=` and the current `?page=` up into BlogIndex
// state. Kept as its own leaf component because `useSearchParams` opts its
// subtree out of prerendering — isolating it here means the post list itself
// still renders into the static HTML that gets cached, rather than being
// replaced by a Suspense fallback.
function QuerySync({
	onQueryChange,
	onCategoriesChange,
	onPageChange,
}: {
	onQueryChange: (q: string) => void;
	onCategoriesChange: (categories: string[]) => void;
	onPageChange: (page: number) => void;
}) {
	const searchParams = useSearchParams();
	const q = searchParams.get("q") ?? "";
	const categoryParam = searchParams.get("category") ?? "";
	const page = Math.max(1, Number(searchParams.get("page")) || 1);

	useEffect(() => {
		onQueryChange(q);
	}, [q, onQueryChange]);

	useEffect(() => {
		const slugs = categoryParam
			.split(",")
			.map((c) => c.trim())
			.filter(Boolean);
		onCategoriesChange(slugs);
	}, [categoryParam, onCategoriesChange]);

	useEffect(() => {
		onPageChange(page);
	}, [page, onPageChange]);

	return null;
}

export function BlogIndex({
	posts,
	categories,
}: {
	posts: PostSummary[];
	categories: string[];
}) {
	const router = useRouter();
	const [activeCategories, setActiveCategories] = useState<string[]>([]);
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [query, setQuery] = useState("");

	// Lets the stable syncPageToUrl/goToPage callbacks read the latest query
	// without depending on `query` (which would otherwise force new callback
	// identities on every keystroke).
	const queryRef = useRef(query);
	queryRef.current = query;

	const categoriesRef = useRef(activeCategories);
	categoriesRef.current = activeCategories;

	// Reflects `page`, `q`, and `category` into the URL without pushing a new
	// history entry — pagination shouldn't make every page click its own
	// back-button stop, but it does mean a real page reload or a return from a
	// post detail page lands back on the page the user was on. Categories are
	// stored as their display names in state but written as slugs, matching
	// the links in Navbar/CategoryPills.
	const syncPageToUrl = useCallback(
		(page: number, q: string, categories: string[]) => {
			const params = new URLSearchParams();
			if (q.trim()) params.set("q", q.trim());
			if (categories.length > 0) params.set("category", categories.map(slugify).join(","));
			if (page > 1) params.set("page", String(page));
			const search = params.toString();
			router.replace(`/blog${search ? `?${search}` : ""}`, { scroll: false });
		},
		[router],
	);

	// Re-seed the box and reset paging when arriving with a new ?q= from the
	// navbar search while already on this page (the component stays mounted).
	const handleQueryFromUrl = useCallback((q: string) => {
		setQuery(q);
		setCurrentPage(1);
	}, []);

	// Re-seed the active category filters and reset paging when arriving with
	// a new ?category= (a slug list) from a category link (navbar, pills)
	// while already on this page. Resolved against the known category names
	// since post filtering matches on name, not slug.
	const handleCategoriesFromUrl = useCallback(
		(slugs: string[]) => {
			const matched = categories.filter((c) => slugs.includes(slugify(c)));
			setActiveCategories(matched);
			setCurrentPage(1);
		},
		[categories],
	);

	// The URL is the source of truth for the current page (so browser back/
	// forward and page reloads land on the right page); this just mirrors it
	// into state without touching scroll position.
	const handlePageFromUrl = useCallback((page: number) => {
		setCurrentPage(page);
	}, []);

	// User-initiated page change (pagination controls): update state + URL and
	// jump to the top of the results.
	const goToPage = useCallback(
		(page: number) => {
			setCurrentPage(page);
			syncPageToUrl(page, queryRef.current, categoriesRef.current);
			window.scrollTo({ top: 0, behavior: "smooth" });
		},
		[syncPageToUrl],
	);

	const terms = useMemo(() => query.trim().toLowerCase().split(/\s+/).filter(Boolean), [query]);

	const results = useMemo(() => {
		const byCategory = posts.filter(
			(post) =>
				activeCategories.length === 0 ||
				post.categories.some((c) => activeCategories.includes(c)),
		);
		if (terms.length === 0) return byCategory;

		// Keep only posts matching every term, ranked most-relevant first.
		return byCategory
			.map((post) => ({ post, score: scorePost(post, terms) }))
			.filter((r): r is { post: PostSummary; score: number } => r.score !== null)
			.sort((a, b) => b.score - a.score)
			.map((r) => r.post);
	}, [posts, activeCategories, terms]);

	const totalPages = Math.ceil(results.length / POSTS_PER_PAGE);
	const paginated = results.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);

	// Filtering/searching can shrink the result set out from under the page
	// the URL points at (e.g. arriving at ?page=4 then clearing a filter) —
	// clamp back onto the last real page rather than showing an empty grid.
	useEffect(() => {
		if (totalPages > 0 && currentPage > totalPages) {
			setCurrentPage(totalPages);
			syncPageToUrl(totalPages, queryRef.current, categoriesRef.current);
		}
	}, [currentPage, totalPages, syncPageToUrl]);

	function handleApply(selected: string[]) {
		setActiveCategories(selected);
		setCurrentPage(1);
		syncPageToUrl(1, queryRef.current, selected);
	}

	return (
		<>
			<Suspense fallback={null}>
				<QuerySync
					onQueryChange={handleQueryFromUrl}
					onCategoriesChange={handleCategoriesFromUrl}
					onPageChange={handlePageFromUrl}
				/>
			</Suspense>
			<FilterDrawer
				open={drawerOpen}
				onClose={() => setDrawerOpen(false)}
				categories={categories}
				selected={activeCategories}
				onApply={handleApply}
			/>

			<Section className="border-b border-border bg-white">
				<Container>
					<div className="mb-8">
						<h1 className="text-5xl md:text-7xl font-bold leading-tight">All Posts</h1>
					</div>

					<Separator />

					<div className="flex items-center gap-4">
						<div className="relative max-w-md w-full">
							<Search
								size={18}
								className="absolute left-4 top-1/2 -translate-y-1/2 text-body/50 pointer-events-none"
							/>
							<input
								type="text"
								value={query}
								onChange={(e) => {
									setQuery(e.target.value);
									setCurrentPage(1);
									syncPageToUrl(1, e.target.value, categoriesRef.current);
								}}
								placeholder="Search posts..."
								className="w-full bg-white border border-black rounded-md pl-11 pr-4 h-11 text-sm text-body placeholder:text-body/40 focus:outline-none focus:border-body/40"
							/>
						</div>

						<Button
							onClick={() => setDrawerOpen(true)}
							aria-label={`Filter by categories${activeCategories.length > 0 ? ` (${activeCategories.length})` : ""}`}
							className="w-11 px-0 shrink-0"
							leftIcon={<SlidersHorizontal size={15} />}
						/>

						{(activeCategories.length > 0 || query.trim().length > 0) && (
							<Button
								variant="dark"
								onClick={() => {
									setActiveCategories([]);
									setQuery("");
									setCurrentPage(1);
									syncPageToUrl(1, "", []);
								}}
								leftIcon={<Trash2 size={15} />}
								className="shrink-0"
							>
								Clear filters
							</Button>
						)}
					</div>

					<Separator />

					{activeCategories.length > 0 && (
						<p className="text-sm text-body/60 mb-2">Filtering by: {activeCategories.join(" / ")}</p>
					)}

					<p className="text-sm text-body/60 mb-8">
						{results.length} {results.length === 1 ? "result" : "results"}
						{query.trim() ? ` for “${query.trim()}”` : ""}
					</p>

					{results.length > 0 ? (
						<>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
								{paginated.map((post) => (
									<TrendingPostCard key={post.slug} post={post} />
								))}
							</div>

							<Separator />

							{totalPages > 1 && (
								<>
									{[0, 2].map((delta) => (
										<div
											key={delta}
											className={`flex justify-between items-center ${delta === 0 ? "flex md:hidden" : "hidden md:flex"}`}
										>
											<button
												onClick={() => goToPage(Math.max(1, currentPage - 1))}
												disabled={currentPage === 1}
												className="h-10 px-4 flex items-center gap-2 text-sm font-medium bg-white border border-border rounded-md text-body hover:text-black transition-colors disabled:opacity-30 disabled:cursor-default cursor-pointer"
											>
												<ArrowLeft size={18} />
												Previous
											</button>

											<div className={`flex items-center ${delta === 0 ? "gap-1.5" : "gap-3"}`}>
												{buildPageItems(currentPage, totalPages, delta).map((item, i) =>
													item === "..." ? (
														<span
															key={`ellipsis-${i}`}
															className="px-1 flex items-center justify-center text-sm text-body/40 select-none md:px-0 md:w-10 md:h-10"
														>
															...
														</span>
													) : (
														<button
															key={item}
															onClick={() => goToPage(item)}
															className={`w-10 h-10 flex items-center justify-center text-sm font-medium border border-border rounded-md transition-colors ${
																item === currentPage
																	? "bg-black text-white cursor-default"
																	: "bg-white text-body hover:text-black cursor-pointer"
															}`}
														>
															{item}
														</button>
													),
												)}
											</div>

											<button
												onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
												disabled={currentPage === totalPages}
												className="h-10 px-4 flex items-center gap-2 text-sm font-medium bg-white border border-border rounded-md text-body hover:text-black transition-colors disabled:opacity-30 disabled:cursor-default cursor-pointer"
											>
												Next
												<ArrowRight size={18} />
											</button>
										</div>
									))}
								</>
							)}
						</>
					) : (
						<div className="flex flex-col items-center gap-4 py-24 text-center">
							<p className="text-2xl font-bold text-black">No results found</p>
							<p className="text-body">Try a different search term or browse by category.</p>
						</div>
					)}
				</Container>
			</Section>

			<Section className="bg-brand">
				<Container>
					<MailingListCTA />
				</Container>
			</Section>
		</>
	);
}
