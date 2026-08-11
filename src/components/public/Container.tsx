export function Container({
	children,
	className = "",
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return <div className={`w-full max-w-[1400px] mx-auto px-4 sm:px-8 ${className}`}>{children}</div>;
}
