"use client";

import { useState, useEffect } from "react";
import { Drawer } from "vaul";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";

type FilterDrawerProps = {
	open: boolean;
	onClose: () => void;
	categories: string[];
	selected: string[];
	onApply: (selected: string[]) => void;
};

type DrawerContentProps = {
	categories: string[];
	pending: string[];
	onToggle: (cat: string) => void;
	onApply: () => void;
	onClear: () => void;
	onClose: () => void;
};

function DrawerContent({
	categories,
	pending,
	onToggle,
	onApply,
	onClear,
	onClose,
}: DrawerContentProps) {
	return (
		<div className="flex flex-col h-full bg-white">
			<div className="flex items-center justify-between px-6 py-5 border-b border-black/10">
				<Drawer.Title className="text-lg font-bold text-black">Filter by category</Drawer.Title>
				<button
					onClick={onClose}
					className="text-body hover:text-black transition-colors cursor-pointer"
				>
					<X size={22} />
				</button>
			</div>

			<div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-1">
				{pending.length > 0 && (
					<div className="pb-3 mb-2 border-b border-black/5">
						<Button onClick={onClear} className="w-full">
							Clear all
						</Button>
					</div>
				)}
				{categories.map((cat) => {
					const checked = pending.includes(cat);
					return (
						<label
							key={cat}
							className="flex items-center gap-3 py-3 border-b border-black/5 last:border-0 cursor-pointer group"
						>
							<input
								type="checkbox"
								checked={checked}
								onChange={() => onToggle(cat)}
								className="w-4 h-4 accent-black cursor-pointer"
							/>
							<span
								className={`text-sm font-medium transition-colors ${checked ? "text-black" : "text-body group-hover:text-black"}`}
							>
								{cat}
							</span>
						</label>
					);
				})}
			</div>

			<div className="px-6 py-5 border-t border-black/10">
				<Button onClick={onApply} className="w-full">
					Apply
				</Button>
			</div>
		</div>
	);
}

export function FilterDrawer({ open, onClose, categories, selected, onApply }: FilterDrawerProps) {
	const [pending, setPending] = useState<string[]>(selected);
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const check = () => setIsMobile(window.innerWidth < 768);
		check();
		window.addEventListener("resize", check);
		return () => window.removeEventListener("resize", check);
	}, []);

	useEffect(() => {
		// Keyed on `open` alone, as in the Vite app: reseeding on every
		// `selected` change would discard in-progress ticks while it's open.
		if (open) setPending(selected);
	}, [open]);

	function toggle(cat: string) {
		setPending((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
	}

	function handleApply() {
		onApply(pending);
		onClose();
	}

	function handleClear() {
		setPending([]);
	}

	return (
		<Drawer.Root
			open={open}
			onOpenChange={(o) => {
				if (!o) onClose();
			}}
			direction={isMobile ? "bottom" : "right"}
		>
			<Drawer.Portal>
				<Drawer.Overlay className="fixed inset-0 z-50 bg-black/30" />
				<Drawer.Content
					aria-describedby={undefined}
					className={`fixed z-50 bg-white flex flex-col focus:outline-none
            ${
							isMobile
								? "bottom-0 left-0 right-0 max-h-[80vh] rounded-t-2xl"
								: "top-0 right-0 bottom-0 w-80"
						}`}
				>
					<DrawerContent
						categories={categories}
						pending={pending}
						onToggle={toggle}
						onApply={handleApply}
						onClear={handleClear}
						onClose={onClose}
					/>
				</Drawer.Content>
			</Drawer.Portal>
		</Drawer.Root>
	);
}
