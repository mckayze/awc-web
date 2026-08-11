"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function Login() {
	const router = useRouter();
	const { signIn } = useAuth();
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	// The "already signed in, skip this screen" redirect that used to live here
	// as <Navigate to="/dashboard"> is now the proxy's job — it runs before this
	// page is ever sent.

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setSubmitting(true);

		const form = new FormData(e.currentTarget);
		const email = String(form.get("email") ?? "");
		const password = String(form.get("password") ?? "");

		const { error } = await signIn(email, password);

		if (error) {
			setSubmitting(false);
			setError(error);
			return;
		}

		// refresh() re-runs the proxy and server layout against the session
		// cookie that signIn just set; without it the server still sees anon.
		router.replace("/admin");
		router.refresh();
	}

	return (
		<div className="bg-background text-body flex min-h-screen items-center justify-center font-sans">
			<form
				onSubmit={handleSubmit}
				className="animate-fade-in border-border bg-nav w-full max-w-sm border p-8"
			>
				<h1 className="font-title text-h3 font-bold">Sign in</h1>
				<p className="text-caption text-body/60 mt-1">Welcome back to the admin app.</p>

				<label className="text-caption mt-6 block font-medium" htmlFor="email">
					Email
				</label>
				<input
					id="email"
					name="email"
					type="email"
					autoComplete="email"
					required
					className="border-border bg-background focus:border-body mt-1 w-full border px-3 py-2 text-sm outline-none"
				/>

				<label className="text-caption mt-4 block font-medium" htmlFor="password">
					Password
				</label>
				<input
					id="password"
					name="password"
					type="password"
					autoComplete="current-password"
					required
					className="border-border bg-background focus:border-body mt-1 w-full border px-3 py-2 text-sm outline-none"
				/>

				{error && (
					<p className="text-caption mt-4 text-red-600" role="alert">
						{error}
					</p>
				)}

				<button
					type="submit"
					disabled={submitting}
					className="bg-body text-background mt-6 w-full px-3 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
				>
					{submitting ? "Signing in…" : "Sign in"}
				</button>
			</form>
		</div>
	);
}
