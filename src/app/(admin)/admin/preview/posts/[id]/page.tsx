import { notFound, redirect } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { PostArticle } from "@/components/public/PostArticle";
import { PreviewBanner } from "@/components/admin/PreviewBanner";
import { getPostPreviewById } from "@/lib/preview/posts";
import { supabaseServer } from "@/lib/supabase/server";

// Draft preview. Lives under /admin deliberately, for two reasons:
//
//  1. The proxy matcher already covers /admin/:path*, so anonymous requests are
//     bounced to login before this renders, and `(admin)/layout.tsx` marks the
//     whole subtree noindex.
//  2. /blog/[slug] is ISR-cached in R2. Reading cookies there — which any auth
//     check or `draftMode()` requires — would opt the live route out of static
//     rendering entirely and throw that cache away. Keeping preview on a
//     separate, always-dynamic route means drafts can never reach the cache.
//
// Sits outside the (app) group so it gets the public chrome instead of the
// admin sidebar; that also means the group layout's auth check doesn't apply
// here, hence the explicit getUser() below.

export const dynamic = "force-dynamic";

export default async function PostPreviewPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;

	// The proxy already bounced anonymous requests; this re-verifies against
	// Supabase Auth so a forged cookie can't get this far, same as (app) does.
	const supabase = await supabaseServer();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) redirect("/admin/login");

	const preview = await getPostPreviewById(id);
	if (!preview) notFound();

	return (
		<PublicShell>
			{/* Clears the fixed banner so it never covers the footer. */}
			<div className="pb-16">
				<PostArticle post={preview.post} />
			</div>
			<PreviewBanner state={preview.state} backHref={`/admin/posts/${id}/edit`} />
		</PublicShell>
	);
}
