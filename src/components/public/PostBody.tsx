import { ExternalLink, Star, Tag } from "lucide-react";
import type { Block, PostContent } from "@/lib/content";
import { InstagramEmbed } from "@/components/public/InstagramEmbed";

// Renders a post's structured block content. Server component — the rich-text
// HTML produced by the admin editor is trusted (authored by staff) and injected
// via dangerouslySetInnerHTML. Styles mirror the site's existing prose look.

const INLINE =
	"[&_a]:underline [&_a]:underline-offset-2 [&_a]:text-black [&_strong]:font-semibold [&_em]:italic";

const HEADING_CLASS: Record<2 | 3 | 4, string> = {
	2: "text-4xl md:text-5xl mt-4",
	3: "text-2xl md:text-3xl opacity-90",
	4: "text-lg md:text-xl",
};

export function PostBody({
	content,
	mediaUrls,
}: {
	content: PostContent;
	mediaUrls: Record<string, string>;
}) {
	return (
		<div className="flex flex-col gap-6">
			{content.blocks.map((block) => (
				<BlockView key={block.id} block={block} mediaUrls={mediaUrls} />
			))}
		</div>
	);
}

function BlockView({
	block,
	mediaUrls,
	inColumn = false,
}: {
	block: Block;
	mediaUrls: Record<string, string>;
	inColumn?: boolean;
}) {
	switch (block.type) {
		case "paragraph": {
			if (!block.data.html.trim()) return null;
			return (
				<p
					className={`text-lg text-body leading-relaxed ${INLINE}`}
					dangerouslySetInnerHTML={{ __html: block.data.html }}
				/>
			);
		}
		case "subtext": {
			if (!block.data.html.trim()) return null;
			return (
				<div className="bg-nav px-4 py-3">
					<p
						className={`text-sm italic text-body/70 ${INLINE}`}
						dangerouslySetInnerHTML={{ __html: block.data.html }}
					/>
				</div>
			);
		}
		case "heading": {
			const Tag = `h${block.data.level}` as "h2" | "h3" | "h4";
			return (
				<Tag
					className={`${HEADING_CLASS[block.data.level]} font-bold text-black ${INLINE}`}
					dangerouslySetInnerHTML={{ __html: block.data.html }}
				/>
			);
		}
		case "quote": {
			return (
				<blockquote className="border-l-4 border-brand pl-6 py-2">
					<p
						className={`text-xl md:text-2xl font-medium text-black leading-snug ${INLINE}`}
						dangerouslySetInnerHTML={{ __html: block.data.html }}
					/>
				</blockquote>
			);
		}
		case "list": {
			const Tag = block.data.ordered ? "ol" : "ul";
			return (
				<Tag className="flex flex-col gap-3">
					{block.data.items.map((item, i) => (
						<li key={i} className={`flex items-start gap-3 text-lg text-body ${INLINE}`}>
							{block.data.ordered ? (
								<span className="text-body font-semibold shrink-0">{i + 1}.</span>
							) : (
								<span className="w-2 h-2 rounded-full bg-body shrink-0 mt-2.5" />
							)}
							<span dangerouslySetInnerHTML={{ __html: item }} />
						</li>
					))}
				</Tag>
			);
		}
		case "image": {
			const url = mediaUrls[block.data.mediaId];
			if (!url) return null;
			return (
				<figure className="flex flex-col gap-3">
					<div
						className={`bg-nav rounded-md w-full overflow-hidden ${inColumn ? "h-[360px]" : "aspect-[4/3]"}`}
					>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={url} alt={block.data.alt ?? ""} className="w-full h-full object-cover" />
					</div>
					{block.data.caption && (
						<figcaption className="text-sm text-body/60 text-center">
							{block.data.caption}
						</figcaption>
					)}
				</figure>
			);
		}
		case "rating": {
			return (
				<div
					className="bg-nav flex flex-col items-center gap-3 border border-body/15 px-4 py-8"
					aria-label={`Rated ${block.data.value} out of 5`}
				>
					<span className="text-xl font-bold text-body">
						My Rating: {block.data.value} Star{block.data.value === 1 ? "" : "s"}
					</span>
					<div className="flex items-center gap-2">
						{[1, 2, 3, 4, 5].map((star) => {
							const fill = Math.max(0, Math.min(1, block.data.value - (star - 1)));
							return (
								<span key={star} className="relative inline-block h-7 w-7" aria-hidden="true">
									<Star className="h-7 w-7 fill-body/15 text-transparent" />
									{fill > 0 && (
										<span
											className="absolute inset-0 overflow-hidden"
											style={{ width: `${fill * 100}%` }}
										>
											<Star className="h-7 w-7 fill-brand-dark text-brand-dark" />
										</span>
									)}
								</span>
							);
						})}
					</div>
				</div>
			);
		}
		case "instagram": {
			if (!block.data.url) return null;
			return <InstagramEmbed url={block.data.url} />;
		}
		case "divider": {
			return <hr className="border-border" />;
		}
		case "linkbutton": {
			if (!block.data.url) return null;
			return (
				<a
					href={block.data.url}
					target="_blank"
					rel="noopener noreferrer"
					className="flex w-full items-center gap-3 border border-body bg-brand px-5 py-3 font-medium text-body no-underline transition-opacity hover:opacity-80"
				>
					<Tag className="h-5 w-5 shrink-0" aria-hidden="true" />
					<span className="flex-1 truncate">{block.data.label || block.data.url}</span>
					<ExternalLink className="h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />
				</a>
			);
		}
		case "table": {
			const { header, rows, align } = block.data;
			if (rows.length === 0 || rows.every((row) => row.every((cell) => !cell.trim()))) {
				return null;
			}
			const head = header ? rows[0] : null;
			const body = header ? rows.slice(1) : rows;
			const cols = rows[0]?.length ?? 0;
			// Outer perimeter gets no border of its own — the rounded wrapper's
			// border is what shows there. Cells only draw the inner grid lines, so
			// corners stay a single clean stroke instead of a clipped square one.
			const edge = (isFirstRow: boolean, isLastRow: boolean, c: number) =>
				[
					"border-border",
					!isFirstRow && "border-t",
					!isLastRow && "border-b",
					c > 0 && "border-l",
					c < cols - 1 && "border-r",
				]
					.filter(Boolean)
					.join(" ");
			const alignClass = (c: number) => {
				const a = align?.[c] ?? "left";
				return a === "center" ? "text-center" : a === "right" ? "text-right" : "";
			};
			return (
				<div className="overflow-hidden rounded-md border border-border">
					<div className="overflow-x-auto">
						<table className="w-full border-collapse text-left">
							{head && (
								<thead>
									<tr>
										{head.map((cell, i) => (
											<th
												key={i}
												className={`${edge(true, body.length === 0, i)} ${alignClass(i)} bg-brand px-4 py-3 text-base font-semibold text-black align-top ${INLINE}`}
												dangerouslySetInnerHTML={{ __html: cell }}
											/>
										))}
									</tr>
								</thead>
							)}
							<tbody>
								{body.map((row, r) => (
									<tr key={r}>
										{row.map((cell, c) => (
											<td
												key={c}
												className={`${edge(!header && r === 0, r === body.length - 1, c)} ${alignClass(c)} px-4 py-3 text-base text-body align-top ${INLINE}`}
												dangerouslySetInnerHTML={{ __html: cell }}
											/>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			);
		}
		case "columns": {
			return (
				<div className="flex flex-col md:flex-row gap-4">
					{block.data.columns.map((col) => (
						<div key={col.id} className="flex-1 min-w-0 flex flex-col gap-6">
							{col.blocks.map((b) => (
								<BlockView key={b.id} block={b} mediaUrls={mediaUrls} inColumn />
							))}
						</div>
					))}
				</div>
			);
		}
	}
}
