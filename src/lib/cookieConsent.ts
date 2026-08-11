// Lets any page re-open the cookie preferences panel that lives in the
// (always-mounted) CookieBanner. A window event keeps the two decoupled —
// the button fires it, the banner listens.
export const OPEN_COOKIE_PREFERENCES = "awc:open-cookie-preferences";

export function openCookiePreferences(): void {
	window.dispatchEvent(new Event(OPEN_COOKIE_PREFERENCES));
}
