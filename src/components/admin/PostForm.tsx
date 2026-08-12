"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, X } from "lucide-react";
import { slugify, listCategories } from "@/lib/categories";
import type { Category } from "@/lib/categories";
import { EMPTY_CONTENT, postState } from "@/lib/posts";
import type { PostContent, PostInput, PostStatus } from "@/lib/posts";
import { usePermissions } from "@/lib/permissions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Text } from "@/components/ui/Text";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { MultiSelect } from "@/components/admin/MultiSelect";
import { DateTimePicker } from "@/components/admin/DateTimePicker";
import { BlockEditor } from "@/components/admin/BlockEditor";

// What the form collects. Create/Edit pages turn this into a PostInput +
// category id list and persist it.
export type PostFormSubmit = {
	input: PostInput;
	categoryIds: string[];
};

export type PostFormInitial = {
	title?: string;
	slug?: string;
	excerpt?: string | null;
	content?: PostContent;
	status?: PostStatus;
	publishedAt?: string | null;
	featuredImageId?: string | null;
	featuredImageUrl?: string | null;
	categoryIds?: string[];
};

// Visibility is the user-facing choice; it maps to (status, published_at).
// "scheduled" isn't a stored status — it's published with a future date.
type Visibility = "draft" | "published" | "scheduled";

