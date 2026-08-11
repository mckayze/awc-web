"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPageById, updatePage } from "@/lib/pages";
import type { Page, PageStatus } from "@/lib/pages";
import { EMPTY_CONTENT } from "@/lib/posts";
import type { PostContent } from "@/lib/posts";
import { usePermissions } from "@/lib/permissions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { BlockEditor } from "@/components/admin/BlockEditor";

export default function EditPage() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const { has } = usePermissions();
	const canPublish = has("pages.publish");

	const [page, setPage] = useState<Page | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);

	const [title, setTitle] = useState("");
	const [status, setStatus] = useState<PageStatus>("draft");
	const [content, setContent] = useState<PostContent>(EMPTY_CONTENT);

	useEffect(() => {
		if (!id) return;
		getPageById(id)
			.then((p) => {
				setPage(p);
				if (p) {
					setTitle(p.title);
					setStatus(p.status);
					setContent(p.content);
				}
			})
			.catch((e: Error) => setError(e.message))
			.finally(() => setLoading(false));
	}, [id]);

	// Auto-dismiss the "saved" confirmation.
	useEffect(() => {
		if (!notice) return;
		const t = setTimeout(() => setNotice(null), 3000);
		return () => clearTimeout(t);
	}, [notice]);

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!id) return;
		setError(null);
		setNotice(null);
		setSubmitting(true);
		try {
			await updatePage(id, { title: title.trim(), content, status });
			setSubmitting(false);
			setNotice("All changes saved");
		} catch (err) {
			setError((err as Error).message);
			setSubmitting(false);
		}
	}

	if (loading) return <p className="text-body/60 text-sm">Loading…</p>;
	if (!page) {
		return (
			<section className="animate-fade-in">
				<p className="text-sm text-red-600">{error ?? "Page not found."}</p>
				<Link href="/admin/pages" className="text-body/60 mt-3 inline-block text-sm">
					Back to pages
				</Link>
			</section>
		);
	}

	return (
		<section className="animate-fade-in pb-40">
			<Link
				href="/admin/pages"
				className="text-body/60 hover:text-body inline-flex items-center gap-1 text-sm"
			>
				<ArrowLeft className="h-4 w-4" aria-hidden="true" />
				Back to pages
			</Link>

			<form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
				{/* Main column */}
				<div className="space-y-4">
					<Input
						label="Title"
						name="title"
						type="text"
						required
						value={title}
						onChange={(e) => setTitle(e.target.value)}
					/>

					{/* Slug is fixed — the frontend links to system pages by slug. */}
					<div>
						<label className="text-sm font-medium text-black">Slug</label>
						<div className="border-border bg-nav text-body/70 mt-1.5 flex items-center border px-3 py-2 text-sm">
							<code>{page.slug}</code>
						</div>
					</div>

					<div>
						<label className="text-sm font-medium text-black">Content</label>
						<div className="mt-1.5">
							<BlockEditor value={content} onChange={setContent} />
						</div>
					</div>
				</div>

				{/* Sidebar column */}
				<aside className="space-y-6">
					<div className="border-border border bg-white p-4">
						<h2 className="text-caption text-body/60 font-medium uppercase">Visibility</h2>
						<div className="mt-3 space-y-2">
							<StatusOption label="Draft" value="draft" current={status} onChange={setStatus} />
							<StatusOption
								label="Published"
								value="published"
								current={status}
								onChange={setStatus}
								disabled={!canPublish}
							/>
						</div>
						{!canPublish && (
							<Text variant="caption" className="text-body/50 mt-3">
								You can save drafts. Publishing requires the publish permission.
							</Text>
						)}
					</div>
				</aside>

				{/* Floating action bar — matches the post editor; aligned to the main
            content column (not the sidebar). */}
				<div className="fixed bottom-[30px] left-72 right-8 z-20 lg:right-[23.5rem]">
					<div className="border-border flex items-center justify-between gap-4 border bg-white px-4 py-3 shadow-lg">
						<div className="flex min-w-0 items-center gap-3">
							<Button
								type="submit"
								variant="dark"
								disabled={submitting}
								className="min-h-10 shrink-0 px-4"
							>
								{submitting ? "Saving…" : "Save changes"}
							</Button>
							{error ? (
								<Text variant="caption" className="truncate text-red-600" role="alert">
									{error}
								</Text>
							) : notice ? (
								<Text variant="caption" className="truncate text-green-700">
									{notice}
								</Text>
							) : null}
						</div>
						<Button
							type="button"
							variant="outline"
							onClick={() => router.push("/admin/pages")}
							className="min-h-10 shrink-0 px-4"
							leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
						>
							Go back
						</Button>
					</div>
				</div>
			</form>
		</section>
	);
}

function StatusOption({
	label,
	value,
	current,
	onChange,
	disabled = false,
}: {
	label: string;
	value: PageStatus;
	current: PageStatus;
	onChange: (v: PageStatus) => void;
	disabled?: boolean;
}) {
	return (
		<label className={`flex items-center gap-2 text-sm ${disabled ? "text-body/40" : ""}`}>
			<input
				type="radio"
				name="status"
				checked={current === value}
				disabled={disabled}
				onChange={() => onChange(value)}
			/>
			{label}
		</label>
	);
}
