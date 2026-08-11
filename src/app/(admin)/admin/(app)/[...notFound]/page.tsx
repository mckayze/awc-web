import { notFound } from "next/navigation";

// react-router's `path: '*'` inside the admin shell. Next only falls back to
// the root `app/not-found.tsx` for unmatched URLs, which would drop the admin
// chrome — so this catch-all claims everything under /admin and throws, which
// is what routes the response to the sibling `not-found.tsx` with a real 404.
export default function AdminCatchAll() {
	notFound();
}
