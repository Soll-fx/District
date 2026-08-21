"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  CandlestickChart,
  ChartSpline,
  Lightbulb,
  Trophy,
  Inbox,
  FileClock,
  Settings,
  Trash2,
  Wallet,
  NotebookPen,
  Plus,
  Radio,
  type LucideIcon,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-store";

type NavItem = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
};

const NAV: NavItem[] = [
  { href: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/trades", labelKey: "nav.trades", icon: CandlestickChart },
  { href: "/analytics", labelKey: "nav.analytics", icon: ChartSpline },
  { href: "/ideas", labelKey: "nav.ideas", icon: Lightbulb },
  { href: "/streams", labelKey: "nav.streams", icon: Radio },
  { href: "/rewards", labelKey: "nav.rewards", icon: Trophy },
  { href: "/accounts", labelKey: "nav.accounts", icon: Wallet },
  { href: "/postmortems", labelKey: "nav.postmortems", icon: NotebookPen },
  { href: "/inbox", labelKey: "nav.inbox", icon: Inbox },
  { href: "/changelog", labelKey: "nav.changelog", icon: FileClock },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
  { href: "/trash", labelKey: "nav.trash", icon: Trash2 },
];

function DockIcon({ item, active, t }: { item: NavItem; active: boolean; t: (k: string) => string }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`dock-item relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200 hover:-translate-y-1 sm:h-10 sm:w-10 ${
        active
          ? "bg-white text-[#12182B] shadow-[0_4px_16px_rgba(0,0,0,0.35)]"
          : "text-white/75 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon size={19} strokeWidth={active ? 2.4 : 1.8} />
      <span className="dock-tip">{t(item.labelKey)}</span>
    </Link>
  );
}

export function Dock() {
  const pathname = usePathname();
  const { t } = useLang();
  const user = useAuth((s) => s.user);
  const [quickOpen, setQuickOpen] = useState(false);

  return (
    <>
      {/* ── нижний док: все разделы в прокручиваемой строке ── */}
      <nav
        className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-50 w-max max-w-[calc(100vw-1.5rem)] -translate-x-1/2 md:hidden"
        aria-label="Основная навигация"
      >
        <div className="no-scrollbar flex items-center gap-0.5 overflow-x-auto rounded-2xl bg-[#12182B] px-2 py-2 shadow-dock sm:gap-1">
          {/* декоративный логотип-аватар → карточка профиля */}
          <Link
            href="/settings?tab=card"
            className="dock-item relative mx-0.5 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet to-teal text-[13px] font-extrabold text-white sm:h-10 sm:w-10"
            aria-label={t("settings.card")}
          >
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              (user?.name ?? user?.email ?? "D")[0].toUpperCase()
            )}
            <span className="dock-tip">{t("settings.card")}</span>
          </Link>

          {/* "+" — быстрое действие */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setQuickOpen((v) => !v)}
              className="dock-item relative flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#12182B] shadow-[0_4px_16px_rgba(255,255,255,0.25)] transition-all duration-200 hover:-translate-y-1 sm:h-10 sm:w-10"
              aria-label="Быстрое действие"
            >
              <Plus size={19} strokeWidth={2.6} />
              <span className="dock-tip">{t("dock.create")}</span>
            </button>

            <AnimatePresence>
              {quickOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-[calc(100%+12px)] left-0 w-44 overflow-hidden rounded-xl bg-[#12182B] p-1.5 shadow-dock"
                >
                  <Link
                    href="/trades?new=1"
                    onClick={() => setQuickOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-white/85 hover:bg-white/10 hover:text-white"
                  >
                    <CandlestickChart size={16} className="text-teal" /> {t("dock.newTrade")}
                  </Link>
                  <Link
                    href="/ideas?new=1"
                    onClick={() => setQuickOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-white/85 hover:bg-white/10 hover:text-white"
                  >
                    <Lightbulb size={16} className="text-orange" /> {t("dock.newIdea")}
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mx-1 h-5 w-px shrink-0 bg-white/15" />

          {NAV.map((item) => (
            <DockIcon key={item.href} item={item} t={t} active={pathname === item.href} />
          ))}
        </div>
      </nav>
    </>
  );
}
