export function Section({
	children,
	className = "",
	py = "py-10 md:py-24",
}: {
	children: React.ReactNode;
	className?: string;
	py?: string;
}) {
	return <section className={`w-full ${py} ${className}`}>{children}</section>;
}
