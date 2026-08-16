"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, ChevronsUpDown, Search } from "lucide-react";
import { twMerge } from "@/lib/twMerge";
import { Input } from "@/components/ui/Input";

export type Column<T> = {
	/** Stable id for the column; also used as the React key. */
	key: string;
	header: string;
	/** Renders the cell body for a row. */
	cell: (row: T) => ReactNode;
	/** Provide to make the column sortable; returns the value to sort on. */
	sortBy?: (row: T) => string | number;
	/** Provide to feed this column's text into the search bar. */
	searchBy?: (row: T) => string;
	align?: "left" | "right";
	/** Optional extra classes for the <td> cells in this column. */
	cellClassName?: string;
};

export type SortState = { key: string; dir: "asc" | "desc" } | null;

/**
 * Hands control of search/sort/pagination to the caller: DataTable renders
 * `data` as-is (already the current page/query/sort result from the server)
 * instead of filtering/sorting/slicing it client-side. Omit for the default
 * client-side mode, which is fine for small, fully-loaded datasets.
 */
export type ServerTableConfig = {
	query: string;
	onQueryChange: (query: string) => void;
	sort: SortState;
	onSortChange: (sort: SortState) => void;
	page: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	loading?: boolean;
};

type DataTableProps<T> = {
	columns: Column<T>[];
	data: T[];
	rowKey: (row: T) => string;
	/** Show the search bar above the table. Defaults to true. */
	searchable?: boolean;
	searchPlaceholder?: string;
	pageSize?: number;
	emptyMessage?: string;
	/** Column + direction the table is sorted by on first render. */
	defaultSort?: { key: string; dir: "asc" | "desc" };
	server?: ServerTableConfig;
};

/**
 * Builds the page button sequence with ellipses. `delta` is how many sibling
 * pages to show on each side of the current page (smaller on mobile).
 */
function buildPageItems(current: number, total: number, delta: number): (number | "...")[] {
	const pages = new Set<number>([1, total]);
	for (let i = current - delta; i <= current + delta; i++) {
		if (i >= 1 && i <= total) pages.add(i);
	}
	const sorted = [...pages].sort((a, b) => a - b);
	const items: (number | "...")[] = [];
	let prev = 0;
	for (const p of sorted) {
		if (prev && p - prev > 1) items.push("...");
		items.push(p);
		prev = p;
	}
	return items;
}

