"use client";

import { useEffect } from "react";

export const UNSAVED_CHANGES_MESSAGE = "You have unsaved changes. Leave without saving?";

// Warns before unsaved edits are lost to a tab close/reload/typed URL (native
// beforeunload) or the browser's Back/Forward buttons (popstate). The App
// Router has no built-in navigation blocker, so a cancelled popstate is
// undone by re-pushing the current entry — the page never actually leaves,
// it just looks like it did for a moment.
export function useUnsavedChangesGuard(dirty: boolean) {
	useEffect(() => {
		if (!dirty) return;

		function onBeforeUnload(e: BeforeUnloadEvent) {
			e.preventDefault();
			e.returnValue = "";
		}

		function onPopState() {
			if (window.confirm(UNSAVED_CHANGES_MESSAGE)) return;
			history.pushState(null, "", window.location.href);
		}

		history.pushState(null, "", window.location.href);
		window.addEventListener("beforeunload", onBeforeUnload);
		window.addEventListener("popstate", onPopState);
		return () => {
			window.removeEventListener("beforeunload", onBeforeUnload);
			window.removeEventListener("popstate", onPopState);
		};
	}, [dirty]);
}
