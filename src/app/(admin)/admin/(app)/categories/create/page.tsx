"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { createCategory, slugify } from "@/lib/categories";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Text } from "@/components/ui/Text";

export default function CreateCategory() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [slugEdited, setSlugEdited] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	// Keep slug in sync with name until the user edits it by hand.
	function handleNameChange(value: string) {
		setName(value);
		if (!slugEdited) setSlug(slugify(value));
	}

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setSubmitting(true);

		const form = new FormData(e.currentTarget);
		try {
			await createCategory({
				name: name.trim(),
				slug: slug.trim(),
				description: String(form.get("description") ?? "").trim() || null,
			});
			router.push("/admin/categories");
		} catch (err) {
			setError((err as Error).message);
			setSubmitting(false);
		}
	}

	return (
		<section className="animate-fade-in">
			<Link
				href="/admin/categories"
				className="text-body/60 hover:text-body inline-flex items-center gap-1 text-sm"
			>
				<ArrowLeft className="h-4 w-4" aria-hidden="true" />
				Back to categories
			</Link>

			<form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4">
				<Input
					label="Name"
					name="name"
					type="text"
					required
					value={name}
					onChange={(e) => handleNameChange(e.target.value)}
				/>
				<Input
					label="Slug"
					name="slug"
					type="text"
					required
					value={slug}
					onChange={(e) => {
						setSlug(slugify(e.target.value));
						setSlugEdited(true);
					}}
				/>
				<Textarea label="Description" name="description" rows={3} />

				{error && (
					<Text variant="caption" className="text-red-600" role="alert">
						{error}
					</Text>
				)}

				<Button type="submit" variant="dark" disabled={submitting}>
					{submitting ? "Creating…" : "Create category"}
				</Button>
			</form>
		</section>
	);
}
