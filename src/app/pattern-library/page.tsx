import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { Input } from "@/components/ui/Input";
import { Pill } from "@/components/ui/Pill";
import { Text } from "@/components/ui/Text";
import { Textarea } from "@/components/ui/Textarea";

export const metadata = {
	title: "Pattern library — AWC",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<section className="flex flex-col gap-4 border-t border-border pt-8">
			<Text variant="caption" className="uppercase tracking-widest text-body/50">
				{title}
			</Text>
			{children}
		</section>
	);
}

export default function PatternLibrary() {
	return (
		<main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-16">
			<div className="flex flex-col gap-2">
				<Heading as="h1" variant="h2">
					Pattern library
				</Heading>
				<Text variant="muted">Shared primitives from components/ui, used by both the site and the admin.</Text>
			</div>

			<Section title="Heading">
				<Heading as="h1" variant="display">
					Display
				</Heading>
				<Heading as="h1">Heading h1</Heading>
				<Heading as="h2">Heading h2</Heading>
				<Heading as="h3">Heading h3</Heading>
				<Heading as="h4">Heading h4 (falls back to the h3 scale)</Heading>
			</Section>

			<Section title="Text">
				<Text variant="lead">Lead — sits above body copy and carries the intro.</Text>
				<Text>Body — the default variant, using the sans stack.</Text>
				<Text variant="caption">Caption — small supporting copy.</Text>
				<Text variant="muted">Muted — body size at 60% opacity.</Text>
			</Section>

			<Section title="Pill">
				<div className="flex flex-wrap gap-2">
					<Pill label="makeup" />
					<Pill label="skincare" />
					<Pill label="lifestyle" />
					<Pill label="custom colour" color="bg-white" />
					<Pill label="brand dark" color="bg-brand-dark" />
				</div>
			</Section>

			<Section title="Button">
				<div className="flex flex-wrap items-center gap-3">
					<Button>Default</Button>
					<Button variant="dark">Dark</Button>
					<Button variant="outline">Outline</Button>
					<Button variant="text">Text</Button>
					<Button disabled>Disabled</Button>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<Button leftIcon={<span aria-hidden>←</span>}>Left icon</Button>
					<Button rightIcon={<span aria-hidden>→</span>}>Right icon</Button>
				</div>
			</Section>

			<Section title="Input">
				<Input id="email" label="Email" placeholder="you@example.com" />
				<Input id="bare" placeholder="No label" />
				<Input id="disabled-input" label="Disabled" placeholder="Unavailable" disabled />
			</Section>

			<Section title="Textarea">
				<Textarea id="message" label="Message" rows={4} placeholder="Say something" />
			</Section>

			<Section title="Tokens">
				<div className="flex flex-wrap gap-3">
					{[
						["bg-background", "background"],
						["bg-brand", "brand"],
						["bg-brand-dark", "brand-dark"],
						["bg-nav", "nav"],
						["bg-body", "body"],
					].map(([cls, name]) => (
						<div key={name} className="flex flex-col items-center gap-1">
							<div className={`size-16 border border-border ${cls}`} />
							<Text variant="caption">{name}</Text>
						</div>
					))}
				</div>
			</Section>
		</main>
	);
}
