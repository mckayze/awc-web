"use client";

import { useRef } from "react";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import type { Splide as SplideType } from "@splidejs/react-splide";
import "@splidejs/react-splide/css/core";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CategoryCard } from "./CategoryCard";

const categories = [
	"All",
	"Makeup",
	"Skincare",
	"Body Care",
	"Lifestyle",
	"Fragrance",
	"Hair Care",
	"Wellness",
	"Nail Care",
	"Tools & Brushes",
	"Sun Care",
	"Eye Care",
];

// Splide's left padding lines the first card up with Container's inner edge.
const EDGE_PADDING = "max(2rem, calc((100vw - 1400px) / 2 + 2rem))";

export function CategoryScroller() {
	const splideRef = useRef<SplideType>(null);

	return (
		<div>
			<Splide
				ref={splideRef}
				options={{
					type: "loop",
					autoWidth: true,
					gap: "0.75rem",
					arrows: false,
					pagination: false,
					padding: { left: EDGE_PADDING, right: "0" },
				}}
			>
				{categories.map((cat) => (
					<SplideSlide key={cat}>
						<CategoryCard label={cat} href="/" />
					</SplideSlide>
				))}
			</Splide>

			<div className="flex gap-3 mt-8" style={{ paddingLeft: EDGE_PADDING }}>
				<button
					onPointerDown={() => splideRef.current?.go("<")}
					className="flex items-center justify-center w-16 h-16 rounded-base bg-black cursor-pointer"
				>
					<ArrowLeft size={28} strokeWidth={2.5} color="white" />
				</button>
				<button
					onPointerDown={() => splideRef.current?.go(">")}
					className="flex items-center justify-center w-16 h-16 rounded-base bg-black cursor-pointer"
				>
					<ArrowRight size={28} strokeWidth={2.5} color="white" />
				</button>
			</div>
		</div>
	);
}
