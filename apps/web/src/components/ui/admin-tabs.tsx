"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

export function AdminTabs() {
  const pathname = usePathname();
  const { t } = useLang();
  const items = [
    { href: "/admin/users", label: t("admin.tab.users") },
    { href: "/admin/promos", label: t("admin.tab.promos") },
  ];
  return (
    <div className="flex w-full max-w-[320px] rounded-xl border border-card-border bg-card p-1">
      {items.map((i) => {
        const active = pathname?.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            className={cn(
              "flex-1 rounded-lg px-2 py-2 text-center text-[13px] font-bold transition-all",
              active
                ? "bg-gradient-to-br from-violet to-teal text-white shadow-[0_4px_16px_rgba(124,108,240,0.35)]"
                : "text-text-2 hover:text-text-1",
            )}
          >
            {i.label}
          </Link>
        );
      })}
    </div>
  );
}
