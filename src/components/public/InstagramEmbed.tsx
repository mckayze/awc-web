"use client";

import { useEffect } from "react";

// Renders an Instagram post/reel via the official embed.js widget — the same
// approach the legacy WordPress site used, so cards keep their native styling
// and auto-resize. We only store the post URL; embed.js fills in the card from
// the minimal blockquote below.

const EMBED_SRC = "https://www.instagram.com/embed.js";

// embed.js only hydrates the canonical permalink: the singular `/reel/` (not the
// `/reels/` form the app copies) and without tracking params. Normalise so any
// pasted post/reel link works.
function canonicalPermalink(url: string): string {
	const m = url.match(/instagram\.com\/(p|reels?|tv)\/([A-Za-z0-9_-]+)/);
	if (!m) return url;
	const type = m[1] === "reels" ? "reel" : m[1];
	return `https://www.instagram.com/${type}/${m[2]}/`;
}

declare global {
	interface Window {
		instgrm?: { Embeds: { process: () => void } };
	}
}

export function InstagramEmbed({ url }: { url: string }) {
	useEffect(() => {
		// Script already present (e.g. another embed, or a client navigation):
		// just re-scan the DOM for new blockquotes. Otherwise load it once — it
		// auto-processes any blockquotes on load.
		if (window.instgrm) {
			window.instgrm.Embeds.process();
			return;
		}
		if (document.querySelector(`script[src="${EMBED_SRC}"]`)) return;
		const script = document.createElement("script");
		script.src = EMBED_SRC;
		script.async = true;
		document.body.appendChild(script);
	}, [url]);

	// Center from a wrapper: embed.js rewrites the blockquote's own margins when
	// it hydrates, so centering the blockquote directly doesn't stick.
	return (
		<div className="flex justify-center">
			<blockquote
				className="instagram-media"
				data-instgrm-permalink={canonicalPermalink(url)}
				data-instgrm-version="14"
				style={{ margin: "0 auto", maxWidth: 540, width: "100%" }}
			/>
		</div>
	);
}
