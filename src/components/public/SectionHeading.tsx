type SectionHeadingProps = {
	title: string;
	action?: React.ReactNode;
};

export function SectionHeading({ title, action }: SectionHeadingProps) {
	return (
		<div className="flex items-center justify-between mb-8">
			<h2 className="text-3xl md:text-4xl font-bold text-black font-title">{title}</h2>
			{action}
		</div>
	);
}
