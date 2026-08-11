"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

type Category = {
	key: string;
	name: string;
	description: string;
	essential?: boolean;
};

const CATEGORIES: Category[] = [
	{
		key: "essential",
		name: "Essential",
		description:
			"Required for the website to function. These cannot be disabled as they are necessary for core features like security and accessibility.",
		essential: true,
	},
	{
		key: "analytics",
		name: "Analytics",
		description:
			"Help us understand how visitors interact with our site by collecting anonymous traffic data. This helps us improve our content and user experience.",
	},
	{
		key: "marketing",
		name: "Marketing",
		description:
			"Used to track visitors across websites to display relevant ads. These help support our content by showing advertising that may be of interest to you.",
	},
	{
		key: "functional",
		name: "Functional",
		description:
			"Allow the website to remember choices you make such as your language or region, providing a more personalised experience.",
	},
];

type Preferences = Record<string, boolean>;

type Props = {
	onSave: (prefs: Preferences) => void;
	onAcceptAll: () => void;
};

export function CookiePreferences({ onSave, onAcceptAll }: Props) {
	const initial: Preferences = Object.fromEntries(CATEGORIES.map((c) => [c.key, !!c.essential]));
	const [prefs, setPrefs] = useState(initial);

	function toggle(key: string) {
		setPrefs((p) => ({ ...p, [key]: !p[key] }));
	}

	return (
		<div className="max-w-[1400px] mx-auto bg-white border border-border shadow-lg rounded-base p-4 md:p-6 flex flex-col gap-4 md:gap-6 max-h-[80vh] overflow-y-auto">
			<p className="font-bold text-black text-xl md:text-2xl">Manage Preferences</p>
			<div className="flex flex-col divide-y divide-black/10">
				{CATEGORIES.map((cat) => (
					<div
						key={cat.key}
						className="flex items-start justify-between gap-4 md:gap-6 py-4 first:pt-0 last:pb-0"
					>
						<div className="flex-1">
							<p className="font-semibold text-black mb-1">{cat.name}</p>
							<p className="text-sm text-body/90">{cat.description}</p>
						</div>
						<button
							role="switch"
							aria-checked={prefs[cat.key]}
							disabled={cat.essential}
							onClick={() => !cat.essential && toggle(cat.key)}
							className={`relative shrink-0 mt-1 w-11 h-6 rounded-full transition-colors focus:outline-none
								${prefs[cat.key] ? "bg-black" : "bg-black/20"}
								${cat.essential ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
							`}
						>
							<span
								className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform
									${prefs[cat.key] ? "translate-x-5" : "translate-x-0"}
								`}
							/>
						</button>
					</div>
				))}
			</div>
			<div className="flex flex-col md:flex-row gap-3">
				<Button onClick={onAcceptAll}>Accept All</Button>
				<Button variant="outline" onClick={() => onSave(prefs)}>
					Save Preferences
				</Button>
			</div>
		</div>
	);
}
