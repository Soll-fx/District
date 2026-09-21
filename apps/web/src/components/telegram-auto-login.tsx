"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";

export function TelegramAutoLogin() {
  const router = useRouter();
  const { token, hydrated, setSession } = useAuth();
  const attempted = useRef(false);

  useEffect(() => {
    if (!hydrated || token || attempted.current) return;

    const initData = window.Telegram?.WebApp?.initData;
    if (!initData) return;

    attempted.current = true;
    api
      .post<{ accessToken: string; user: import("@/lib/auth-store").AuthUser }>("/auth/telegram", {
        initData,
      })
      .then((res) => {
        setSession(res.accessToken, res.user);
        router.replace("/");
      })
      .catch(() => {});
  }, [hydrated, token, setSession, router]);

  return null;
}