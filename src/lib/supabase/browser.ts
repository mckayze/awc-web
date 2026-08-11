import { createBrowserClient } from "@supabase/ssr";

// Admin's browser-side Supabase client. Unlike the public site's read-only
// client, this one carries a session — @supabase/ssr stores it in cookies
// rather than localStorage so the server (proxy + server components) can
// read it too.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
	throw new Error(
		"Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Check your .env.local",
	);
}

// Wrapped so `ReturnType` resolves to a concrete client — taken off the
// generic `createBrowserClient` directly it collapses to `any`.
function create() {
	return createBrowserClient(url!, key!);
}

// One instance per tab — a second client would mean a second auth listener
// and duplicated token refreshes.
let client: ReturnType<typeof create> | undefined;

export function supabaseBrowser() {
	client ??= create();
	return client;
}
