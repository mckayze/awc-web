"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, ShieldAlert, UserX } from "lucide-react";
import { listPosts, postState } from "@/lib/posts";
import type { Post } from "@/lib/posts";
import { listUsers } from "@/lib/users";
import type { Profile } from "@/lib/users";
import { usePermissions } from "@/lib/permissions";
import { Panel } from "@/components/admin/Panel";

// The dashboard is a work queue, not an analytics page — there's no traffic
// data in Supabase to report. Everything here is either a count someone acts
// on or a thing that will happen without anyone touching it.
//
// Client-side like the rest of the admin, so the same RLS-backed lib functions
// and the permissions context work unchanged. Each block is gated on the same
// permission as its sidebar entry, and its query only runs if that passes.

function formatWhen(iso: string): string {
	return new Date(iso).toLocaleString(undefined, {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

// "in 3 days" / "in 4 hours" — the absolute date alone makes you do the
// arithmetic to work out whether something goes live tonight or next month.
function formatCountdown(iso: string): string {
	const ms = new Date(iso).getTime() - Date.now();
	const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
	const minutes = Math.round(ms / 60000);
	if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
	const hours = Math.round(ms / 3600000);
	if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
	return rtf.format(Math.round(ms / 86400000), "day");
}

export default function Dashboard() {
	const { has, hasAny, loading: permsLoading } = usePermissions();
	const canViewPosts = hasAny("posts.view");
	const canViewUsers = has("users.view");

	const [posts, setPosts] = useState<Post[]>([]);
	const [users, setUsers] = useState<Profile[] | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		// Permissions arrive a tick after mount; querying before they land would
		// fire requests the user isn't allowed to make.
		if (permsLoading) return;

		let active = true;
		setLoading(true);

		Promise.all([
			canViewPosts ? listPosts() : Promise.resolve([]),
			canViewUsers ? listUsers() : Promise.resolve(null),
		])
			.then(([postRows, userRows]) => {
				if (!active) return;
				setPosts(postRows);
				setUsers(userRows);
			})
			.catch((e: Error) => active && setError(e.message))
			.finally(() => active && setLoading(false));

		return () => {
			active = false;
		};
	}, [permsLoading, canViewPosts, canViewUsers]);

	const states = posts.map((p) => postState(p.status, p.publishedAt));
	const drafts = states.filter((s) => s === "draft").length;
	const published = states.filter((s) => s === "published").length;

	// Soonest first — this list is read as "what happens next".
	const scheduled = posts
		.filter((p) => postState(p.status, p.publishedAt) === "scheduled")
		.sort((a, b) => (a.publishedAt ?? "").localeCompare(b.publishedAt ?? ""));

	const disabledUsers = users?.filter((u) => !u.is_enabled) ?? [];
	// A profile with no role can sign in and do nothing — the trigger creates
	// the row on signup, but role_id stays null until someone assigns one.
	const rolelessUsers = users?.filter((u) => u.role_id === null) ?? [];

	if (loading) return <p className="text-body/60 text-sm">Loading…</p>;
	if (error) return <p className="text-sm text-red-600">{error}</p>;

	// One grid for every block — equal columns, one gap, so nothing sits at a
	// width of its own. List blocks span the full row rather than leaving a
	// ragged half-empty one.
	return (
		<section className="animate-fade-in grid grid-cols-1 gap-6 xl:grid-cols-2">
			{canViewPosts && (
				<Panel title="Posts" action={{ label: "All posts", href: "/admin/posts" }}>
					<div className="divide-border grid grid-cols-3 divide-x">
						<PostStat label="Drafts" value={drafts} />
						<PostStat label="Scheduled" value={scheduled.length} emphasis={scheduled.length > 0} />
						<PostStat label="Published" value={published} />
					</div>
				</Panel>
			)}

			{canViewUsers && users && (
				<Panel title="Users" action={{ label: "Manage users", href: "/admin/users" }}>
					<div className="flex flex-col gap-4">
						<div className="flex items-baseline gap-2">
							<span className="text-3xl font-bold">{users.length}</span>
							<span className="text-body/60 text-sm">account{users.length === 1 ? "" : "s"}</span>
						</div>

						<ul className="flex flex-col gap-2">
							<UserFlag
								icon={ShieldAlert}
								count={rolelessUsers.length}
								label="with no role assigned"
								empty="Everyone has a role"
							/>
							<UserFlag
								icon={UserX}
								count={disabledUsers.length}
								label="disabled"
								empty="No disabled accounts"
							/>
						</ul>
					</div>
				</Panel>
			)}

			{canViewPosts && (
				<div className="xl:col-span-2">
					<Panel title="Scheduled to publish" action={{ label: "All posts", href: "/admin/posts" }}>
						{scheduled.length === 0 ? (
							<p className="text-body/60 text-sm">Nothing scheduled.</p>
						) : (
							<ul className="flex flex-col divide-y divide-border">
								{scheduled.map((p) => (
									<li key={p.id}>
										<Link
											href={`/admin/posts/${p.id}/edit`}
											className="group flex items-start gap-3 py-3 first:pt-0 last:pb-0"
										>
											<CalendarClock
												className="text-body/40 mt-0.5 h-4 w-4 shrink-0"
												aria-hidden="true"
											/>
											<span className="min-w-0 flex-1">
												<span className="block truncate text-sm font-medium group-hover:underline underline-offset-4">
													{p.title}
												</span>
												<span className="text-caption text-body/60 mt-0.5 block">
													{p.publishedAt && (
														<>
															{formatWhen(p.publishedAt)} · {formatCountdown(p.publishedAt)}
														</>
													)}
												</span>
											</span>
										</Link>
									</li>
								))}
							</ul>
						)}
					</Panel>
				</div>
			)}
		</section>
	);
}

// One segment of the Posts block. A link rather than a number so the count is
// a way into the list, not just a readout.
function PostStat({
	label,
	value,
	emphasis = false,
}: {
	label: string;
	value: number;
	emphasis?: boolean;
}) {
	return (
		<Link href="/admin/posts" className="hover:bg-nav group px-4 py-2 text-center transition-colors">
			<span
				className={`block text-3xl font-bold ${emphasis ? "text-brand-dark" : "text-body"}`}
			>
				{value}
			</span>
			<span className="text-caption text-body/60 mt-1 block font-medium tracking-wide uppercase group-hover:underline underline-offset-4">
				{label}
			</span>
		</Link>
	);
}

function UserFlag({
	icon: Icon,
	count,
	label,
	empty,
}: {
	icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
	count: number;
	label: string;
	empty: string;
}) {
	return (
		<li className="flex items-center gap-2 text-sm">
			<Icon
				className={`h-4 w-4 shrink-0 ${count > 0 ? "text-brand-dark" : "text-body/30"}`}
				aria-hidden={true}
			/>
			{count > 0 ? (
				<span>
					<strong className="font-semibold">{count}</strong> {label}
				</span>
			) : (
				<span className="text-body/60">{empty}</span>
			)}
		</li>
	);
}
