import Link from "next/link";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";

// Renders inside the admin shell (sidebar + topbar), unlike the public
// `app/not-found.tsx`. Reached via the `[...notFound]` catch-all below, which
// is what stands in for react-router's `path: '*'` — a nested not-found.tsx
// only fires for `notFound()` thrown within its own subtree.
export default function AdminNotFound() {
	return (
		<section className="animate-fade-in text-center">
			<Heading as="h1" variant="h1">
				404
			</Heading>
			<Text variant="lead" className="text-body/70 mt-2">
				This page could not be found.
			</Text>
			{/* The SPA sent this to `/`, which was the dashboard; it's `/admin` now. */}
			<Link href="/admin" className="mt-4 inline-block underline">
				Go home
			</Link>
		</section>
	);
}
