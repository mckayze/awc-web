import Link from "next/link";

type CategoryCardProps = {
	label: string;
	href: string;
};

export function CategoryCard({ label, href }: CategoryCardProps) {
	return (
		<Link
			href={href}
			className="flex flex-col rounded-base overflow-hidden cursor-pointer shrink-0 border border-border"
			style={{ width: "275px", height: "350px" }}
		>
			{/* Image */}
			<div className="flex-1 bg-nav" />

			{/* Label */}
			<div className="py-4 text-center bg-white">
				<span className="text-base font-medium text-body">{label}</span>
			</div>
		</Link>
	);
}
