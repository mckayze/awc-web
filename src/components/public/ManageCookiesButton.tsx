"use client";

import { Button } from "@/components/ui/Button";
import { openCookiePreferences } from "@/lib/cookieConsent";

// Re-opens the cookie preferences panel from within the Cookie Policy page.
export function ManageCookiesButton() {
	return (
		<div className="border-t border-border pt-8">
			<Button variant="dark" onClick={openCookiePreferences}>
				Manage cookie preferences
			</Button>
		</div>
	);
}
