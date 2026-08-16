"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { ArrowLeft, X } from "lucide-react";
import {
	deleteCategory,
	getCategoryById,
	listEditorsPicks,
	setEditorsPicks,
	slugify,
	updateCategory,
} from "@/lib/categories";
import type { Category, EditorsPick } from "@/lib/categories";
import { usePermissions } from "@/lib/permissions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Text } from "@/components/ui/Text";
import { PostPicker } from "@/components/admin/PostPicker";

export default function EditCategory() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const { hasAny } = usePermissions();
	const [category, setCategory] = useState<Category | null>(null);
	const [slug, setSlug] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [deleting, setDeleting] = useState(false);

	const [picks, setPicks] = useState<EditorsPick[]>([]);
	const [pickerOpen, setPickerOpen] = useState(false);

	useEffect(() => {
		if (!id) return;
		Promise.all([getCategoryById(id), listEditorsPicks(id)])
			.then(([c, editorsPicks]) => {
				setCategory(c);
				setSlug(c?.slug ?? "");
				setPicks(editorsPicks);
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
			await updateCategory(id, {
				name: String(form.get("name") ?? "").trim(),
				slug: slug.trim(),
				description: String(form.get("description") ?? "").trim() || null,
			});
			await setEditorsPicks(
				id,
				picks.map((p) => p.id),
			);
			router.push("/admin/categories");
		} catch (err) {
			setError((err as Error).message);
			setSubmitting(false);
		}
	}

	async function handleDelete() {
		if (!id) return;
		if (!confirm("Delete this category? This cannot be undone.")) return;
		setError(null);
		setDeleting(true);
		try {
			await deleteCategory(id);
			router.push("/admin/categories");
		} catch (err) {
			setError((err as Error).message);
			setDeleting(false);
		}
	}

	if (loading) return <p className="text-body/60 text-sm">Loading…</p>;
	if (!category) {
		return (
			<section className="animate-fade-in">
				<p className="text-sm text-red-600">{error ?? "Category not found."}</p>
				<Link href="/admin/categories" className="text-body/60 mt-3 inline-block text-sm">
					Back to categories
				</Link>
			</section>
		);
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
				<Input label="Name" name="name" type="text" required defaultValue={category.name} />
				<Input
					label="Slug"
					name="slug"
					type="text"
					required
					value={slug}
					onChange={(e) => setSlug(slugify(e.target.value))}
				/>
				<Textarea
					label="Description"
					name="description"
					rows={3}
					defaultValue={category.description ?? ""}
				/>

				<div>
					<label className="text-sm font-medium text-black">Editor's Picks</label>
					<p className="text-body/60 mt-1 text-xs">
						Featured posts shown under "Editor's Picks" on this category's page.
					</p>

					{picks.length > 0 && (
						<ul className="mt-3 space-y-1.5">
							{picks.map((pick) => (
								<li
									key={pick.id}
									className="border-border flex items-center justify-between gap-2 border bg-white px-3 py-2 text-sm"
								>
									<span className="truncate">{pick.title}</span>
									<button
										type="button"
										aria-label="Remove"
										onClick={() => setPicks((cur) => cur.filter((p) => p.id !== pick.id))}
										className="text-body/50 hover:text-body shrink-0"
									>
										<X className="h-4 w-4" />
									</button>
								</li>
							))}
						</ul>
					)}

					<Button
						type="button"
						variant="outline"
						className="mt-3 min-h-9 px-4 text-sm"
						onClick={() => setPickerOpen(true)}
					>
						{picks.length > 0 ? "Change posts…" : "Choose posts…"}
					</Button>
				</div>

				{error && (
					<Text variant="caption" className="text-red-600" role="alert">
						{error}
					</Text>
				)}

				<Button type="submit" variant="dark" disabled={submitting}>
					{submitting ? "Saving…" : "Save changes"}
				</Button>
			</form>

			{hasAny("categories.delete") && (
				<div className="border-border mt-10 max-w-md border-t pt-6">
					<h2 className="text-caption font-medium text-red-600">Danger zone</h2>
					<button
						type="button"
						onClick={handleDelete}
						disabled={deleting}
						className="mt-3 border border-red-600 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-600 hover:text-white disabled:opacity-50"
					>
						{deleting ? "Deleting…" : "Delete category"}
					</button>
				</div>
			)}

			{pickerOpen && (
				<PostPicker selected={picks} onChange={setPicks} onClose={() => setPickerOpen(false)} />
			)}
		</section>
	);
}
