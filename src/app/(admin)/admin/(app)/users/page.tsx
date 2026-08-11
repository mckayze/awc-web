"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { listUsers } from "@/lib/users";
import type { Profile } from "@/lib/users";
import { usePermissions } from "@/lib/permissions";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/admin/DataTable";
import type { Column } from "@/components/admin/DataTable";

export default function AllUsers() {
	const { has } = usePermissions();
	const router = useRouter();
	const [users, setUsers] = useState<Profile[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		listUsers()
			.then(setUsers)
			.catch((e: Error) => setError(e.message))
			.finally(() => setLoading(false));
	}, []);

	const canEdit = has("users.edit");

	const columns = useMemo<Column<Profile>[]>(
		() => [
			{
				key: "name",
				header: "Name",
				cell: (u) => u.full_name ?? "—",
				sortBy: (u) => (u.full_name ?? "").toLowerCase(),
				searchBy: (u) => u.full_name ?? "",
			},
			{
				key: "email",
				header: "Email",
				cell: (u) => u.email ?? "—",
				sortBy: (u) => (u.email ?? "").toLowerCase(),
				searchBy: (u) => u.email ?? "",
			},
			{
				key: "username",
				header: "Username",
				cell: (u) => u.username ?? "—",
				sortBy: (u) => (u.username ?? "").toLowerCase(),
				searchBy: (u) => u.username ?? "",
			},
			{
				key: "status",
				header: "Status",
				cell: (u) => (
					<span className={u.is_enabled ? "text-green-700" : "text-body/50"}>
						{u.is_enabled ? "Enabled" : "Disabled"}
					</span>
				),
				sortBy: (u) => (u.is_enabled ? 0 : 1),
			},
			{
				key: "created",
				header: "Created",
				cell: (u) => new Date(u.created_at).toLocaleDateString(),
				sortBy: (u) => u.created_at,
				cellClassName: "text-body/70",
			},
			...(canEdit
				? [
						{
							key: "actions",
							header: "",
							align: "right" as const,
							cell: (u: Profile) => (
								<Link
									href={`/admin/users/${u.id}/edit`}
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
				{has("users.create") && (
					<Button
						type="button"
						onClick={() => router.push("/admin/users/create")}
						leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
					>
						New user
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
						data={users}
						rowKey={(u) => u.id}
						searchPlaceholder="Search users…"
						emptyMessage="No users yet."
					/>
				</div>
			)}
		</section>
	);
}