// ISO timestamp ⇆ <input type="datetime-local"> ("YYYY-MM-DDTHH:mm", local).
function isoToLocalInput(iso: string | null): string {
	if (!iso) return "";
	const d = new Date(iso);
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
		d.getHours(),
	)}:${pad(d.getMinutes())}`;
}

function localInputToIso(value: string): string | null {
	if (!value) return null;
	return new Date(value).toISOString();
}

export function PostForm({
	submitLabel,
	initial = {},
	submitting,
	error,
	notice = null,
	onSubmit,
}: {
	submitLabel: string;
	initial?: PostFormInitial;
	submitting: boolean;
	error: string | null;
	notice?: string | null;
	onSubmit: (data: PostFormSubmit) => void;
}) {
	const { has } = usePermissions();
	const router = useRouter();
	const canPublish = has("posts.publish");

	const [title, setTitle] = useState(initial.title ?? "");
	const [slug, setSlug] = useState(initial.slug ?? "");
	const [slugEdited, setSlugEdited] = useState(Boolean(initial.slug));
	const [excerpt, setExcerpt] = useState(initial.excerpt ?? "");
	const [content, setContent] = useState<PostContent>(initial.content ?? EMPTY_CONTENT);

	const initialVisibility: Visibility = postState(
		initial.status ?? "draft",
		initial.publishedAt ?? null,
	);
	const [visibility, setVisibility] = useState<Visibility>(initialVisibility);
	const [scheduledAt, setScheduledAt] = useState(isoToLocalInput(initial.publishedAt ?? null));

	const [featuredId, setFeaturedId] = useState<string | null>(initial.featuredImageId ?? null);
	const [featuredUrl, setFeaturedUrl] = useState<string | null>(initial.featuredImageUrl ?? null);
	const [pickerOpen, setPickerOpen] = useState(false);

	const [categories, setCategories] = useState<Category[]>([]);
	const [categoryIds, setCategoryIds] = useState<string[]>(initial.categoryIds ?? []);

	useEffect(() => {
		listCategories()
			.then(setCategories)
			.catch(() => setCategories([]));
	}, []);

	function handleTitleChange(value: string) {
		setTitle(value);
		if (!slugEdited) setSlug(slugify(value));
	}

	function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();

		// Map visibility → (status, published_at).
		let status: PostStatus = "draft";
		let publishedAt: string | null = null;
		if (visibility === "published") {
			status = "published";
			// Keep the original date when editing an already-live post, but a
			// future one (left over from a schedule) would keep it hidden.
			const prior = initial.publishedAt;
			publishedAt =
				prior && new Date(prior) <= new Date() ? prior : new Date().toISOString();
		} else if (visibility === "scheduled") {
			status = "published";
			publishedAt = localInputToIso(scheduledAt);
		}

		onSubmit({
			input: {
				title: title.trim(),
				slug: slug.trim(),
				excerpt: excerpt.trim() || null,
				content,
				status,
				featuredImageId: featuredId,
				publishedAt,
			},
			categoryIds,
		});
	}

	return (
		<form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
			{/* Main column */}
			<div className="space-y-4">
				<Input
					label="Title"
					name="title"
					type="text"
					required
					value={title}
					onChange={(e) => handleTitleChange(e.target.value)}
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
				<Textarea
					label="Excerpt"
					name="excerpt"
					rows={2}
					value={excerpt}
					onChange={(e) => setExcerpt(e.target.value)}
				/>

				<div>
					<label className="text-sm font-medium text-black">Content</label>
					<div className="mt-1.5">
						<BlockEditor value={content} onChange={setContent} />
					</div>
				</div>
			</div>

			{/* Sidebar column */}
			<aside className="space-y-6">
				{/* Visibility */}
				<div className="border-border border bg-white p-4">
					<h2 className="text-caption text-body/60 font-medium uppercase">Visibility</h2>
					<div className="mt-3 space-y-2">
						<VisibilityOption
							label="Draft"
							value="draft"
							current={visibility}
							onChange={setVisibility}
						/>
						<VisibilityOption
							label="Published"
							value="published"
							current={visibility}
							onChange={setVisibility}
							disabled={!canPublish}
						/>
						<VisibilityOption
							label="Scheduled"
							value="scheduled"
							current={visibility}
							onChange={setVisibility}
							disabled={!canPublish}
						/>
					</div>
					{visibility === "scheduled" && (
						<div className="mt-3">
							<label className="text-caption text-body/60 block">Publish at</label>
							<div className="mt-1">
								<DateTimePicker value={scheduledAt} onChange={setScheduledAt} />
							</div>
						</div>
					)}
					{!canPublish && (
						<Text variant="caption" className="text-body/50 mt-3">
							You can save drafts. Publishing requires the publish permission.
						</Text>
					)}
				</div>

				{/* Featured image */}
				<div className="border-border border bg-white p-4">
					<h2 className="text-caption text-body/60 font-medium uppercase">Featured image</h2>
					{featuredUrl ? (
						<div className="border-border relative mt-3 overflow-hidden border">
							<img src={featuredUrl} alt="" className="aspect-video w-full object-cover" />
							<button
								type="button"
								onClick={() => {
									setFeaturedId(null);
									setFeaturedUrl(null);
								}}
								aria-label="Remove featured image"
								className="bg-background/90 border-border absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center border"
							>
								<X className="h-4 w-4" />
							</button>
						</div>
					) : (
						<button
							type="button"
							onClick={() => setPickerOpen(true)}
							className="border-border text-body/60 hover:bg-nav mt-3 flex aspect-video w-full flex-col items-center justify-center gap-1 border border-dashed text-sm"
						>
							<ImagePlus className="h-6 w-6" aria-hidden="true" />
							Choose image
						</button>
					)}
				</div>

				{/* Categories */}
				<div className="border-border border bg-white p-4">
					<h2 className="text-caption text-body/60 font-medium uppercase">Categories</h2>
					<div className="mt-3">
						<MultiSelect
							options={categories.map((c) => ({ value: c.id, label: c.name }))}
							selected={categoryIds}
							onChange={setCategoryIds}
							placeholder="Select categories…"
							emptyText="No categories yet."
						/>
					</div>
				</div>
			</aside>

			{/* Floating action bar — fixed 30px above the viewport bottom, aligned to
          the main content column only (left = sidebar w-64 + main pl-8; right =
          main pr-8 + aside 20rem + grid gap-6) so it spans Title…Content, not
          the Visibility/Featured/Categories sidebar. */}
			<div className="fixed bottom-[30px] left-72 right-8 z-20 lg:right-[23.5rem]">
				<div className="border-border flex items-center justify-between gap-4 border bg-white px-4 py-3 shadow-lg">
					<div className="flex min-w-0 items-center gap-3">
						<Button
							type="submit"
							variant="dark"
							disabled={submitting}
							className="min-h-10 shrink-0 px-4"
						>
							{submitting ? "Saving…" : submitLabel}
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
						onClick={() => router.push("/admin/posts")}
						className="min-h-10 shrink-0 px-4"
						leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
					>
						Go back
					</Button>
				</div>
			</div>

			{pickerOpen && (
				<MediaPicker
					onClose={() => setPickerOpen(false)}
					onSelect={(item) => {
						setFeaturedId(item.id);
						setFeaturedUrl(item.url ?? null);
						setPickerOpen(false);
					}}
				/>
			)}
		</form>
	);
}

function VisibilityOption({
	label,
	value,
	current,
	onChange,
	disabled = false,
}: {
	label: string;
	value: Visibility;
	current: Visibility;
	onChange: (v: Visibility) => void;
	disabled?: boolean;
}) {
	return (
		<label className={`flex items-center gap-2 text-sm ${disabled ? "text-body/40" : ""}`}>
			<input
				type="radio"
				name="visibility"
				checked={current === value}
				disabled={disabled}
				onChange={() => onChange(value)}
			/>
			{label}
		</label>
	);
}
