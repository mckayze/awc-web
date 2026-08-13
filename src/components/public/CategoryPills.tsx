import Link from "next/link";

export function CategoryPills({ categories }: { categories: string[] }) {
	return (
		<div className="flex flex-wrap items-center gap-1">
			{categories.map((cat, i) => (
				<span key={cat} className="flex items-center gap-1">
					{i > 0 && <span className="text-black/40">-</span>}
					<Link
						href="/blog"
						className="text-xs sm:text-sm font-medium uppercase text-accent hover:underline"
					>
						{cat}
					</Link>
				</span>
			))}
		</div>
	);
}
