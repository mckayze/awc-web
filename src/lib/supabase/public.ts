import { createClient } from "@supabase/supabase-js";

// Read-only public client for the marketing site. Uses the publishable (anon)
// key — only published content is exposed, via SECURITY DEFINER RPCs and RLS.
// No session is persisted; every read runs as the anonymous role.
//
// Deliberately *not* the `@supabase/ssr` client that `browser.ts`/`server.ts`
// use: those exist to carry an admin session in cookies, and this one has no
// session to carry. Public pages render on the server, so this module is
// imported from server components — it must stay free of browser globals.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
	throw new Error(
		"Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Check your .env.local",
	);
}

export const supabasePublic = createClient(url, key, {
	auth: { persistSession: false, autoRefreshToken: false },
});
