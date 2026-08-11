"use client";

import { useState } from "react";
import { ShieldCheck, Sparkles, Users, BookOpen } from "lucide-react";

const pillars = [
	{
		icon: ShieldCheck,
		title: "Honest Reviews",
		overview: "No gifted bias, no fluff.",
		detail:
			"Every product reviewed on AWC is tested — worn, and lived in over time before a word gets written. We do accept payment for coverage, and gifted products are always disclosed. We will tell you what actually works, and save you from wasting money on what doesn't. If something underperforms, we say so. That commitment to honesty is what keeps readers coming back.",
	},
	{
		icon: Sparkles,
		title: "Beauty Obsessed",
		overview: "Over a decade inside the beauty world.",
		detail:
			"This isn't a side project — it's a decade-long obsession. From testing fifty foundations to find the right one for every undertone, to tracking down indie skincare brands before they blow up, the depth of knowledge here comes from genuine passion. We cover drugstore and luxury without bias, because great beauty isn't defined by price point.",
	},
	{
		icon: Users,
		title: "Community First",
		overview: "Built around real people, not algorithms.",
		detail:
			"The AWC community shapes what gets covered. Reader questions drive articles, product requests get taken seriously, and feedback actually changes things. This isn't a broadcast — it's a conversation. Every comment read, every email answered. The site exists because of the people who read it, and that's never forgotten.",
	},
	{
		icon: BookOpen,
		title: "Always Learning",
		overview: "Ingredients, science, and what's next.",
		detail:
			"The beauty industry moves fast — new actives, reformulations, evolving research on what your skin actually needs. Staying current means reading the studies, talking to the chemists, and being willing to change recommendations when the evidence changes. There are no sacred cows here. If something better comes along, we'll tell you about it.",
	},
];

export function PillarsSection() {
	const [active, setActive] = useState(0);

	return (
		<div className="flex flex-col gap-8">
			{/* Boxes */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				{pillars.map((pillar, i) => (
					<div
						key={pillar.title}
						onClick={() => setActive(i)}
						className={`flex flex-col gap-3 p-6 cursor-pointer transition-colors ${
							active === i ? "bg-brand/50" : "bg-nav"
						}`}
					>
						<pillar.icon size={24} className="text-black" />
						<span className="text-lg font-bold text-black">
							0{i + 1} {pillar.title}
						</span>
						<span className={`text-sm ${active === i ? "text-black/70" : "text-body"}`}>
							{pillar.overview}
						</span>
					</div>
				))}
			</div>

			{/* Detail text */}
			<p
				key={active}
				className="animate-fade-in text-3xl md:text-4xl text-body font-medium leading-relaxed"
			>
				{pillars[active].detail.split("AWC").map((part, i, arr) =>
					i < arr.length - 1 ? (
						<span key={i}>
							{part}
							<span className="text-rose-400/50">AWC</span>
						</span>
					) : (
						<span key={i}>{part}</span>
					),
				)}
			</p>
		</div>
	);
}
