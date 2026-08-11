"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/lib/permissions";
import { Button } from "@/components/ui/Button";
import {
	LayoutDashboard,
	FileText,
	Files,
	FolderTree,
	Image,
	MessageSquare,
	Users,
	Settings,
	LogOut,
} from "lucide-react";

// `perm` = exact permission needed to see the link; `anyOf` matches the
// `.own`/`.any` flavor of a base key. Items with neither are always shown.
const navItems = [
	{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, perm: "dashboard.view" },
	{ href: "/admin/posts", label: "Posts", icon: FileText, anyOf: "posts.view" },
	{ href: "/admin/pages", label: "Pages", icon: Files, perm: "pages.view" },
	{ href: "/admin/categories", label: "Categories", icon: FolderTree, perm: "categories.view" },
	{ href: "/admin/media", label: "Media", icon: Image, perm: "media.view" },
	{ href: "/admin/comments", label: "Comments", icon: MessageSquare, perm: "comments.view" },
	{ href: "/admin/users", label: "Users", icon: Users, perm: "users.view" },
	{ href: "/admin/settings", label: "Settings", icon: Settings, perm: "settings.view" },
];

export function Sidebar() {
	const router = useRouter();
	const pathname = usePathname();
	const { signOut } = useAuth();
	const { has, hasAny } = usePermissions();

	const visibleItems = navItems.filter((item) => {
		if (item.anyOf) return hasAny(item.anyOf);
		if (item.perm) return has(item.perm);
		return true;
	});

	async function handleLogout() {
		await signOut();
		// refresh() lets the proxy see the cleared session cookie.
		router.replace("/admin/login");
		router.refresh();
	}

	return (
		<aside className="border-border bg-brand sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r">
			<div className="border-border flex h-[4.5rem] items-center border-b px-6">
				<Link href="/admin" className="font-title block text-lg leading-tight font-semibold">
					Admin Panel
				</Link>
			</div>

			<nav className="flex-1 overflow-y-auto px-3 py-4">
				<ul className="space-y-1">
					{visibleItems.map((item) => {
						// react-router's NavLink matched the index route exactly and
						// everything else by prefix; mirror that so /admin/posts/create
						// still highlights Posts.
						const isActive =
							item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);

						return (
							<li key={item.href}>
								<Link
									href={item.href}
									className={`flex w-full items-center gap-3 rounded-md px-4 py-2.5 text-base transition-colors ${
										isActive ? "bg-black font-medium text-white" : "hover:bg-brand/50"
									}`}
								>
									<item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
									<span>{item.label}</span>
								</Link>
							</li>
						);
					})}
				</ul>
			</nav>

			<div className="border-border border-t px-3 py-4">
				<Button
					variant="dark"
					type="button"
					leftIcon={<LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />}
					onClick={handleLogout}
					className="w-full"
				>
					Log out
				</Button>
			</div>
		</aside>
	);
}
