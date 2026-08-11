"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useAuth } from "@/lib/auth";

type PermissionsContextValue = {
	permissions: Set<string>;
	loading: boolean;
	has: (key: string) => boolean;
	/** True if the user holds the `.own` OR `.any` flavor of a permission. */
	hasAny: (key: string) => boolean;
};

type ProfileRoleRow = {
	role: {
		role_permissions: { permission: { key: string } | null }[];
	} | null;
};

const PermissionsContext = createContext<PermissionsContextValue | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
	const supabase = supabaseBrowser();
	const { user } = useAuth();
	const [permissions, setPermissions] = useState<Set<string>>(new Set());
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let active = true;

		if (!user) {
			setPermissions(new Set());
			setLoading(false);
			return;
		}

		setLoading(true);
		// profile → role → role_permissions → permissions (RLS-readable).
		supabase
			.from("profiles")
			.select("role:roles(role_permissions(permission:permissions(key)))")
			.eq("id", user.id)
			.maybeSingle()
			.then(({ data }) => {
				if (!active) return;
				// role is a to-one FK (object at runtime); PostgREST's generic types
				// can't tell, so cast to the real shape.
				const row = data as ProfileRoleRow | null;
				const keys = (row?.role?.role_permissions ?? [])
					.map((rp) => rp.permission?.key)
					.filter((k): k is string => Boolean(k));
				setPermissions(new Set(keys));
				setLoading(false);
			});

		return () => {
			active = false;
		};
	}, [supabase, user]);

	function has(key: string) {
		return permissions.has(key);
	}

	function hasAny(key: string) {
		return permissions.has(`${key}.own`) || permissions.has(`${key}.any`);
	}

	return (
		<PermissionsContext.Provider value={{ permissions, loading, has, hasAny }}>
			{children}
		</PermissionsContext.Provider>
	);
}

export function usePermissions() {
	const ctx = useContext(PermissionsContext);
	if (!ctx) {
		throw new Error("usePermissions must be used within a PermissionsProvider");
	}
	return ctx;
}
