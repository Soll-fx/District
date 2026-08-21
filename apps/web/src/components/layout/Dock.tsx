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
  X,
  LayoutGrid,
  Radio,
  type LucideIcon,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-store";

type NavItem = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  external?: boolean;
  section?: "main" | "extra";
};

const NAV: NavItem[] = [
  { href: "/", labelKey: "nav.dashboard", icon: LayoutDashboard, section: "main" },
  { href: "/trades", labelKey: "nav.trades", icon: CandlestickChart, section: "main" },
  { href: "/analytics", labelKey: "nav.analytics", icon: ChartSpline, section: "main" },
  { href: "/ideas", labelKey: "nav.ideas", icon: Lightbulb, section: "main" },
  { href: "/streams", labelKey: "nav.streams", icon: Radio, section: "extra" },
  { href: "/rewards", labelKey: "nav.rewards", icon: Trophy, section: "extra" },
  { href: "/accounts", labelKey: "nav.accounts", icon: Wallet, section: "extra" },
  { href: "/postmortems", labelKey: "nav.postmortems", icon: NotebookPen, section: "extra" },
  { href: "/inbox", labelKey: "nav.inbox", icon: Inbox, section: "extra" },
  { href: "/changelog", labelKey: "nav.changelog", icon: FileClock, section: "extra" },
  { href: "/settings", labelKey: "nav.settings", icon: Settings, section: "extra" },
  { href: "/trash", labelKey: "nav.trash", icon: Trash2, section: "extra" },
];

function DockIcon({ item, active, t }: { item: NavItem; active: boolean; t: (k: string) => string }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`dock-item relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 hover:-translate-y-1 sm:h-10 sm:w-10 ${
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
  const [moreOpen, setMoreOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);

  const main = NAV.filter((n) => n.section === "main");
  const extra = NAV.filter((n) => n.section === "extra");

  return (
    <>
      {/* ── нижний док ── */}
      <nav
        className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-50 -translate-x-1/2 md:hidden"
        aria-label="Основная навигация"
      >
        <div className="flex items-center gap-0.5 rounded-2xl bg-[#12182B] px-2 py-2 shadow-dock sm:gap-1">
          {/* декоративный логотип-аватар → карточка профиля */}
          <Link
            href="/settings?tab=card"
            className="dock-item relative mx-0.5 hidden h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet to-teal text-[13px] font-extrabold text-white sm:flex sm:h-10 sm:w-10"
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
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setQuickOpen((v) => !v);
                setMoreOpen(false);
              }}
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

          <div className="mx-1 h-5 w-px bg-white/15" />

          {main.map((item) => (
            <DockIcon key={item.href} item={item} t={t} active={pathname === item.href} />
          ))}

          {/* второстепенные — на десктопе в доке, на мобильных в "Ещё" */}
          <div className="hidden items-center gap-0.5 sm:flex sm:gap-1">
            {extra.slice(0, 4).map((item) => (
              <DockIcon key={item.href} item={item} t={t} active={pathname === item.href} />
            ))}
            <div className="mx-1 h-5 w-px bg-white/15" />
            {extra.slice(4).map((item) => (
              <DockIcon key={item.href} item={item} t={t} active={pathname === item.href} />
            ))}
          </div>

          {/* мобильная кнопка "Ещё" */}
          <button
            type="button"
            onClick={() => {
              setMoreOpen((v) => !v);
              setQuickOpen(false);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/75 transition-all duration-200 hover:-translate-y-1 hover:bg-white/10 hover:text-white sm:hidden"
            aria-label="Все разделы"
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      </nav>

      {/* ── мобильный лист всех разделов ── */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-[#12182B]/40 backdrop-blur-[2px]"
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white p-4 pb-[calc(2rem+env(safe-area-inset-bottom))] shadow-dock"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="label-caps">{t("dock.allSections")}</span>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-bg text-text-2"
                  aria-label="Закрыть"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {extra.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-center text-[11px] font-semibold ${
                        active
                          ? "border-hero bg-hero text-white"
                          : "border-card-border bg-card text-text-2"
                      }`}
                    >
                      <Icon size={18} />
                      {t(item.labelKey)}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
