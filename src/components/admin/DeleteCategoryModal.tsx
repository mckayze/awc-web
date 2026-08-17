"use client";

import { useEffect, useState } from "react";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import type { Category } from "@/lib/categories";

type DeleteCategoryModalProps = {
	postCount: number;
	otherCategories: Category[];
	busy: boolean;
	onMigrateAndDelete: (targetId: string) => void;
	onDeleteWithoutMigrating: () => void;
	onCancel: () => void;
};

// Shown instead of a plain confirm() when the category being deleted still has
// posts attached, so those posts can be moved to another category first
// rather than silently losing it.
export function DeleteCategoryModal({
	postCount,
	otherCategories,
	busy,
	onMigrateAndDelete,
	onDeleteWithoutMigrating,
	onCancel,
}: DeleteCategoryModalProps) {
	const [targetId, setTargetId] = useState("");

	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") onCancel();
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onCancel]);

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
			onClick={onCancel}
			role="dialog"
			aria-modal="true"
		>
			<div
				className="border-border bg-background animate-fade-in w-full max-w-sm border shadow-xl"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="px-5 py-4">
					<Heading as="h2" variant="h3">
						Delete category
					</Heading>
					<Text variant="caption" className="text-body/70 mt-2">
						{postCount} post{postCount === 1 ? "" : "s"} currently use this category. Move them to
						another category first, or delete anyway to remove it from those posts.
					</Text>

					{otherCategories.length > 0 && (
						<div className="mt-4 flex flex-col gap-1">
							<label className="text-caption font-medium text-body/70" htmlFor="migrate-target">
								Migrate posts to
							</label>
							<select
								id="migrate-target"
								className="border-border min-h-11 w-full rounded-md border bg-white px-3 text-base text-body focus:outline-none"
								value={targetId}
								onChange={(e) => setTargetId(e.target.value)}
								disabled={busy}
							>
								<option value="">Don't migrate…</option>
								{otherCategories.map((c) => (
									<option key={c.id} value={c.id}>
										{c.name}
									</option>
								))}
							</select>
						</div>
					)}
				</div>
				<div className="border-border flex flex-wrap justify-end gap-2 border-t px-5 py-4">
					<Button
						type="button"
						variant="outline"
						className="min-h-9 px-4 text-sm"
						onClick={onCancel}
						disabled={busy}
					>
						Cancel
					</Button>
					{!targetId && (
						<Button
							type="button"
							variant="dark"
							className="min-h-9 border-red-600 bg-red-600 px-4 text-sm"
							onClick={onDeleteWithoutMigrating}
							disabled={busy}
						>
							Delete without migrating
						</Button>
					)}
					{otherCategories.length > 0 && (
						<Button
							type="button"
							variant="dark"
							className="min-h-9 px-4 text-sm"
							onClick={() => targetId && onMigrateAndDelete(targetId)}
							disabled={busy || !targetId}
						>
							{busy ? "Working…" : "Migrate & delete"}
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
