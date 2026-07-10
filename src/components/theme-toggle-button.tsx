"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Temporary dev toggle for previewing light mode — not a real theme
 * system (no persistence/system-preference detection), just flips the
 * `dark` class on <html> so the already-defined light CSS variables
 * in globals.css can actually be seen. */
export function ThemeToggleButton() {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : true,
  );

  function toggle() {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    setIsDark(next);
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={toggle}>
      {isDark ? "Preview Light Mode" : "Preview Dark Mode"}
    </Button>
  );
}
