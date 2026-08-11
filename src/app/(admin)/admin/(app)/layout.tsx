import { redirect } from "next/navigation";
import { PermissionsProvider } from "@/lib/permissions";
import { Sidebar } from "@/components/admin/Sidebar";
import { TopBar } from "@/components/admin/TopBar";
import { supabaseServer } from "@/lib/supabase/server";

// The signed-in shell. A route group, so it adds no URL segment — the
// dashboard is still `/admin` — but it keeps the chrome off /admin/login.
//
// This replaces the SPA's <ProtectedRoute>, and does it properly: the check
// runs on the server before anything renders, rather than the client
// declining to draw a page it has already downloaded. The proxy has already
// bounced anonymous requests; `getUser()` here re-verifies against Supabase
// Auth so a forged cookie can't get this far.

export default async function AdminAppLayout({ children }: { children: React.ReactNode }) {
	const supabase = await supabaseServer();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) redirect("/admin/login");

	return (
		<PermissionsProvider>
			<div className="bg-background text-body flex min-h-screen font-sans">
				<Sidebar />
				<div className="flex min-w-0 flex-1 flex-col">
					<TopBar />
					<main className="flex-1 px-8 py-8">{children}</main>
				</div>
			</div>
		</PermissionsProvider>
	);
}
