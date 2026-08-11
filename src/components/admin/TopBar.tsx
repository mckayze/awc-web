"use client";

import { usePathname } from "next/navigation";
import { Heading } from "@/components/ui/Heading";
import { routeTitle } from "./routeTitles";

export function TopBar() {
	const pathname = usePathname();

	return (
		<header className="border-border bg-background sticky top-0 z-10 flex h-[4.5rem] shrink-0 items-center border-b px-8">
			<Heading as="h1" variant="h3">
				{routeTitle(pathname)}
			</Heading>
		</header>
	);
}
