import { PublicShell } from "@/components/public/PublicShell";

export const revalidate = 60;

export default function PublicLayout({ children }: { children: React.ReactNode }) {
	return <PublicShell>{children}</PublicShell>;
}
