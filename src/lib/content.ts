// ── Block content model ────────────────────────────────────────────
// The one definition of the content contract, shared by the admin editor
// (which writes it) and the public site (which renders it). It was duplicated
// across `admin/src/lib/posts.ts` and `frontend/lib/posts.ts` before the two
// apps merged; keeping two copies in one app would guarantee drift.
//
// Posts and pages store structured blocks, not HTML, so the site owns
// rendering. Rich text inside text blocks is TipTap HTML; internal links are
// serialised as <a data-post-id="…"> so the public side can resolve the live
// slug.

// A column inside a `columns` block — a nested list of blocks. The recursion
// (Block → PostColumn → Block) is what powers layout/grid blocks.
export type PostColumn = { id: string; blocks: Block[] };

export type Block =
	| { id: string; type: "paragraph"; data: { html: string } }
	| { id: string; type: "subtext"; data: { html: string } }
	| { id: string; type: "heading"; data: { level: 2 | 3 | 4; html: string } }
	| {
			id: string;
			type: "image";
			data: { mediaId: string; variant: string; alt?: string; caption?: string };
	  }
	| { id: string; type: "quote"; data: { html: string; cite?: string } }
	| { id: string; type: "list"; data: { ordered: boolean; items: string[] } }
	| { id: string; type: "divider"; data: Record<string, never> }
	| { id: string; type: "linkbutton"; data: { url: string; label: string } }
	| { id: string; type: "rating"; data: { value: number } }
	| { id: string; type: "instagram"; data: { url: string } }
	// Cells are inline TipTap HTML (like list items). Every row has the same
	// length; `header` marks the first row as a header row. `align` is per
	// column (indexed like a row), missing entries default to "left".
	| {
			id: string;
			type: "table";
			data: { header: boolean; rows: string[][]; align?: ("left" | "center" | "right")[] };
	  }
	| { id: string; type: "columns"; data: { columns: PostColumn[] } };

export type BlockType = Block["type"];

export type PostContent = { version: 1; blocks: Block[] };

export const EMPTY_CONTENT: PostContent = { version: 1, blocks: [] };
