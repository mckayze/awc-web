import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server-side Supabase client for the admin route group. Reads the session
// from the request cookies, so server components can verify who is signed in
// instead of trusting the client.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
	throw new Error(
		"Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Check your .env.local",
	);
}

export async function supabaseServer() {
	const cookieStore = await cookies();

	return createServerClient(url!, key!, {
		cookies: {
			getAll: () => cookieStore.getAll(),
			setAll: (cookiesToSet) => {
				try {
					for (const { name, value, options } of cookiesToSet) {
						cookieStore.set(name, value, options);
					}
				} catch {
					// Server components can't set cookies. Harmless — the proxy
					// refreshes the session on every admin request, so the written
					// value would be redundant anyway.
				}
			},
		},
	});
}
