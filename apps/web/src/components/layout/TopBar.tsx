"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { useLang } from "@/lib/i18n";

export function TopBar() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const { t } = useLang();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const initials = (user?.name ?? user?.email ?? "D")
    .split(/[@\s]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("")
    .slice(0, 2);

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-16 md:hidden">
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-4 sm:px-6">
        <Link href="/settings?tab=card" className="flex items-center gap-2.5">
          {user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-xl object-cover" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet to-teal text-[13px] font-extrabold text-white">
              {(user?.name ?? "D")[0].toUpperCase()}
            </span>
          )}
          <span className="text-[15px] font-extrabold tracking-tight text-text-1">{user?.name ?? "District"}</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-card-border bg-card text-text-2 shadow-card transition-colors hover:text-text-1"
            aria-label="Уведомления"
          >
            <Bell size={17} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-neg ring-2 ring-card" />
          </button>

          <button
            type="button"
            onClick={() => setShowMenu((v) => !v)}
            className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-hero to-hero-2 text-[12px] font-bold text-white shadow-card transition-transform hover:scale-105"
            aria-label="Профиль"
          >
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
            {showMenu && (
              <span className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-xl border border-card-border bg-card text-left shadow-lg">
                <div className="border-b border-card-border px-3.5 py-2.5">
                  <p className="truncate text-[12.5px] font-extrabold text-text-1">{user?.name ?? user?.email}</p>
                  <p className="truncate text-[11px] text-text-3">{user?.email}</p>
                </div>
                <Link
                  href="/settings"
                  className="block px-3.5 py-2.5 text-[13px] font-semibold text-text-2 hover:bg-bg hover:text-text-1"
                >
                  {t("topbar.settings")}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full px-3.5 py-2.5 text-left text-[13px] font-semibold text-neg hover:bg-bg"
                >
                  {t("topbar.logout")}
                </button>
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
