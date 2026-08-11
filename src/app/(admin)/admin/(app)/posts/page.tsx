"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Image as ImageIcon } from "lucide-react";
import { listPosts, postState } from "@/lib/posts";
import type { Post, PostState } from "@/lib/posts";
import { usePermissions } from "@/lib/permissions";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { DataTable } from "@/components/admin/DataTable";
import type { Column } from "@/components/admin/DataTable";

const STATE_STYLES: Record<PostState, { label: string; color: string }> = {
	draft: { label: "Draft", color: "bg-white" },
	scheduled: { label: "Scheduled", color: "bg-amber-100" },
	published: { label: "Published", color: "bg-green-100" },
};

function postDate(p: Post) {
	return p.publishedAt ?? p.createdAt;
}

export default function AllPosts() {
	const { has, hasAny } = usePermissions();
	const router = useRouter();
	const [posts, setPosts] = useState<Post[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		listPosts()
			.then(setPosts)
			.catch((e: Error) => setError(e.message))
			.finally(() => setLoading(false));
	}, []);

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
				searchBy: (p) => p.title,
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
				searchBy: (p) => p.authorName,
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
				searchBy: (p) => p.categories.map((c) => c.name).join(" "),
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

			{loading && <p className="text-body/60 mt-6 text-sm">Loading…</p>}

			{error && (
				<p className="mt-6 text-sm text-red-600" role="alert">
					{error}
				</p>
			)}

			{!loading && !error && (
				<div className="mt-6">
					<DataTable
						columns={columns}
						data={posts}
						rowKey={(p) => p.id}
						defaultSort={{ key: "date", dir: "desc" }}
						searchPlaceholder="Search posts…"
						emptyMessage="No posts yet."
					/>
				</div>
			)}
		</section>
	);
}
