import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Next 16 renamed this convention to `proxy`, but we deliberately stay on the
// deprecated `middleware` name: `proxy` is hardcoded to the Node.js runtime
// (its `runtime` config option throws), and OpenNext/workerd only supports edge
// middleware, so a proxy.ts fails the build outright. `middleware.ts` still
// compiles to edge in 16. Revisit when OpenNext supports Node middleware —
// https://github.com/opennextjs/opennextjs-cloudflare/issues/962
//
// Two jobs, both scoped to /admin/* by the matcher below:
//  1. Refresh the Supabase session and write the rotated cookies back, so a
//     signed-in editor never gets logged out mid-session.
//  2. Bounce unauthenticated requests to the login screen before any admin
//     page renders.
//
// Next's guidance is to keep proxy checks optimistic and cheap. `getUser()` is
// a call to Supabase Auth, which is why the matcher is narrow — it never runs
// on public pages. The real gate is `(app)/layout.tsx` re-verifying server-side,
// with RLS behind that.

const LOGIN_PATH = "/admin/login";
const ADMIN_HOME = "/admin";

export async function middleware(request: NextRequest) {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
	const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

	let response = NextResponse.next({ request });

	const supabase = createServerClient(url, key, {
		cookies: {
			getAll: () => request.cookies.getAll(),
			setAll: (cookiesToSet) => {
				// Rebuild the response so refreshed cookies reach both the route
				// handler (via request) and the browser (via response).
				for (const { name, value } of cookiesToSet) {
					request.cookies.set(name, value);
				}
				response = NextResponse.next({ request });
				for (const { name, value, options } of cookiesToSet) {
					response.cookies.set(name, value, options);
				}
			},
		},
	});

	const {
		data: { user },
	} = await supabase.auth.getUser();

	const { pathname } = request.nextUrl;
	const isLoginRoute = pathname === LOGIN_PATH;

	if (!user && !isLoginRoute) {
		return redirectPreservingCookies(request, LOGIN_PATH, response);
	}

	if (user && isLoginRoute) {
		return redirectPreservingCookies(request, ADMIN_HOME, response);
	}

	return response;
}

// A fresh NextResponse.redirect drops anything `setAll` wrote, so carry the
// refreshed session cookies across manually.
function redirectPreservingCookies(request: NextRequest, path: string, from: NextResponse) {
	const target = request.nextUrl.clone();
	target.pathname = path;
	target.search = "";

	const redirect = NextResponse.redirect(target);
	for (const cookie of from.cookies.getAll()) {
		redirect.cookies.set(cookie);
	}
	return redirect;
}

export const config = {
	matcher: ["/admin/:path*"],
};
