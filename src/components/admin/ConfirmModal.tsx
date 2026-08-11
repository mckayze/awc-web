"use client";

import { useEffect } from "react";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";

type ConfirmModalProps = {
	title: string;
	message: string;
	confirmLabel?: string;
	cancelLabel?: string;
	destructive?: boolean;
	busy?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
};

// Reusable confirmation dialog. Mount it conditionally — it renders a scrim +
// centered card and traps Escape to cancel.
export function ConfirmModal({
	title,
	message,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	destructive = false,
	busy = false,
	onConfirm,
	onCancel,
}: ConfirmModalProps) {
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
						{title}
					</Heading>
					<Text variant="caption" className="text-body/70 mt-2">
						{message}
					</Text>
				</div>
				<div className="border-border flex justify-end gap-2 border-t px-5 py-4">
					<Button
						type="button"
						variant="outline"
						className="min-h-9 px-4 text-sm"
						onClick={onCancel}
						disabled={busy}
					>
						{cancelLabel}
					</Button>
					<Button
						type="button"
						variant="dark"
						className={`min-h-9 px-4 text-sm ${destructive ? "border-red-600 bg-red-600" : ""}`}
						onClick={onConfirm}
						disabled={busy}
					>
						{busy ? "Working…" : confirmLabel}
					</Button>
				</div>
			</div>
		</div>
	);
}