export function DataTable<T>({
	columns,
	data,
	rowKey,
	searchable = true,
	searchPlaceholder = "Search…",
	pageSize = 10,
	emptyMessage = "Nothing to show.",
	defaultSort,
	server,
}: DataTableProps<T>) {
	const [localQuery, setLocalQuery] = useState("");
	const [localSort, setLocalSort] = useState<SortState>(defaultSort ?? null);
	const [localPage, setLocalPage] = useState(1);

	const query = server ? server.query : localQuery;
	const sort = server ? server.sort : localSort;

	const searchable_ = searchable && (server ? true : columns.some((c) => c.searchBy));

	const filtered = useMemo(() => {
		if (server) return data;
		const q = localQuery.trim().toLowerCase();
		if (!q) return data;
		const searchers = columns
			.map((c) => c.searchBy)
			.filter((fn): fn is (row: T) => string => Boolean(fn));
		return data.filter((row) => searchers.some((fn) => fn(row).toLowerCase().includes(q)));
	}, [server, data, columns, localQuery]);

	const sorted = useMemo(() => {
		if (server) return data;
		if (!localSort) return filtered;
		const col = columns.find((c) => c.key === localSort.key);
		if (!col?.sortBy) return filtered;
		const sortBy = col.sortBy;
		const dir = localSort.dir === "asc" ? 1 : -1;
		return [...filtered].sort((a, b) => {
			const av = sortBy(a);
			const bv = sortBy(b);
			if (av < bv) return -1 * dir;
			if (av > bv) return 1 * dir;
			return 0;
		});
	}, [server, filtered, columns, localSort, data]);

	const totalPages = server ? server.totalPages : Math.max(1, Math.ceil(sorted.length / pageSize));
	const safePage = server ? server.page : Math.min(localPage, totalPages);
	const start = (safePage - 1) * pageSize;
	const rows = server ? data : sorted.slice(start, start + pageSize);

	function toggleSort(key: string) {
		if (server) {
			const prev = server.sort;
			server.onSortChange(
				!prev || prev.key !== key
					? { key, dir: "asc" }
					: prev.dir === "asc"
						? { key, dir: "desc" }
						: null,
			);
			return;
		}
		setLocalPage(1);
		setLocalSort((prev) => {
			if (!prev || prev.key !== key) return { key, dir: "asc" };
			if (prev.dir === "asc") return { key, dir: "desc" };
			return null;
		});
	}

	function setQuery(q: string) {
		if (server) server.onQueryChange(q);
		else {
			setLocalQuery(q);
			setLocalPage(1);
		}
	}

	function setPage(p: number) {
		if (server) server.onPageChange(p);
		else setLocalPage(p);
	}

	return (
		<div>
			{searchable_ && (
				<div className="relative mb-4 max-w-xs">
					<Search
						className="text-body/40 pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
						aria-hidden="true"
					/>
					<Input
						type="search"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder={searchPlaceholder}
						className="pl-9"
						aria-label="Search table"
					/>
				</div>
			)}

			<div
				className={twMerge(
					"border-border rounded-base overflow-x-auto border bg-white",
					server?.loading && "opacity-50",
				)}
			>
				<table className="w-full text-left text-sm">
					<thead className="border-border border-b">
						<tr>
							{columns.map((col) => {
								const active = sort?.key === col.key;
								const sortable = Boolean(col.sortBy);
								return (
									<th
										key={col.key}
										className={twMerge(
											"px-4 py-4 font-bold text-black",
											col.align === "right" && "text-right",
										)}
									>
										{sortable ? (
											<button
												type="button"
												onClick={() => toggleSort(col.key)}
												className={twMerge(
													"group inline-flex items-center gap-1.5",
													col.align === "right" && "flex-row-reverse",
												)}
											>
												{col.header}
												<SortIcon active={active} dir={sort?.dir} />
											</button>
										) : (
											col.header
										)}
									</th>
								);
							})}
						</tr>
					</thead>
					<tbody>
						{rows.length === 0 && (
							<tr>
								<td className="text-body/60 px-4 py-7" colSpan={columns.length}>
									{query ? "No matches." : emptyMessage}
								</td>
							</tr>
						)}
						{rows.map((row) => (
							<tr key={rowKey(row)} className="border-border border-b last:border-0">
								{columns.map((col) => (
									<td
										key={col.key}
										className={twMerge(
											"px-4 py-5",
											col.align === "right" && "text-right",
											col.cellClassName,
										)}
									>
										{col.cell(row)}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{totalPages > 1 && (
				<div className="mt-4">
					{[0, 2].map((delta) => (
						<div
							key={delta}
							className={`flex justify-between items-center ${delta === 0 ? "flex md:hidden" : "hidden md:flex"}`}
						>
							<button
								onClick={() => setPage(Math.max(1, safePage - 1))}
								disabled={safePage === 1}
								className="h-10 px-4 flex items-center gap-2 text-sm font-medium bg-white border border-border text-body hover:text-black transition-colors disabled:opacity-30 disabled:cursor-default cursor-pointer"
							>
								<ArrowLeft size={18} />
								Previous
							</button>

							<div className={`flex items-center ${delta === 0 ? "gap-1.5" : "gap-3"}`}>
								{buildPageItems(safePage, totalPages, delta).map((item, i) =>
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
											onClick={() => setPage(item)}
											className={`w-10 h-10 flex items-center justify-center text-sm font-medium border border-border ${
												item === safePage
													? "bg-black text-white cursor-default transition-colors"
													: "bg-white text-body hover:text-black cursor-pointer"
											}`}
										>
											{item}
										</button>
									),
								)}
							</div>

							<button
								onClick={() => setPage(Math.min(totalPages, safePage + 1))}
								disabled={safePage === totalPages}
								className="h-10 px-4 flex items-center gap-2 text-sm font-medium bg-white border border-border text-body hover:text-black transition-colors disabled:opacity-30 disabled:cursor-default cursor-pointer"
							>
								Next
								<ArrowRight size={18} />
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

function SortIcon({ active, dir }: { active: boolean; dir?: "asc" | "desc" }) {
	if (!active)
		return (
			<ChevronsUpDown
				className="text-body/30 group-hover:text-body/60 h-3.5 w-3.5"
				aria-hidden="true"
			/>
		);
	return dir === "asc" ? (
		<ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
	) : (
		<ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
	);
}
