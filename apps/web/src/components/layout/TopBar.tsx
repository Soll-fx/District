"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-store";

export function TopBar() {
  const user = useAuth((s) => s.user);

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
          <span className="text-[15px] font-extrabold tracking-tight text-text-1">{user?.name ?? "Sollo"}</span>
        </Link>
      </div>
    </header>
  );
}
