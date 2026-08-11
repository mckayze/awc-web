"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { deleteUser, getUserById, listRoles, resetPassword, updateProfile } from "@/lib/users";
import type { Profile, Role } from "@/lib/users";
import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/lib/permissions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";

const selectClass =
	"w-full bg-white border border-border rounded-base px-3 min-h-11 text-base text-body focus:outline-none";

export default function EditUser() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const { user } = useAuth();
	const { has } = usePermissions();
	const [profile, setProfile] = useState<Profile | null>(null);
	const [roles, setRoles] = useState<Role[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [pwBusy, setPwBusy] = useState(false);
	const [pwNotice, setPwNotice] = useState<string | null>(null);
	const [deleting, setDeleting] = useState(false);

	const isSelf = !!user && user.id === id;

	useEffect(() => {
		if (!id) return;
		Promise.all([getUserById(id), listRoles()])
			.then(([p, r]) => {
				setProfile(p);
				setRoles(r);
			})
			.catch((e: Error) => setError(e.message))
			.finally(() => setLoading(false));
	}, [id]);

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!id) return;
		setError(null);
		setSubmitting(true);

		const form = new FormData(e.currentTarget);
		try {
			await updateProfile(id, {
				full_name: String(form.get("full_name") ?? "").trim() || null,
				username: String(form.get("username") ?? "").trim() || null,
				is_enabled: form.get("is_enabled") === "on",
				role_id: String(form.get("role_id") ?? "") || null,
			});
			router.push("/admin/users");
		} catch (err) {
			setError((err as Error).message);
			setSubmitting(false);
		}
	}

	async function handleResetPassword(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!id) return;
		setPwNotice(null);
		const form = e.currentTarget;
		const password = String(new FormData(form).get("new_password") ?? "");
		setPwBusy(true);
		try {
			await resetPassword(id, password);
			form.reset();
			setPwNotice("Password updated.");
		} catch (err) {
			setPwNotice((err as Error).message);
		} finally {
			setPwBusy(false);
		}
	}

	async function handleDelete() {
		if (!id) return;
		if (!confirm("Delete this user permanently? This cannot be undone.")) return;
		setError(null);
		setDeleting(true);
		try {
			await deleteUser(id);
			router.push("/admin/users");
		} catch (err) {
			setError((err as Error).message);
			setDeleting(false);
		}
	}

	if (loading) return <p className="text-body/60 text-sm">Loading…</p>;
	if (!profile) {
		return (
			<section className="animate-fade-in">
				<p className="text-sm text-red-600">{error ?? "User not found."}</p>
				<Link href="/admin/users" className="text-body/60 mt-3 inline-block text-sm">
					Back to users
				</Link>
			</section>
		);
	}

	return (
		<section className="animate-fade-in">
			<Link
				href="/admin/users"
				className="text-body/60 hover:text-body inline-flex items-center gap-1 text-sm"
			>
				<ArrowLeft className="h-4 w-4" aria-hidden="true" />
				Back to users
			</Link>

			<Text variant="caption" className="text-body/60 mt-3">
				{profile.email}
			</Text>

			<form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4">
				<Input label="Full name" name="full_name" type="text" defaultValue={profile.full_name ?? ""} />
				<Input label="Username" name="username" type="text" defaultValue={profile.username ?? ""} />

				<div className="flex flex-col gap-1.5">
					<label className="text-sm font-medium text-black" htmlFor="role_id">
						Role
					</label>
					<select
						id="role_id"
						name="role_id"
						defaultValue={profile.role_id ?? ""}
						className={selectClass}
					>
						<option value="">No role</option>
						{roles.map((role) => (
							<option key={role.id} value={role.id}>
								{role.name}
							</option>
						))}
					</select>
				</div>

				<label className="flex items-center gap-2 text-sm">
					<input name="is_enabled" type="checkbox" defaultChecked={profile.is_enabled} />
					Enabled
				</label>

				{error && (
					<Text variant="caption" className="text-red-600" role="alert">
						{error}
					</Text>
				)}

				<Button type="submit" variant="dark" disabled={submitting}>
					{submitting ? "Saving…" : "Save changes"}
				</Button>
			</form>

			{/* Reset password (sets a new one directly — no email round-trip). */}
			{has("users.edit") && (
				<form onSubmit={handleResetPassword} className="border-border mt-10 max-w-md border-t pt-6">
					<h2 className="text-caption font-medium">Reset password</h2>
					<Text variant="caption" className="text-body/60 mt-1">
						Sets a new password immediately.
					</Text>
					<Input
						name="new_password"
						type="text"
						required
						minLength={6}
						placeholder="New password"
						className="mt-3"
					/>
					{pwNotice && (
						<Text variant="caption" className="text-body/70 mt-2" role="status">
							{pwNotice}
						</Text>
					)}
					<Button type="submit" variant="outline" disabled={pwBusy} className="mt-3">
						{pwBusy ? "Updating…" : "Update password"}
					</Button>
				</form>
			)}

			{/* Delete user — disabled for your own account (the function rejects it too). */}
			{has("users.delete") && !isSelf && (
				<div className="border-border mt-10 max-w-md border-t pt-6">
					<h2 className="text-caption font-medium text-red-600">Danger zone</h2>
					<button
						type="button"
						onClick={handleDelete}
						disabled={deleting}
						className="mt-3 border border-red-600 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-600 hover:text-white disabled:opacity-50"
					>
						{deleting ? "Deleting…" : "Delete user"}
					</button>
				</div>
			)}
		</section>
	);
}
