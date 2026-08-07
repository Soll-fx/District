"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Dock } from "@/components/layout/Dock";
import { useAuth, type AuthUser } from "@/lib/auth-store";
import { API_URL } from "@/lib/api";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const token = useAuth((s) => s.token);
  const hydrated = useAuth((s) => s.hydrated);
  const setSession = useAuth((s) => s.setSession);

  useEffect(() => {
    if (hydrated && !token) router.replace("/login");
  }, [token, hydrated, router]);

  useEffect(() => {
    if (!hydrated || !token) return;
    let cancelled = false;
    fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && !cancelled) setSession(token, data as AuthUser);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [token, hydrated, setSession]);

  if (!hydrated || !token) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-card-border border-t-violet" />
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <Sidebar />
      <TopBar />
      <main className="mx-auto max-w-[1440px] px-4 pb-32 pt-20 sm:px-6 md:pb-12 md:pl-[112px] md:pt-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <Dock />
    </div>
  );
}
