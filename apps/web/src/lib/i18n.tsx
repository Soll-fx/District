"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { dictionaries, type Lang } from "@/lib/i18n/dictionaries";

export type { Lang };

type LangContextValue = {
  lang: Lang;
  t: (key: string) => string;
  setLang: (lang: Lang) => void;
};

const LangContext = createContext<LangContextValue>({
  lang: "ru",
  t: (key: string) => key,
  setLang: () => {},
});

function detectInitialLang(): Lang {
  if (typeof window === "undefined") return "ru";
  try {
    const urlLang = new URLSearchParams(window.location.search).get("lang");
    if (urlLang === "en" || urlLang === "ru") return urlLang;
    const stored = window.localStorage.getItem("locale");
    if (stored === "en" || stored === "ru") return stored;
    const auth = JSON.parse(window.localStorage.getItem("district-auth") ?? "null");
    const userLocale = auth?.state?.user?.locale;
    if (userLocale === "en" || userLocale === "ru") return userLocale;
  } catch {
    /* ignore */
  }
  return "ru";
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectInitialLang);

  useEffect(() => {
    try {
      window.localStorage.setItem("locale", lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      const url = new URL(window.location.href);
      if (next === "ru") url.searchParams.delete("lang");
      else url.searchParams.set("lang", next);
      window.history.replaceState({}, "", url.toString());
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: string) => dictionaries[lang][key] ?? dictionaries.ru[key] ?? key,
    [lang],
  );

  return (
    <LangContext.Provider value={{ lang, t, setLang }}>{children}</LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
