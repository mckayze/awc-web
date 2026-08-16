// Uploads a single remote image (by URL) through the same path the admin
// media picker uses: mint a Cloudflare direct-upload URL via the
// `media-upload-url` edge function, POST the bytes there, then record the
// file in the `media` table. Every step reports which step failed and why,
// so a failure never has to be guessed at from a stack trace.

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(label, fn, attempts = 3, baseDelayMs = 600) {
	let lastError;
	for (let i = 0; i < attempts; i++) {
		const { ok, retryable, result, error } = await fn();
		if (ok) return { ok: true, result };
		lastError = error;
		if (!retryable || i === attempts - 1) return { ok: false, error };
		await sleep(baseDelayMs * 2 ** i);
	}
	return { ok: false, error: lastError };
}

export async function uploadImageFromUrl(supabase, { src, alt, caption, width, height }) {
	// 1. Download the original bytes from the old site.
	const fetched = await withRetry("fetch", async () => {
		try {
			const res = await fetch(src, {
				headers: { "User-Agent": "Mozilla/5.0 (compatible; AWC-Import/1.0)" },
			});
			if (!res.ok) return { ok: false, retryable: res.status >= 500, error: `HTTP ${res.status}` };
			return { ok: true, result: res };
		} catch (e) {
			return { ok: false, retryable: true, error: e.message };
		}
	});
	if (!fetched.ok) return { error: fetched.error, step: "fetch" };

	const res = fetched.result;
	const buf = Buffer.from(await res.arrayBuffer());
	const mimeType = res.headers.get("content-type") || guessMime(src);
	const filename = decodeURIComponent(src.split("/").pop()?.split(/[?#]/)[0] || "image.jpg");

	// 2. Ask the edge function for a one-time Cloudflare upload URL.
	const minted = await withRetry("mint", async () => {
		const { data, error } = await supabase.functions.invoke("media-upload-url", { body: {} });
		if (error) {
			const status = error?.context?.status;
			return { ok: false, retryable: status === 429 || status >= 500, error: error.message };
		}
		return { ok: true, result: data };
	});
	if (!minted.ok) return { error: minted.error, step: "cf-upload-url" };
	const { id: externalId, uploadURL } = minted.result;

	// 3. Push the bytes to Cloudflare.
	const uploaded = await withRetry("cf-upload", async () => {
		try {
			const form = new FormData();
			form.append("file", new Blob([buf], { type: mimeType }), filename);
			const uploadRes = await fetch(uploadURL, { method: "POST", body: form });
			if (!uploadRes.ok) {
				return { ok: false, retryable: uploadRes.status === 429 || uploadRes.status >= 500, error: `HTTP ${uploadRes.status}` };
			}
			return { ok: true, result: true };
		} catch (e) {
			return { ok: false, retryable: true, error: e.message };
		}
	});
	if (!uploaded.ok) return { error: uploaded.error, step: "cf-upload" };

	// 4. Record it in the media table.
	const { data: mediaRow, error: insertError } = await supabase
		.from("media")
		.insert({
			internal_name: filename.replace(/\.[^.]+$/, ""),
			canonical_name: filename,
			external_id: externalId,
			mime_type: mimeType,
			size: buf.length,
			width: width || null,
			height: height || null,
			alt: alt || null,
			caption: caption || null,
		})
		.select("id")
		.single();
	if (insertError) return { error: insertError.message, step: "media-insert" };

	return { mediaId: mediaRow.id };
}

function guessMime(url) {
	const ext = url.split(".").pop()?.split(/[?#]/)[0]?.toLowerCase();
	return (
		{
			jpg: "image/jpeg",
			jpeg: "image/jpeg",
			png: "image/png",
			gif: "image/gif",
			webp: "image/webp",
			svg: "image/svg+xml",
		}[ext] || "application/octet-stream"
	);
}
