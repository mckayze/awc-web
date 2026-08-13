import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Section } from "@/components/public/Section";
import { Container } from "@/components/public/Container";
import { PostBody } from "@/components/public/PostBody";
import { PROSE_WIDTH } from "@/lib/layout";
import { getPageBySlug } from "@/lib/public/pages";

// Shared renderer for the legal/site pages (Cookie Policy, Privacy Policy,
// Terms of Use). Fetches the published page by slug and renders its block
// content; `children` is appended below the body (e.g. the cookie page's
// "Manage cookies" button).
export async function PolicyArticle({ slug, children }: { slug: string; children?: ReactNode }) {
	const page = await getPageBySlug(slug);
	if (!page) notFound();

	return (
		<Section>
			<Container>
				<div className={`${PROSE_WIDTH} mx-auto w-full flex flex-col gap-8`}>
					<div className="flex flex-col gap-3">
						<h1 className="text-4xl md:text-5xl font-bold text-black leading-tight">
							{page.title}
						</h1>
						{page.updatedAt && (
							<p className="text-sm text-body/60">Last updated {formatDate(page.updatedAt)}</p>
						)}
					</div>

					<PostBody content={page.content} mediaUrls={page.mediaUrls} />

					{children}
				</div>
			</Container>
		</Section>
	);
}

function ordinal(day: number): string {
	if (day > 3 && day < 21) return "th";
	switch (day % 10) {
		case 1:
			return "st";
		case 2:
			return "nd";
		case 3:
			return "rd";
		default:
			return "th";
	}
}

function formatDate(iso: string | null): string {
	if (!iso) return "";
	const d = new Date(iso);
	const day = d.getDate();
	const month = d.toLocaleDateString("en-US", { month: "long" });
	return `${day}${ordinal(day)} ${month}, ${d.getFullYear()}`;
}
