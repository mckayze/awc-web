import type { ComponentType } from "react";
import { Image as ImageIcon, Film, Music, FileText } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export type MediaKind = "image" | "video" | "audio" | "document";

export type MediaItem = {
	id: string;
	// The storage id at the provider (Cloudflare image UUID).
	externalId: string;
	// Human-readable label shown to users; not unique.
	internalName: string;
	// The unique string the file is stored/uploaded as (filename).
	canonicalName: string;
	kind: MediaKind;
	size: number; // bytes
	width?: number;
	height?: number;
	uploadedAt: string; // ISO
	uploadedBy: string;
	url?: string; // real object URL for uploads; undefined → icon placeholder
	alt?: string;
	caption?: string;
};

export const KIND_ICON: Record<MediaKind, ComponentType<{ className?: string }>> = {
	image: ImageIcon,
	video: Film,
	audio: Music,
	document: FileText,
};

export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	const units = ["KB", "MB", "GB"];
	let value = bytes / 1024;
	let i = 0;
	while (value >= 1024 && i < units.length - 1) {
		value /= 1024;
		i++;
	}
	return `${value.toFixed(value < 10 ? 1 : 0)} ${units[i]}`;
}

export function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

export function kindFromMime(mime: string): MediaKind {
	if (mime.startsWith("image/")) return "image";
	if (mime.startsWith("video/")) return "video";
	if (mime.startsWith("audio/")) return "audio";
	return "document";
}

// ── Backend wiring ─────────────────────────────────────────────────
// Images live in Cloudflare Images; this table holds one row per file with
// the Cloudflare image id in external_id. Delivery URLs are built from the
// (public, non-secret) account hash + a named variant defined in the CF
// dashboard. Keep "flexible variants" OFF so only named variants resolve.

const CF_HASH = process.env.NEXT_PUBLIC_CF_IMAGES_HASH;

export function cfImageUrl(externalId: string, variant = "public"): string {
	return `https://imagedelivery.net/${CF_HASH}/${externalId}/${variant}`;
}

type MediaRow = {
	id: string;
	internal_name: string;
	canonical_name: string;
	external_id: string;
	mime_type: string;
	size: number | null;
	width: number | null;
	height: number | null;
	alt: string | null;
	caption: string | null;
	created_at: string;
	profiles: { full_name: string | null; username: string | null } | null;
};

function mapRow(r: MediaRow): MediaItem {
	const kind = kindFromMime(r.mime_type);
	return {
		id: r.id,
		externalId: r.external_id,
		internalName: r.internal_name,
		canonicalName: r.canonical_name,
		kind,
		size: Number(r.size ?? 0),
		width: r.width ?? undefined,
		height: r.height ?? undefined,
		uploadedAt: r.created_at,
		uploadedBy: r.profiles?.full_name ?? r.profiles?.username ?? "Unknown",
		url: kind === "image" ? cfImageUrl(r.external_id) : undefined,
		alt: r.alt ?? undefined,
		caption: r.caption ?? undefined,
	};
}

const ROW_SELECT = "*, profiles(full_name, username)";

export async function listMedia(): Promise<MediaItem[]> {
	const { data, error } = await supabaseBrowser()
		.from("media")
		.select(ROW_SELECT)
		.order("created_at", { ascending: false });
	if (error) throw new Error(error.message);
	return ((data as MediaRow[]) ?? []).map(mapRow);
}

// Fetches a single media item — used to edit an image already placed in a post,
// where only its id is stored.
export async function getMedia(id: string): Promise<MediaItem> {
	const { data, error } = await supabaseBrowser().from("media").select(ROW_SELECT).eq("id", id).single();
	if (error) throw new Error(error.message);
	return mapRow(data as MediaRow);
}

// Reads natural dimensions client-side so we can store them with the row.
function readImageSize(file: File): Promise<{ width?: number; height?: number }> {
	return new Promise((resolve) => {
		const img = new window.Image();
		const objectUrl = URL.createObjectURL(file);
		img.onload = () => {
			resolve({ width: img.naturalWidth, height: img.naturalHeight });
			URL.revokeObjectURL(objectUrl);
		};
		img.onerror = () => {
			resolve({});
			URL.revokeObjectURL(objectUrl);
		};
		img.src = objectUrl;
	});
}

// Surfaces the edge function's own { error } string on non-2xx.
async function invokeFn<T>(name: string, body: Record<string, unknown>): Promise<T> {
	const { data, error } = await supabaseBrowser().functions.invoke(name, { body });
	if (error) {
		let message = error.message;
		const res = (error as { context?: Response }).context;
		if (res && typeof res.json === "function") {
			try {
				// `res.json()` is typed as `{}` here (workerd's Response, not the
				// DOM's `any`), so the shape has to be asserted.
				const parsed = (await res.json()) as { error?: string };
				if (parsed?.error) message = parsed.error;
			} catch {
				// keep the generic message
			}
		}
		throw new Error(message);
	}
	return data as T;
}

// Full image upload: mint a one-time CF upload URL, push the bytes straight to
// Cloudflare (never through Supabase), then record the metadata row.
export async function uploadImage(file: File): Promise<MediaItem> {
	const { width, height } = await readImageSize(file);

	const { id, uploadURL } = await invokeFn<{ id: string; uploadURL: string }>("media-upload-url", {});

	const form = new FormData();
	form.append("file", file);
	const res = await fetch(uploadURL, { method: "POST", body: form });
	if (!res.ok) throw new Error("Upload to Cloudflare failed");

	const { data, error } = await supabaseBrowser()
		.from("media")
		.insert({
			internal_name: file.name.replace(/\.[^.]+$/, ""),
			canonical_name: file.name,
			external_id: id,
			mime_type: file.type,
			size: file.size,
			width,
			height,
		})
		.select(ROW_SELECT)
		.single();
	if (error) throw new Error(error.message);
	return mapRow(data as MediaRow);
}

// Persists editable metadata. Canonical name is intentionally excluded — it's
// the storage identity and can't be renamed without moving the object.
export async function updateMedia(
	id: string,
	fields: { internalName?: string; alt?: string; caption?: string },
): Promise<MediaItem> {
	const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
	if (fields.internalName !== undefined) patch.internal_name = fields.internalName;
	if (fields.alt !== undefined) patch.alt = fields.alt || null;
	if (fields.caption !== undefined) patch.caption = fields.caption || null;

	const { data, error } = await supabaseBrowser()
		.from("media")
		.update(patch)
		.eq("id", id)
		.select(ROW_SELECT)
		.single();
	if (error) throw new Error(error.message);
	return mapRow(data as MediaRow);
}

// Deletes both the Cloudflare image(s) and the Supabase rows, server-side.
export async function deleteMedia(ids: string[]): Promise<void> {
	await invokeFn<{ ok: true }>("media-delete", { ids });
}
