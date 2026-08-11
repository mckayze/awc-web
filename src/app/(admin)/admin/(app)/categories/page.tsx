"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { listCategories } from "@/lib/categories";
import type { Category } from "@/lib/categories";
import { usePermissions } from "@/lib/permissions";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/admin/DataTable";
import type { Column } from "@/components/admin/DataTable";

export default function AllCategories() {
	const { has, hasAny } = usePermissions();
	const router = useRouter();
	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		listCategories()
			.then(setCategories)
			.catch((e: Error) => setError(e.message))
			.finally(() => setLoading(false));
	}, []);

	const canEdit = hasAny("categories.edit");

	const columns = useMemo<Column<Category>[]>(
		() => [
			{
				key: "name",
				header: "Name",
				cell: (c) => c.name,
				sortBy: (c) => c.name.toLowerCase(),
				searchBy: (c) => c.name,
			},
			{
				key: "slug",
				header: "Slug",
				cell: (c) => <code className="text-caption">{c.slug}</code>,
				sortBy: (c) => c.slug.toLowerCase(),
				searchBy: (c) => c.slug,
				cellClassName: "text-body/70",
			},
			{
				key: "posts",
				header: "Posts",
				cell: (c) => c.post_count,
				sortBy: (c) => c.post_count,
				cellClassName: "text-body/70",
			},
			{
				key: "created",
				header: "Created",
				cell: (c) => new Date(c.created_at).toLocaleDateString(),
				sortBy: (c) => c.created_at,
				cellClassName: "text-body/70",
			},
			...(canEdit
				? [
						{
							key: "actions",
							header: "",
							align: "right" as const,
							cell: (c: Category) => (
								<Link
									href={`/admin/categories/${c.id}/edit`}
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
				{has("categories.create") && (
					<Button
						type="button"
						onClick={() => router.push("/admin/categories/create")}
						leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
					>
						New category
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
						data={categories}
						rowKey={(c) => c.id}
						searchPlaceholder="Search categories…"
						emptyMessage="No categories yet."
					/>
				</div>
			)}
		</section>
	);
}
