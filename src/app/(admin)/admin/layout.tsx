import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth";

// Wraps every admin route, login included — the login form needs `signIn`
// from the same context the rest of the app uses. The signed-in chrome and
// the server-side guard live one level down, in (app)/layout.tsx.

export const metadata: Metadata = {
	title: "Admin | A Woman's Confidence",
	robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
	return <AuthProvider>{children}</AuthProvider>;
}
