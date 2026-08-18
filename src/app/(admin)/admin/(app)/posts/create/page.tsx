"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createPost, setPostCategories } from "@/lib/posts";
import { UNSAVED_CHANGES_MESSAGE } from "@/lib/useUnsavedChangesGuard";
import { PostForm } from "@/components/admin/PostForm";
import type { PostFormSubmit } from "@/components/admin/PostForm";

export default function CreatePost() {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [dirty, setDirty] = useState(false);

	async function handleSubmit({ input, categoryIds }: PostFormSubmit): Promise<boolean> {
		setError(null);
		setSubmitting(true);
		try {
			const id = await createPost(input);
			if (categoryIds.length > 0) await setPostCategories(id, categoryIds);
			// Move into the post's edit page so further saves update it in place.
			router.push(`/admin/posts/${id}/edit`);
			return true;
		} catch (err) {
			setError((err as Error).message);
			setSubmitting(false);
			return false;
		}
	}

	return (
		<section className="animate-fade-in pb-40">
			<Link
				href="/admin/posts"
				onClick={(e) => {
					if (dirty && !window.confirm(UNSAVED_CHANGES_MESSAGE)) e.preventDefault();
				}}
				className="text-body/60 hover:text-body inline-flex items-center gap-1 text-sm"
			>
				<ArrowLeft className="h-4 w-4" aria-hidden="true" />
				Back to posts
			</Link>

			<PostForm
				submitLabel="Create post"
				submitting={submitting}
				error={error}
				onDirtyChange={setDirty}
				onSubmit={handleSubmit}
			/>
		</section>
	);
}
