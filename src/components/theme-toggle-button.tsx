"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "theme";

// A previous version of this (see CLAUDE.md) was a raw classList mutation
// with no persistence or visible indicator — toggling light mode, then
// navigating away via the bottom nav, left the whole app stuck in light
// mode with no way to tell why (Next's App Router preserves the root <html>
// element across client-side nav, but a real page reload always re-runs
// SSR, which hardcodes `dark`). This version fixes both: the choice is
// persisted to localStorage (read by an inline script in layout.tsx before
// hydration, so a reload doesn't flash back to dark or silently revert),
// and the button always shows which mode is active rather than being a
// bare icon.
export function ThemeToggleButton() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    setIsLight(!document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !isLight;
    setIsLight(next);
    document.documentElement.classList.toggle("dark", !next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "light" : "dark");
    } catch {
      // Private browsing etc. — theme just won't survive a reload.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex items-center justify-between gap-2 rounded-sm bg-card p-3 text-sm font-medium text-foreground hover:bg-muted"
    >
      <span className="flex items-center gap-2">
        {isLight ? <Sun className="size-4" /> : <Moon className="size-4" />}
        {isLight ? "Light mode" : "Dark mode"}
      </span>
      <span className="text-xs text-muted-foreground">Tap to switch</span>
    </button>
  );
}
