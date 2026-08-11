export type Product = {
	brand: string;
	name: string;
	href: string;
};

export function ProductCard({ brand, name, href }: Product) {
	return (
		<div className="shrink-0" style={{ width: "200px" }}>
			<div className="w-full aspect-[3/4] bg-background rounded-base" />
			<div className="pt-3 flex flex-col gap-1">
				<span className="text-xs text-body/60 uppercase tracking-wide">{brand}</span>
				<span className="text-base font-medium text-black leading-snug">{name}</span>
				<a
					href={href}
					className="text-sm text-body hover:text-black underline underline-offset-2 mt-1 inline-block"
				>
					View
				</a>
			</div>
		</div>
	);
}
