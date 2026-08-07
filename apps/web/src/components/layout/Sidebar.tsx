"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CandlestickChart,
  ChartSpline,
  Lightbulb,
  Radio,
  Trophy,
  Wallet,
  NotebookPen,
  Inbox,
  FileClock,
  Settings,
  Trash2,
  LogOut,
  Sun,
  Moon,
  ShieldHalf,
  type LucideIcon,
} from "lucide-react";
import { GradientMenu, type GradientMenuItem } from "@/components/ui/gradient-menu";
import { RailTip } from "@/components/ui/rail-tip";
import { useLang } from "@/lib/i18n";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

type NavEntry = { href: string; labelKey: string; icon: LucideIcon };

const NAV: NavEntry[] = [
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

const NAV_GRADIENTS: Record<string, { from: string; to: string }> = {
  "/": { from: "#a955ff", to: "#ea51ff" },
  "/trades": { from: "#56CCF2", to: "#2F80ED" },
  "/analytics": { from: "#80FF72", to: "#7EE8FA" },
  "/ideas": { from: "#FF9966", to: "#FF5E62" },
  "/streams": { from: "#ffa9c6", to: "#f434e2" },
  "/rewards": { from: "#F6D365", to: "#FDA085" },
  "/accounts": { from: "#30CFD0", to: "#330867" },
  "/postmortems": { from: "#FBD3E9", to: "#BB377D" },
  "/inbox": { from: "#A8EDEA", to: "#4B6CB7" },
  "/changelog": { from: "#D4FC79", to: "#96E6A1" },
  "/settings": { from: "#7F7FD5", to: "#86A8E7" },
  "/trash": { from: "#C71D6F", to: "#D96CFF" },
};

function TipLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2 whitespace-nowrap rounded-xl border-[0.5px] border-card-border/30 bg-card/90 px-3 py-2 text-[12px] font-extrabold text-text-1 shadow-dock backdrop-blur-xl">
      {children}
    </span>
  );
}

function RailLink({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <RailTip content={<TipLabel>{label}</TipLabel>}>
      <Link
        href={href}
        aria-label={label}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full border border-card-border bg-card text-text-2 shadow-card transition-all duration-200 hover:scale-110 hover:text-text-1",
          active && "ring-1 ring-violet/50 text-text-1",
        )}
      >
        {children}
      </Link>
    </RailTip>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t, lang, setLang } = useLang();
  const { theme, toggle } = useTheme();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  const isAdmin = user?.role === "ADMIN";

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const navItems: GradientMenuItem[] = NAV.map((n) => {
    const g = NAV_GRADIENTS[n.href];
    return { href: n.href, label: t(n.labelKey), icon: n.icon, from: g.from, to: g.to };
  });

  return (
    <aside className="fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 md:block">
      <div className="flex max-h-[calc(100dvh-2rem)] flex-col items-center gap-1.5 overflow-y-auto rounded-3xl border-[0.5px] border-card-border/40 bg-card/70 p-2.5 shadow-dock backdrop-blur-xl">
        {/* профиль */}
        <RailTip content={<TipLabel>{t("settings.card")}</TipLabel>}>
          <Link
            href="/settings?tab=card"
            aria-label={t("settings.card")}
            className="block"
          >
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt=""
                className="h-10 w-10 rounded-full object-cover ring-1 ring-card-border"
              />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet to-teal text-[14px] font-extrabold text-white">
                {(user?.name ?? "D")[0].toUpperCase()}
              </span>
            )}
          </Link>
        </RailTip>

        <div className="h-px w-8 bg-card-border" />

        <GradientMenu items={navItems} />

        <div className="h-px w-8 bg-card-border" />

        {isAdmin && (
          <RailLink
            href="/admin/promos"
            label={t("admin.title")}
            active={pathname.startsWith("/admin")}
          >
            <ShieldHalf size={16} strokeWidth={pathname.startsWith("/admin") ? 2.2 : 1.8} />
          </RailLink>
        )}

        <RailTip content={<TipLabel>{lang === "ru" ? "English" : "Русский"}</TipLabel>}>
          <button
            type="button"
            onClick={() => setLang(lang === "ru" ? "en" : "ru")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-card-border bg-card text-[11px] font-bold text-text-2 shadow-card transition-all duration-200 hover:scale-110 hover:text-text-1"
            aria-label="Language"
          >
            {lang === "ru" ? "EN" : "RU"}
          </button>
        </RailTip>

        <RailTip content={<TipLabel>{t("topbar.theme")}</TipLabel>}>
          <button
            type="button"
            onClick={toggle}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-card-border bg-card text-text-2 shadow-card transition-all duration-200 hover:scale-110 hover:text-text-1"
            aria-label={t("topbar.theme")}
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </RailTip>

        <RailTip content={<TipLabel>{t("topbar.logout")}</TipLabel>}>
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-card-border bg-card text-text-2 shadow-card transition-all duration-200 hover:scale-110 hover:text-neg"
            aria-label={t("topbar.logout")}
          >
            <LogOut size={16} />
          </button>
        </RailTip>
      </div>
    </aside>
  );
}
