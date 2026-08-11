"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CookiePreferences } from "./CookiePreferences";
import {
	OPEN_COOKIE_PREFERENCES,
	allPreferences,
	hasDecided,
	writeConsent,
	type ConsentPreferences,
} from "@/lib/cookieConsent";

export function CookieBanner() {
	// Undecided until the cookie has been read, which can only happen after
	// mount — rendering nothing until then keeps the server and first client
	// paint identical, so returning visitors get no flash of the banner.
	const [visible, setVisible] = useState(false);
	const [showPrefs, setShowPrefs] = useState(false);

	useEffect(() => {
		if (!hasDecided()) setVisible(true);
	}, []);

	// Re-open (even after the banner was dismissed) when a page asks to manage
	// preferences — e.g. the "Manage cookie preferences" button on /cookie-policy.
	useEffect(() => {
		const open = () => {
			setShowPrefs(true);
			setVisible(true);
		};
		window.addEventListener(OPEN_COOKIE_PREFERENCES, open);
		return () => window.removeEventListener(OPEN_COOKIE_PREFERENCES, open);
	}, []);

	function decide(prefs: ConsentPreferences) {
		writeConsent(prefs);
		setVisible(false);
		setShowPrefs(false);
	}

	if (!visible) return null;

	return (
		<div className="fixed bottom-5 left-0 right-0 z-50 px-4 md:px-8">
			{showPrefs ? (
				<CookiePreferences onSave={decide} onAcceptAll={() => decide(allPreferences())} />
			) : (
				<div className="max-w-[1400px] mx-auto bg-white shadow-lg rounded-base p-4 md:p-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-6 border border-border">
					{/* Decorative — sits left of the whole banner on desktop, but inline
					    with the heading on mobile, so it's rendered in both slots. */}
					<span aria-hidden className="hidden md:block text-7xl leading-none">
						🍪
					</span>
					<div className="flex flex-col gap-4 flex-1">
						<div>
							<div className="flex items-center justify-between gap-3 mb-2">
								<p className="font-bold text-black text-xl md:text-2xl">We use cookies</p>
								<span aria-hidden className="md:hidden text-4xl leading-none">
									🍪
								</span>
							</div>
							<p className="text-sm md:text-base text-body/90">
								We use cookies to improve your experience, analyse traffic, and personalise content
								and ads. See our{" "}
								<a href="/cookie-policy" className="underline underline-offset-4">
									Cookie Policy
								</a>{" "}
								and{" "}
								<a href="/privacy-policy" className="underline underline-offset-4">
									Privacy Policy
								</a>
								.
							</p>
						</div>
						<div className="flex flex-col md:flex-row gap-3">
							<Button onClick={() => decide(allPreferences())}>Accept All</Button>
							<Button variant="outline" onClick={() => setShowPrefs((p) => !p)}>
								Manage Preferences
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
