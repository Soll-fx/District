"use client";

import { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Sparkline } from "@/components/ui/sparkline";
import { Ring } from "@/components/ui/ring";
import { cn, formatMoney } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { useProfile } from "@/hooks/use-settings";
import { useEquity, useTrades, useTradeStats } from "@/hooks/use-trades";

const AVATAR_COLORS = ["#7C6CF0", "#22C55E", "#F59E0B", "#3B82F6", "#EC4899"];

function initialsOf(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function ProfileCard() {
  const { t, lang } = useLang();
  const { data: profile } = useProfile();
  const { data: stats } = useTradeStats();
  const { data: equityRes } = useEquity(365);
  const { data: tradesRes } = useTrades();

  const spark = useMemo(() => (equityRes?.points ?? []).map((p) => p.balance), [equityRes]);

  const topAssets = useMemo(() => {
    const map = new Map<string, { count: number; pnl: number }>();
    for (const tr of tradesRes?.items ?? []) {
      const cur = map.get(tr.asset) ?? { count: 0, pnl: 0 };
      cur.count += 1;
      cur.pnl += tr.pnl;
      map.set(tr.asset, cur);
    }
    return Array.from(map.entries())
      .map(([asset, v]) => ({ asset, ...v }))
      .sort((a, b) => b.count - a.count || b.pnl - a.pnl)
      .slice(0, 5);
  }, [tradesRes]);
  const maxAssetCount = topAssets.length ? Math.max(...topAssets.map((a) => a.count)) : 0;

  const totalPnl = stats?.totalPnl ?? 0;
  const count = stats?.count ?? 0;
  const winRate = stats?.winRate ?? 0;
  const wins = stats?.wins ?? 0;
  const losses = stats?.losses ?? 0;
  const longCount = stats?.longCount ?? 0;
  const shortCount = stats?.shortCount ?? 0;
  const avgPerTrade = count > 0 ? totalPnl / count : 0;
  const longShare = longCount + shortCount > 0 ? (longCount / (longCount + shortCount)) * 100 : 0;
  const winShare = count > 0 ? (wins / count) * 100 : 0;

  const name = profile?.name?.trim() || profile?.email?.split("@")[0] || "Trader";
  const username = profile?.email?.split("@")[0] ?? "";
  const avatarColor = AVATAR_COLORS[(name.length || 0) % AVATAR_COLORS.length];
  const memberSince = profile?.createdAt
    ? new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "en-US", { month: "long", year: "numeric" })
        .format(new Date(profile.createdAt))
        .toUpperCase()
    : "—";

  const mini = [
    { label: t("profileCard.netPnl"), value: formatMoney(totalPnl), c: totalPnl >= 0 ? "text-pos" : "text-neg" },
    { label: t("profileCard.tradeWinRate"), value: `${winRate.toFixed(0)}%` },
    { label: t("profileCard.totalTrades"), value: String(count) },
    { label: t("profileCard.avgR"), value: `${(stats?.avgR ?? 0).toFixed(2)}R` },
    { label: t("profileCard.avgPnlPerTrade"), value: formatMoney(avgPerTrade), c: avgPerTrade >= 0 ? "text-pos" : "text-neg" },
    { label: t("profileCard.profitFactor"), value: (stats?.profitFactor ?? 0).toFixed(2) },
  ];

  const summaryRows = [
    { label: t("profileCard.avgWin"), value: formatMoney(stats?.avgWin ?? 0), c: "text-pos" },
    { label: t("profileCard.avgLoss"), value: formatMoney(-(stats?.avgLoss ?? 0)), c: "text-neg" },
    { label: t("profileCard.maxDrawdown"), value: formatMoney(-(stats?.maxDrawdown ?? 0)), c: "text-neg" },
  ];

  return (
    <div className="space-y-5">
      {/* ── Верхняя панель ── */}
      <div className="card animate-in flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
        <div className="flex items-center gap-2 text-[12.5px] font-semibold text-text-2">
          <CalendarDays size={14} className="text-text-3" />
          {t("profileCard.memberSince")} · <span className="num font-bold text-text-1">{memberSince}</span>
        </div>
        <button type="button" className="btn btn-ghost !px-3 !py-1.5 text-[12px]" onClick={() => window.history.replaceState(null, "", "/settings?tab=profile")}>
          {t("profileCard.editProfile")}
        </button>
      </div>

      {/* ── Профиль + виджеты ── */}
      <div className="grid gap-5 md:grid-cols-4">
        <Card className="animate-in flex flex-col justify-between p-5">
          <div className="flex items-center gap-3.5">
            {profile?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt={name} className="h-14 w-14 rounded-full object-cover ring-1 ring-card-border" />
            ) : (
              <span
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[17px] font-extrabold text-white"
                style={{ background: avatarColor }}
              >
                {initialsOf(name)}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-[16px] font-extrabold tracking-tight text-text-1">{name}</p>
              <p className="truncate text-[12px] text-text-2">@{username}</p>
            </div>
          </div>
          <div className="mt-5">
            <p className="label-caps">{t("profileCard.memberSince")}</p>
            <p className="num mt-0.5 text-[13px] font-bold text-text-1">{memberSince}</p>
          </div>
        </Card>

        <Card className="animate-in animate-delay-1 flex flex-col justify-between p-5">
          <p className="label-caps">{t("profileCard.winRate")}</p>
          <div className="my-auto flex justify-center py-3">
            <Ring value={winRate} size={108} stroke={10} color="#22C55E">
              <p className="num text-[22px] font-extrabold leading-none text-text-1">{winRate.toFixed(0)}%</p>
            </Ring>
          </div>
          <div className="flex justify-between text-[11.5px] font-semibold text-text-2">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-pos" /> {t("profileCard.wins")} {wins}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-neg" /> {t("profileCard.losses")} {losses}
            </span>
          </div>
        </Card>

        <Card className="animate-in animate-delay-2 flex flex-col justify-between p-5">
          <div>
            <p className="label-caps">{t("profileCard.pnlCurve")}</p>
            <p className={cn("num mt-1 text-[24px] font-extrabold leading-none", totalPnl >= 0 ? "text-pos" : "text-neg")}>
              {formatMoney(totalPnl)}
            </p>
            <p className="mt-0.5 text-[10.5px] font-bold uppercase tracking-wide text-text-3">{t("profileCard.cumulativePnl")}</p>
          </div>
          <div className="mt-4 flex h-11 items-end">
            <Sparkline data={spark} width={170} height={40} color={totalPnl >= 0 ? "#22C55E" : "#EF4444"} />
          </div>
        </Card>

        <Card className="animate-in animate-delay-3 flex flex-col justify-between p-5">
          <p className="label-caps">{t("profileCard.longShort")}</p>
          <div className="my-auto flex justify-center py-3">
            <Ring value={longShare} size={108} stroke={10} color="#7C6CF0">
              <div className="text-center">
                <p className="num text-[19px] font-extrabold leading-none text-text-1">
                  {longCount}/{shortCount}
                </p>
                <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-text-3">{t("profileCard.trades")}</p>
              </div>
            </Ring>
          </div>
          <div className="flex justify-between text-[11.5px] font-semibold text-text-2">
            <span>{t("profileCard.long")} {longCount}</span>
            <span>{t("profileCard.short")} {shortCount}</span>
          </div>
        </Card>
      </div>

      {/* ── Топ инструменты + сводка ── */}
      <div className="grid gap-5 md:grid-cols-2">
        <Card className="animate-in animate-delay-4 p-5">
          <p className="label-caps">{t("profileCard.topAssets")}</p>
          <div className="mt-3 space-y-3">
            {topAssets.length === 0 && <p className="text-[12.5px] text-text-3">{t("profileCard.noTrades")}</p>}
            {topAssets.map((a) => (
              <div key={a.asset} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral/6 text-[10.5px] font-extrabold text-text-2">
                  {a.asset.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 text-[12.5px]">
                    <span className="truncate font-bold text-text-1">{a.asset}</span>
                    <span className="num shrink-0 font-bold text-text-2">{a.count}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral/6">
                    <div className="h-full rounded-full bg-teal" style={{ width: `${maxAssetCount ? (a.count / maxAssetCount) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="animate-in animate-delay-5 p-5">
          <p className="label-caps">{t("profileCard.tradeSummary")}</p>
          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between text-[12.5px] font-bold text-text-1">
              <span>{t("profileCard.wins")} · {wins}</span>
              <span>{t("profileCard.losses")} · {losses}</span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-neutral/6">
              <div className="h-full bg-pos" style={{ width: `${winShare}%` }} />
              <div className="h-full bg-neg" style={{ width: `${100 - winShare}%` }} />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {summaryRows.map((r) => (
              <div key={r.label} className="flex items-center justify-between rounded-xl bg-neutral/4 px-3.5 py-2.5 text-[12.5px]">
                <span className="font-semibold text-text-2">{r.label}</span>
                <span className={cn("num font-bold", r.c)}>{r.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Сетка мини-метрик ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {mini.map((m) => (
          <Card key={m.label} className="animate-in p-4">
            <p className="label-caps !text-[9.5px]">{m.label}</p>
            <p className={cn("num mt-1.5 text-[19px] font-extrabold leading-none text-text-1", m.c)}>{m.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
