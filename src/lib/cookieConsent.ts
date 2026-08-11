// Cookie consent: storage, reads, and the events that keep the banner and any
// consent-gated script (analytics, ads, embeds) decoupled from each other.
//
// Nothing in here touches `document` at module scope, so it's safe to import
// from a server component — but every function is a no-op outside the browser.

export const CONSENT_COOKIE = "awc_cookie_consent";

// Bump when the category list changes. A stored value on an older version is
// treated as absent, so everyone is asked again for the new shape.
export const CONSENT_VERSION = 1;

const MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // ~6 months

export const CONSENT_CATEGORIES = ["essential", "analytics", "marketing", "functional"] as const;

export type ConsentCategory = (typeof CONSENT_CATEGORIES)[number];
export type ConsentPreferences = Record<ConsentCategory, boolean>;

export type StoredConsent = {
	version: number;
	/** ISO timestamp of the decision — useful if we ever need to show or audit it. */
	date: string;
	prefs: ConsentPreferences;
};

/** Fired after a decision is stored. `detail` is the stored consent. */
export const CONSENT_CHANGE = "awc:cookie-consent-change";

/**
 * Lets any page re-open the cookie preferences panel that lives in the
 * (always-mounted) CookieBanner. A window event keeps the two decoupled —
 * the button fires it, the banner listens.
 */
export const OPEN_COOKIE_PREFERENCES = "awc:open-cookie-preferences";

export function openCookiePreferences(): void {
	window.dispatchEvent(new Event(OPEN_COOKIE_PREFERENCES));
}

/** Essential is always on; everything else defaults off until opted into. */
export function defaultPreferences(): ConsentPreferences {
	return {
		essential: true,
		analytics: false,
		marketing: false,
		functional: false,
	};
}

export function allPreferences(): ConsentPreferences {
	return {
		essential: true,
		analytics: true,
		marketing: true,
		functional: true,
	};
}

function readCookie(name: string): string | null {
	const prefix = `${name}=`;
	for (const part of document.cookie.split("; ")) {
		if (part.startsWith(prefix)) return part.slice(prefix.length);
	}
	return null;
}

/**
 * The stored decision, or null if there isn't a usable one — no cookie, an old
 * version, or anything we can't parse. Null means "ask again".
 */
export function readConsent(): StoredConsent | null {
	if (typeof document === "undefined") return null;

	const raw = readCookie(CONSENT_COOKIE);
	if (!raw) return null;

	try {
		const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<StoredConsent>;
		if (parsed?.version !== CONSENT_VERSION || !parsed.prefs) return null;

		// Normalise rather than trust: a hand-edited or partial cookie still
		// yields a complete, well-typed set with essential forced on.
		const prefs = defaultPreferences();
		for (const category of CONSENT_CATEGORIES) {
			prefs[category] = category === "essential" || parsed.prefs[category] === true;
		}

		return { version: CONSENT_VERSION, date: parsed.date ?? "", prefs };
	} catch {
		return null;
	}
}

/** True once the visitor has made any decision — what the banner keys off. */
export function hasDecided(): boolean {
	return readConsent() !== null;
}

/**
 * Whether a given category is allowed. Gate optional scripts on this:
 * `if (hasConsent("analytics")) loadAnalytics()`.
 */
export function hasConsent(category: ConsentCategory): boolean {
	return readConsent()?.prefs[category] ?? false;
}

/** Stores the decision and notifies listeners. */
export function writeConsent(prefs: ConsentPreferences): StoredConsent {
	const stored: StoredConsent = {
		version: CONSENT_VERSION,
		date: new Date().toISOString(),
		prefs: { ...prefs, essential: true },
	};

	if (typeof document !== "undefined") {
		const value = encodeURIComponent(JSON.stringify(stored));
		const secure = location.protocol === "https:" ? "; Secure" : "";
		document.cookie = `${CONSENT_COOKIE}=${value}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
		window.dispatchEvent(new CustomEvent<StoredConsent>(CONSENT_CHANGE, { detail: stored }));
	}

	return stored;
}

/**
 * Subscribe to consent changes. Returns an unsubscribe function, so it drops
 * straight into a `useEffect`.
 */
export function onConsentChange(callback: (consent: StoredConsent) => void): () => void {
	const handler = (event: Event) => callback((event as CustomEvent<StoredConsent>).detail);
	window.addEventListener(CONSENT_CHANGE, handler);
	return () => window.removeEventListener(CONSENT_CHANGE, handler);
}
