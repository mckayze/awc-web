import type { ComponentType } from "react";
import {
	Type,
	Captions,
	Heading,
	List as ListIcon,
	Quote,
	Image as ImageIcon,
	Minus,
	Columns3,
	ExternalLink,
	Star,
	Camera,
	Table,
} from "lucide-react";
import type { Block, BlockType } from "@/lib/posts";

export type BlockMeta = {
	type: BlockType;
	label: string;
	description: string;
	icon: ComponentType<{ className?: string }>;
};

// The block types offered in the inserter / slash menu, in display order.
export const BLOCK_MENU: BlockMeta[] = [
	{ type: "paragraph", label: "Paragraph", description: "Plain text.", icon: Type },
	{ type: "subtext", label: "Subtext", description: "Small italic note.", icon: Captions },
	{ type: "heading", label: "Heading", description: "Section title.", icon: Heading },
	{ type: "list", label: "List", description: "Bulleted or numbered.", icon: ListIcon },
	{ type: "quote", label: "Quote", description: "Highlight a quotation.", icon: Quote },
	{ type: "image", label: "Image", description: "Upload or pick a file.", icon: ImageIcon },
	{
		type: "linkbutton",
		label: "Link button",
		description: "A button linking out to a product.",
		icon: ExternalLink,
	},
	{ type: "rating", label: "Rating", description: "A 0–5 star rating.", icon: Star },
	{
		type: "instagram",
		label: "Instagram",
		description: "Embed a post or reel.",
		icon: Camera,
	},
	{ type: "table", label: "Table", description: "Rows and columns of text.", icon: Table },
	{ type: "columns", label: "Columns", description: "A row of columns.", icon: Columns3 },
	{ type: "divider", label: "Divider", description: "A visual separator.", icon: Minus },
];

export const BLOCK_META = Object.fromEntries(BLOCK_MENU.map((m) => [m.type, m])) as Record<
	BlockType,
	BlockMeta
>;

// Block types that hold editable rich text (so they can be transformed between).
export const TEXT_TRANSFORMS: BlockType[] = ["paragraph", "subtext", "heading", "list", "quote"];

export function createBlock(type: BlockType): Block {
	const id = crypto.randomUUID();
	switch (type) {
		case "paragraph":
		case "subtext":
			return { id, type, data: { html: "" } };
		case "heading":
			return { id, type, data: { level: 2, html: "" } };
		case "quote":
			return { id, type, data: { html: "", cite: "" } };
		case "list":
			return { id, type, data: { ordered: false, items: [""] } };
		case "image":
			return { id, type, data: { mediaId: "", variant: "public", alt: "", caption: "" } };
		case "table":
			return {
				id,
				type,
				data: {
					header: true,
					rows: [
						["", ""],
						["", ""],
					],
				},
			};
		case "columns":
			return { id, type, data: { columns: [newColumn(), newColumn()] } };
		case "divider":
			return { id, type, data: {} };
		case "linkbutton":
			return { id, type, data: { url: "", label: "" } };
		case "rating":
			return { id, type, data: { value: 0 } };
		case "instagram":
			return { id, type, data: { url: "" } };
	}
}

export function newColumn() {
	return { id: crypto.randomUUID(), blocks: [] };
}

// Best-effort text carried across a type change.
function blockHtml(block: Block): string {
	switch (block.type) {
		case "paragraph":
		case "subtext":
		case "heading":
		case "quote":
			return block.data.html;
		case "list":
			return block.data.items.join("<br>");
		default:
			return "";
	}
}

export function transformBlock(block: Block, type: BlockType): Block {
	if (block.type === type) return block;
	const next = createBlock(type);
	next.id = block.id;
	const html = blockHtml(block);
	if (
		next.type === "paragraph" ||
		next.type === "subtext" ||
		next.type === "heading" ||
		next.type === "quote"
	) {
		next.data.html = html;
	} else if (next.type === "list") {
		next.data.items = html ? html.split(/<br\s*\/?>/i) : [""];
	}
	return next;
}
