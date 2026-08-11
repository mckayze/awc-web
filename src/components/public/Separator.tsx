import { twMerge } from "@/lib/twMerge";

type SeparatorProps = {
	className?: string;
};

export function Separator({ className = "" }: SeparatorProps) {
	return <div className={twMerge("my-14 border-b border-border", className)} />;
}
