"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";

export function TelegramAutoLogin() {
  const router = useRouter();
  const { token, hydrated, setSession } = useAuth();
  const attempted = useRef(false);
  const [denied, setDenied] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!hydrated || token || attempted.current) return;

    const initData = window.Telegram?.WebApp?.initData;
    if (!initData) return;

    attempted.current = true;
    setChecking(true);
    api
      .post<{ accessToken: string; user: import("@/lib/auth-store").AuthUser }>("/auth/telegram", {
        initData,
      })
      .then((res) => {
        setSession(res.accessToken, res.user);
        router.replace("/");
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 403) {
          setDenied(true);
        }
      })
      .finally(() => setChecking(false));
  }, [hydrated, token, setSession, router]);

  if (!hydrated) return null;
  if (denied) return renderDenied();
  if (checking) return <div className="fixed inset-0 z-[100] bg-bg" />;
  return null;

  function renderDenied() {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg p-6">
        <div className="w-full max-w-sm rounded-2xl border border-card-border bg-card p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-neg/10 text-neg">
            <LockKeyhole size={24} />
          </span>
          <h2 className="mt-4 text-[17px] font-extrabold text-text-1">Доступ закрыт</h2>
          <p className="mt-2 text-[13px] font-medium leading-relaxed text-text-3">
            Использование бота доступно по приглашению. Свяжитесь с администратором, чтобы
            открыть вам доступ.
          </p>
        </div>
      </div>
    );
  }
}