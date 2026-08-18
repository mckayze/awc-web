"use client";

import { useEffect, useRef } from "react";

export const UNSAVED_CHANGES_MESSAGE = "You have unsaved changes. Leave without saving?";

// Warns before unsaved edits are lost to a tab close/reload/typed URL (native
// beforeunload) or the browser's Back/Forward buttons (popstate). The App
// Router has no built-in navigation blocker, so we push a sentinel history
// entry (same URL) and intercept Back via popstate instead.
export function useUnsavedChangesGuard(dirty: boolean) {
	const dirtyRef = useRef(dirty);
	dirtyRef.current = dirty;

	// Push the sentinel at most once per "became dirty" transition. Autosave
	// flips `dirty` false→true repeatedly while editing — keying the push off
	// every change (instead of a ref that only arms once) stacked a duplicate
	// entry per toggle, so Back needed several presses to move at all.
	const guardedRef = useRef(false);
	useEffect(() => {
		if (dirty && !guardedRef.current) {
			history.pushState(null, "", window.location.href);
			guardedRef.current = true;
		}
	}, [dirty]);

	useEffect(() => {
		function onBeforeUnload(e: BeforeUnloadEvent) {
			if (!dirtyRef.current) return;
			e.preventDefault();
			e.returnValue = "";
		}

		function onPopState() {
			if (!dirtyRef.current) return;
			if (window.confirm(UNSAVED_CHANGES_MESSAGE)) {
				// The entry we just popped onto is the sentinel (same URL as the
				// page we're leaving) — go back once more to actually leave.
				guardedRef.current = false;
				history.back();
				return;
			}
			history.pushState(null, "", window.location.href);
		}

		window.addEventListener("beforeunload", onBeforeUnload);
		window.addEventListener("popstate", onPopState);
		return () => {
			window.removeEventListener("beforeunload", onBeforeUnload);
			window.removeEventListener("popstate", onPopState);
		};
	}, []);
}
