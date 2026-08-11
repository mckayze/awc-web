import type { Metadata } from "next";
import { Section } from "@/components/public/Section";
import { Container } from "@/components/public/Container";
import { SectionHeading } from "@/components/public/SectionHeading";
import { PartnersCarousel } from "@/components/public/PartnersCarousel";
import { Separator } from "@/components/public/Separator";
import { Button } from "@/components/ui/Button";
import { PillarsSection } from "./PillarsSection";

export const metadata: Metadata = {
	title: "About | A Woman's Confidence",
	description: "Find out more about us and get in touch with the team.",
};

const stats = [
	{ value: "10+", label: "Years running" },
	{ value: "430+", label: "Articles published" },
	{ value: "2,000+", label: "Products tested" },
	{ value: "30k", label: "Monthly readers" },
];

const story = [
	"AWC launched out of a simple frustration — beauty content that looked great but said nothing useful. Reviews driven by sponsorships, trends recycled without scrutiny, and readers left no better off than when they arrived.",
	"The idea was straightforward: build a publication that treats its readers as intelligent adults. One that tests products properly, engages with the science, and isn't afraid to be critical when something doesn't deliver.",
	"A decade on, AWC has grown into one of the most trusted independent voices in beauty — still editorially independent, still reader-first.",
];

export default function AboutPage() {
	return (
		<>
			<Section>
				<Container>
					<div>
						<h1 className="text-5xl md:text-7xl font-bold leading-tight">
							Find out more about us and get in touch with the team
						</h1>
					</div>

					<Separator />

					{/* Alternating image / paragraph rows. */}
					<div className="flex flex-col gap-12">
						{story.map((paragraph, i) => (
							<div
								key={i}
								className={`flex flex-col gap-12 lg:gap-24 ${
									i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
								}`}
							>
								<div className="w-full lg:w-2/5 aspect-[4/3] bg-nav rounded-base shrink-0" />
								<div className="lg:w-3/5 flex flex-col gap-6 justify-center">
									<div className="flex flex-col gap-4 text-3xl text-body leading-relaxed">
										<p>{paragraph}</p>
									</div>
								</div>
							</div>
						))}
					</div>
				</Container>
			</Section>

			<Section className="border-b border-border">
				<PartnersCarousel />
			</Section>

			<Section className="bg-brand border-b border-border">
				<Container className="text-center py-10">
					<h2 className="text-4xl md:text-6xl font-bold leading-tight mb-10">
						If you want to view a list of all the companies and brands that we&rsquo;ve worked with,
						click the button below.
					</h2>
					<Button variant="dark">View Companies</Button>
				</Container>
			</Section>

			<Section className="border-b border-border">
				<Container>
					<SectionHeading title="Our goals" />
					<PillarsSection />
				</Container>
			</Section>

			<Section className="bg-brand">
				<Container>
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
						{stats.map((stat) => (
							<div key={stat.label} className="flex flex-col gap-2 items-center text-center">
								<span className="text-5xl md:text-6xl font-bold text-black">{stat.value}</span>
								<span className="text-base text-body">{stat.label}</span>
							</div>
						))}
					</div>
				</Container>
			</Section>
		</>
	);
}
