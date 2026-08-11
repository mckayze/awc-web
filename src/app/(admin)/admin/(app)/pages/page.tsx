"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listPages } from "@/lib/pages";
import type { Page, PageStatus } from "@/lib/pages";
import { usePermissions } from "@/lib/permissions";
import { Pill } from "@/components/ui/Pill";
import { DataTable } from "@/components/admin/DataTable";
import type { Column } from "@/components/admin/DataTable";

const STATUS_STYLES: Record<PageStatus, { label: string; color: string }> = {
	draft: { label: "Draft", color: "bg-white" },
	published: { label: "Published", color: "bg-green-100" },
};

export default function AllPages() {
	const { has } = usePermissions();
	const [pages, setPages] = useState<Page[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		listPages()
			.then(setPages)
			.catch((e: Error) => setError(e.message))
			.finally(() => setLoading(false));
	}, []);

	const canEdit = has("pages.edit");

	const columns = useMemo<Column<Page>[]>(
		() => [
			{
				key: "title",
				header: "Title",
				cell: (p) => (
					<span className="flex items-center gap-2">
						{p.title}
						{p.isSystem && <Pill label="System" color="bg-nav" />}
					</span>
				),
				sortBy: (p) => p.title.toLowerCase(),
				searchBy: (p) => p.title,
			},
			{
				key: "slug",
				header: "Slug",
				cell: (p) => <code className="text-caption">{p.slug}</code>,
				sortBy: (p) => p.slug.toLowerCase(),
				searchBy: (p) => p.slug,
				cellClassName: "text-body/70",
			},
			{
				key: "status",
				header: "Status",
				cell: (p) => {
					const style = STATUS_STYLES[p.status];
					return <Pill label={style.label} color={style.color} />;
				},
				sortBy: (p) => p.status,
			},
			{
				key: "updated",
				header: "Updated",
				cell: (p) => new Date(p.updatedAt).toLocaleDateString(),
				sortBy: (p) => p.updatedAt,
				cellClassName: "text-body/70",
			},
			...(canEdit
				? [
						{
							key: "actions",
							header: "",
							align: "right" as const,
							cell: (p: Page) => (
								<Link
									href={`/admin/pages/${p.id}/edit`}
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
						data={pages}
						rowKey={(p) => p.id}
						defaultSort={{ key: "title", dir: "asc" }}
						searchPlaceholder="Search pages…"
						emptyMessage="No pages yet."
					/>
				</div>
			)}
		</section>
	);
}
