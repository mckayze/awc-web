"use client";

import Image from "next/image";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import { AutoScroll } from "@splidejs/splide-extension-auto-scroll";
import "@splidejs/react-splide/css/core";

const partners = [
	{ name: "Bali Body", src: "/bali-body-logo.png" },
	{ name: "The Body Shop", src: "/the-body-shop-logo.svg" },
	{ name: "Stylevana", src: "/stylevana-logo.png" },
	{ name: "Milani", src: "/milani-logo.png" },
];

const items = Array.from({ length: 6 }, () => partners).flat();

export function PartnersCarousel() {
	return (
		<div className="w-full select-none">
			<Splide
				options={{
					type: "loop",
					autoWidth: true,
					arrows: false,
					pagination: false,
					drag: false,
					autoScroll: {
						speed: 0.4,
						pauseOnHover: false,
					},
				}}
				extensions={{ AutoScroll }}
			>
				{items.map((partner, i) => (
					<SplideSlide key={i} className="flex items-center justify-center px-16">
						<Image
							src={partner.src}
							alt={partner.name}
							height={48}
							width={160}
							draggable={false}
							className="h-12 w-auto object-contain opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all"
						/>
					</SplideSlide>
				))}
			</Splide>
		</div>
	);
}
