import { Text } from "@/components/ui/Text";

export default function Dashboard() {
	return (
		<section className="animate-fade-in">
			<Text variant="lead" className="text-body/70">
				Welcome back. Start building in{" "}
				<code className="bg-brand px-1 py-0.5">src/app/(admin)</code>.
			</Text>
		</section>
	);
}
