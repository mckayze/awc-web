import { Text } from "@/components/ui/Text";

// The SPA's shared <Placeholder /> screen. Settings is the only route still
// using it (comments is deliberately unported), so it's inlined here rather
// than kept as a component.
export default function Settings() {
	return (
		<section className="animate-fade-in">
			<Text variant="lead" className="text-body/70">
				This page is coming soon.
			</Text>
		</section>
	);
}
