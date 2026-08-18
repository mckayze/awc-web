"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Eye } from "lucide-react";
import { deletePost, getPostById, postState, setPostCategories, updatePost } from "@/lib/posts";
import type { Post } from "@/lib/posts";
import { usePermissions } from "@/lib/permissions";
import { UNSAVED_CHANGES_MESSAGE } from "@/lib/useUnsavedChangesGuard";
import { PostForm } from "@/components/admin/PostForm";
import type { PostFormSubmit, PostFormSubmitOptions } from "@/components/admin/PostForm";
import { ConfirmModal } from "@/components/admin/ConfirmModal";

export default function EditPost() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const { hasAny } = usePermissions();
	const [post, setPost] = useState<Post | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [dirty, setDirty] = useState(false);

	useEffect(() => {
		if (!id) return;
		getPostById(id)
			.then(setPost)
			.catch((e: Error) => setError(e.message))
			.finally(() => setLoading(false));
	}, [id]);

	// Auto-dismiss the "saved" confirmation.
	useEffect(() => {
		if (!notice) return;
		const t = setTimeout(() => setNotice(null), 3000);
		return () => clearTimeout(t);
	}, [notice]);

	async function handleSubmit(
		{ input, categoryIds }: PostFormSubmit,
		opts?: PostFormSubmitOptions,
	): Promise<boolean> {
		if (!id) return false;
		setError(null);
		setNotice(null);
		setSubmitting(true);
		try {
			await updatePost(id, input);
			await setPostCategories(id, categoryIds);
			// Stay on the page — just confirm the save.
			setSubmitting(false);
			setNotice(opts?.silent ? "Draft autosaved" : "All changes saved");
			return true;
		} catch (err) {
			setError((err as Error).message);
			setSubmitting(false);
			return false;
		}
	}

	async function handleDelete() {
		if (!id) return;
		setError(null);
		setDeleting(true);
		try {
			await deletePost(id);
			router.push("/admin/posts");
		} catch (err) {
			setError((err as Error).message);
			setDeleting(false);
			setConfirmDelete(false);
		}
	}

	if (loading) return <p className="text-body/60 text-sm">Loading…</p>;
	if (!post) {
		return (
			<section className="animate-fade-in">
				<p className="text-sm text-red-600">{error ?? "Post not found."}</p>
				<Link href="/admin/posts" className="text-body/60 mt-3 inline-block text-sm">
					Back to posts
				</Link>
			</section>
		);
	}

	// Once a post is actually live there's no point previewing a private copy of
	// it — send the editor to the real URL instead. "scheduled" stays on preview:
	// the row says published but the date is future, so /blog/[slug] would 404.
	const isLive = postState(post.status, post.publishedAt) === "published";

	return (
		<section className="animate-fade-in pb-40">
			<div className="flex items-center justify-between gap-4">
				<Link
					href="/admin/posts"
					onClick={(e) => {
						if (dirty && !window.confirm(UNSAVED_CHANGES_MESSAGE)) e.preventDefault();
					}}
					className="border-body text-body hover:bg-body hover:text-background inline-flex items-center gap-1.5 border px-3 py-2 text-sm font-medium transition-colors"
				>
					<ArrowLeft className="h-4 w-4" aria-hidden="true" />
					Back to posts
				</Link>

				{/* Both read the saved row, so unsaved edits in the form aren't
				    reflected — new tab so nothing in progress is lost. */}
				<a
					href={isLive ? `/blog/${post.slug}` : `/admin/preview/posts/${id}`}
					target="_blank"
					rel="noopener noreferrer"
					className="bg-body text-background inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-opacity hover:opacity-90"
				>
					{isLive ? (
						<ExternalLink className="h-4 w-4" aria-hidden="true" />
					) : (
						<Eye className="h-4 w-4" aria-hidden="true" />
					)}
					{isLive ? "View live post" : "Preview"}
				</a>
			</div>

			<PostForm
				submitLabel="Save changes"
				submitting={submitting}
				error={error}
				notice={notice}
				autosave
				onDirtyChange={setDirty}
				initial={{
					title: post.title,
					slug: post.slug,
					excerpt: post.excerpt,
					content: post.content,
					status: post.status,
					publishedAt: post.publishedAt,
					featuredImageId: post.featuredImageId,
					featuredImageUrl: post.featuredImageUrl,
					categoryIds: post.categories.map((c) => c.id),
				}}
				onSubmit={handleSubmit}
			/>

			{hasAny("posts.delete") && (
				<div className="border-border mt-10 border-t pt-6">
					<h2 className="text-caption font-medium text-red-600">Danger zone</h2>
					<button
						type="button"
						onClick={() => setConfirmDelete(true)}
						disabled={deleting}
						className="mt-3 border border-red-600 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-600 hover:text-white disabled:opacity-50"
					>
						Delete post
					</button>
				</div>
			)}

			{confirmDelete && (
				<ConfirmModal
					title="Delete post?"
					message="This permanently removes the post. This cannot be undone."
					confirmLabel="Delete"
					destructive
					busy={deleting}
					onConfirm={handleDelete}
					onCancel={() => setConfirmDelete(false)}
				/>
			)}
		</section>
	);
}
