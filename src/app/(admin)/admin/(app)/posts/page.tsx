"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Image as ImageIcon } from "lucide-react";
import { listPostsPage, postState } from "@/lib/posts";
import type { Post, PostState } from "@/lib/posts";
import { usePermissions } from "@/lib/permissions";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { DataTable } from "@/components/admin/DataTable";
import type { Column, SortState } from "@/components/admin/DataTable";

const STATE_STYLES: Record<PostState, { label: string; color: string }> = {
	draft: { label: "Draft", color: "bg-white" },
	scheduled: { label: "Scheduled", color: "bg-amber-100" },
	published: { label: "Published", color: "bg-green-100" },
};

function postDate(p: Post) {
	return p.publishedAt ?? p.createdAt;
}

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

export default function AllPosts() {
	const { has, hasAny } = usePermissions();
	const router = useRouter();

	const [posts, setPosts] = useState<Post[]>([]);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [rawQuery, setRawQuery] = useState("");
	const [query, setQuery] = useState("");
	const [sort, setSort] = useState<SortState>({ key: "date", dir: "desc" });
	const [page, setPage] = useState(1);

	useEffect(() => {
		const t = setTimeout(() => setQuery(rawQuery), SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(t);
	}, [rawQuery]);

	useEffect(() => {
		setPage(1);
	}, [query, sort]);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		listPostsPage({ search: query, page, pageSize: PAGE_SIZE, sort })
			.then(({ posts, total }) => {
				if (cancelled) return;
				setPosts(posts);
				setTotal(total);
				setError(null);
			})
			.catch((e: Error) => !cancelled && setError(e.message))
			.finally(() => !cancelled && setLoading(false));
		return () => {
			cancelled = true;
		};
	}, [query, sort, page]);

	const canEdit = hasAny("posts.edit");

	const columns = useMemo<Column<Post>[]>(
		() => [
			{
				key: "image",
				header: "",
				cellClassName: "w-[100px]",
				cell: (p) =>
					p.featuredImageUrl ? (
						<div className="border-border h-[100px] w-[100px] overflow-hidden border">
							<img src={p.featuredImageUrl} alt="" className="block h-full w-full object-cover" />
						</div>
					) : (
						<div className="bg-nav border-border text-body/30 flex h-[100px] w-[100px] items-center justify-center border">
							<ImageIcon className="h-8 w-8" aria-hidden="true" />
						</div>
					),
			},
			{
				key: "title",
				header: "Title",
				cell: (p) => p.title,
				sortBy: (p) => p.title.toLowerCase(),
			},
			{
				key: "status",
				header: "Status",
				cell: (p) => {
					const style = STATE_STYLES[postState(p.status, p.publishedAt)];
					return <Pill label={style.label} color={style.color} />;
				},
				sortBy: (p) => postState(p.status, p.publishedAt),
			},
			{
				key: "author",
				header: "Author",
				cell: (p) => p.authorName,
				sortBy: (p) => p.authorName.toLowerCase(),
				cellClassName: "text-body/70",
			},
			{
				key: "categories",
				header: "Categories",
				cell: (p) =>
					p.categories.length > 0 ? (
						<div className="flex flex-wrap gap-1">
							{p.categories.map((c) => (
								<Pill key={c.id} label={c.name} />
							))}
						</div>
					) : (
						"—"
					),
			},
			{
				key: "date",
				header: "Date",
				cell: (p) => new Date(postDate(p)).toLocaleDateString(),
				sortBy: (p) => postDate(p),
				cellClassName: "text-body/70",
			},
			...(canEdit
				? [
						{
							key: "actions",
							header: "",
							align: "right" as const,
							cell: (p: Post) => (
								<Link
									href={`/admin/posts/${p.id}/edit`}
									className="text-body/70 hover:text-body underline-offset-2 hover:underline"
								>
									Edit
								</Link>
							),
						},
					]
				: []),
		],
		[canEdit],
	);

	return (
		<section className="animate-fade-in">
			<div className="flex items-center justify-end">
				{has("posts.create") && (
					<Button
						type="button"
						onClick={() => router.push("/admin/posts/create")}
						leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
					>
						New post
					</Button>
				)}
			</div>

			{error && (
				<p className="mt-6 text-sm text-red-600" role="alert">
					{error}
				</p>
			)}

			{!error && (
				<div className="mt-6">
					<DataTable
						columns={columns}
						data={posts}
						rowKey={(p) => p.id}
						pageSize={PAGE_SIZE}
						searchPlaceholder="Search posts…"
						emptyMessage="No posts yet."
						server={{
							query: rawQuery,
							onQueryChange: setRawQuery,
							sort,
							onSortChange: setSort,
							page,
							totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
							onPageChange: setPage,
							loading,
						}}
					/>
				</div>
			)}
		</section>
	);
}
