"use client";

import { useCallback, useEffect, useState } from "react";

export type AppTheme = "light" | "dark" | "neumorph" | "softDark";

export const THEMES: AppTheme[] = ["light", "dark", "neumorph", "softDark"];

const STORAGE_KEY = "theme";

function getInitial(): AppTheme {
  if (typeof window === "undefined") return "light";
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return (THEMES as string[]).includes(saved ?? "") ? (saved as AppTheme) : "light";
  } catch {
    return "light";
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<AppTheme>(getInitial);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const toggle = useCallback(
    () =>
      setTheme((t) => THEMES[(THEMES.indexOf(t) + 1) % THEMES.length]),
    [],
  );

  return { theme, setTheme, toggle };
}