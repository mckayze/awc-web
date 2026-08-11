"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { createUser, listRoles } from "@/lib/users";
import type { Role } from "@/lib/users";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";

const selectClass =
	"w-full bg-white border border-border rounded-base px-3 min-h-11 text-base text-body focus:outline-none";

export default function CreateUser() {
	const router = useRouter();
	const [roles, setRoles] = useState<Role[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		listRoles()
			.then(setRoles)
			.catch((e: Error) => setError(e.message));
	}, []);

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setSubmitting(true);

		const form = new FormData(e.currentTarget);
		const email = String(form.get("email") ?? "");
		const password = String(form.get("password") ?? "");
		const full_name = String(form.get("full_name") ?? "").trim();
		const role_id = String(form.get("role_id") ?? "");

		try {
			await createUser({
				email,
				password,
				full_name: full_name || undefined,
				role_id: role_id || undefined,
			});
			router.push("/admin/users");
		} catch (err) {
			setError((err as Error).message);
			setSubmitting(false);
		}
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

			<form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4">
				<Input label="Full name" name="full_name" type="text" autoComplete="name" />
				<Input label="Email" name="email" type="email" autoComplete="off" required />
				<Input
					label="Temporary password"
					name="password"
					type="text"
					autoComplete="off"
					required
					minLength={6}
				/>

				<div className="flex flex-col gap-1.5">
					<label className="text-sm font-medium text-black" htmlFor="role_id">
						Role
					</label>
					<select id="role_id" name="role_id" defaultValue="" className={selectClass}>
						<option value="">No role</option>
						{roles.map((role) => (
							<option key={role.id} value={role.id}>
								{role.name}
							</option>
						))}
					</select>
				</div>

				{error && (
					<Text variant="caption" className="text-red-600" role="alert">
						{error}
					</Text>
				)}

				<Button type="submit" variant="dark" disabled={submitting}>
					{submitting ? "Creating…" : "Create user"}
				</Button>
			</form>
		</section>
	);
}
