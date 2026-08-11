import { notFound } from "next/navigation";

// Unmatched URLs anywhere on the public site. Without this they'd fall back to
// the *root* `app/not-found.tsx`, which sits outside the `(public)` group and
// so renders without the navbar, footer and cookie banner. Claiming them here
// and throwing routes them to `(public)/not-found.tsx` inside the layout, with
// a real 404 status.
//
// `(admin)/admin/(app)/[...notFound]` does the same for /admin, and wins for
// those paths — a catch-all under a static `admin` segment is more specific.
export default function PublicCatchAll() {
	notFound();
}
