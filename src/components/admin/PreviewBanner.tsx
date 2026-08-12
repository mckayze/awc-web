import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";
import type { PostState } from "@/lib/posts";

const STATE_LABEL: Record<PostState, string> = {
	draft: "Draft — not visible to the public",
	scheduled: "Scheduled — not visible to the public yet",
	published: "Published — this is live on the site",
};

// Pinned to the bottom rather than the top: the public Navbar is fixed and
// owns the top of the viewport, so a banner up there would sit under it.
export function PreviewBanner({ state, backHref }: { state: PostState; backHref: string }) {
	return (
		<div className="fixed inset-x-0 bottom-0 z-50 border-t border-body bg-body text-background">
			<div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 text-sm">
				<Eye className="h-4 w-4 shrink-0" aria-hidden="true" />
				<span className="flex-1 truncate">{STATE_LABEL[state]}</span>
				<Link
					href={backHref}
					className="inline-flex shrink-0 items-center gap-1 font-medium underline underline-offset-4"
				>
					<ArrowLeft className="h-4 w-4" aria-hidden="true" />
					Back to editor
				</Link>
			</div>
		</div>
	);
}
