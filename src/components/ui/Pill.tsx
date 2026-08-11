type PillProps = {
	label: string;
	color?: string;
};

export function Pill({ label, color }: PillProps) {
	const bg = color ?? "bg-brand";
	return (
		<span
			className={`inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm font-medium text-black/70 border border-border ${bg}`}
		>
			{label}
		</span>
	);
}
