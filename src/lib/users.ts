import { supabaseBrowser } from "@/lib/supabase/browser";

export type Profile = {
	id: string;
	username: string | null;
	email: string | null;
	full_name: string | null;
	avatar_url: string | null;
	is_enabled: boolean;
	role_id: string | null;
	created_at: string;
	updated_at: string;
};

export type Role = {
	id: string;
	name: string;
	description: string | null;
};

export async function listUsers(): Promise<Profile[]> {
	const { data, error } = await supabaseBrowser()
		.from("profiles")
		.select("*")
		.order("created_at", { ascending: false });
	if (error) throw new Error(error.message);
	return data ?? [];
}

export async function listRoles(): Promise<Role[]> {
	const { data, error } = await supabaseBrowser()
		.from("roles")
		.select("id, name, description")
		.order("name");
	if (error) throw new Error(error.message);
	return data ?? [];
}

export async function getUserById(id: string): Promise<Profile | null> {
	const { data, error } = await supabaseBrowser()
		.from("profiles")
		.select("*")
		.eq("id", id)
		.maybeSingle();
	if (error) throw new Error(error.message);
	return data;
}

export type CreateUserInput = {
	email: string;
	password: string;
	full_name?: string;
	role_id?: string;
};

// Invokes an edge function and surfaces the function's own { error } string
// (invoke() only gives a generic message on non-2xx otherwise).
async function invokeFn<T>(name: string, body: Record<string, unknown>): Promise<T> {
	const { data, error } = await supabaseBrowser().functions.invoke(name, { body });
	if (error) {
		let message = error.message;
		const res = (error as { context?: Response }).context;
		if (res && typeof res.json === "function") {
			try {
				// `res.json()` is typed as `{}` here (workerd's Response, not the
				// DOM's `any`), so the shape has to be asserted.
				const parsed = (await res.json()) as { error?: string };
				if (parsed?.error) message = parsed.error;
			} catch {
				// keep the generic message
			}
		}
		throw new Error(message);
	}
	return data as T;
}

// All three go through edge functions (they need the service-role key).
export function createUser(input: CreateUserInput) {
	return invokeFn<{ user: { id: string } }>("create-user", input);
}

export function deleteUser(id: string) {
	return invokeFn<{ ok: true }>("delete-user", { id });
}

export function resetPassword(id: string, password: string) {
	return invokeFn<{ ok: true }>("reset-password", { id, password });
}

// RLS: users can update their own row; holders of users.edit can update any
// row (admin policy on profiles).
export async function updateProfile(
	id: string,
	fields: Partial<Pick<Profile, "full_name" | "username" | "is_enabled" | "role_id">>,
) {
	const { error } = await supabaseBrowser().from("profiles").update(fields).eq("id", id);
	if (error) throw new Error(error.message);
}
