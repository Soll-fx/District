"use client";

import { useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        disableVerticalSwipes?: () => void;
        setHeaderColor: (c: string) => void;
        setBackgroundColor?: (c: string) => void;
        colorScheme: "light" | "dark";
        viewportStableHeight?: number;
        initData?: string;
      };
    };
  }
}

export function TelegramBridge() {
  const { theme } = useTheme();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
    tg.ready();
    tg.expand();
    try {
      tg.setHeaderColor("#0a0a0f");
      tg.setBackgroundColor?.("#0a0a0f");
      tg.disableVerticalSwipes?.();
      tg.viewportStableHeight &&
        document.documentElement.style.setProperty("--tg-viewport", `${tg.viewportStableHeight}px`);
      document.documentElement.setAttribute("data-telegram", "1");
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}