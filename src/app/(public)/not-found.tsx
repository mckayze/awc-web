import Link from "next/link";
import { Home, ArrowRight } from "lucide-react";
import { Container } from "@/components/public/Container";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";

export const metadata = {
	title: "Page not found",
};

export default function NotFound() {
	return (
		<Container className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center md:py-32">
			<span className="font-title text-[7rem] font-bold leading-none text-brand-dark md:text-[11rem]">
				404
			</span>

			<Heading as="h1" variant="h2" className="mt-4">
				This page wandered off
			</Heading>

			<Text variant="lead" className="mt-4 max-w-xl text-body/70">
				We couldn&apos;t find the page you were looking for. It may have been moved, renamed, or
				never existed in the first place.
			</Text>

			<div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
				<Link
					href="/"
					className="inline-flex min-h-11 items-center justify-center gap-2 rounded-base border border-body bg-body px-6 text-base font-bold text-white transition-all hover:opacity-80"
				>
					<Home className="h-4 w-4" aria-hidden="true" />
					Back to home
				</Link>
				<Link
					href="/blog"
					className="inline-flex min-h-11 items-center justify-center gap-2 rounded-base border border-body bg-brand px-6 text-base font-medium text-body transition-all hover:opacity-80"
				>
					Read the blog
					<ArrowRight className="h-4 w-4" aria-hidden="true" />
				</Link>
			</div>
		</Container>
	);
}
