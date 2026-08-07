"use client";

import { useState } from "react";
import { Eye, Crown, Zap, Gauge, Settings2, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Ring } from "@/components/ui/ring";
import { MetricsEditor, type Metric, CATEGORY_COLOR } from "@/components/MetricsEditor";
import { cn } from "@/lib/utils";
import { useProfileMetrics } from "@/hooks/use-feed";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import { useTradeStats } from "@/hooks/use-trades";
import { useLang } from "@/lib/i18n";
import type { LeaderboardUser } from "@/lib/types";

const RANK_COLORS = ["#FBBF24", "#CBD5E1", "#D97706"];
const AVATAR_COLORS = ["#7C6CF0", "#22C55E", "#F59E0B", "#3B82F6", "#EC4899"];

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";

export default function RewardsPage() {
  const [customize, setCustomize] = useState(false);
  const { t } = useLang();

  const { data: metricsData } = useProfileMetrics();
  const metrics: Metric[] = metricsData ?? [];
  const { data: stats } = useTradeStats();
  const { data: lb } = useLeaderboard();

  const shown = metrics.filter((m) => m.visible);
  const visibleCount = shown.length;
  const rankLabel = lb?.me ? `#${lb.me.rank} ${t("rewards.of")} ${lb.total}` : "…";

  const renderRow = (u: LeaderboardUser, isMe: boolean) => (
    <tr
      key={u.id}
      className={cn(
        "border-b border-card-border/60 transition-colors last:border-0",
        isMe && "bg-violet/[0.06] hover:bg-violet/[0.1]",
        !isMe && "hover:bg-bg",
      )}
    >
      <td className="py-2.5 pr-2">
        {u.rank <= 3 ? (
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-extrabold text-white"
            style={{ background: RANK_COLORS[u.rank - 1] }}
          >
            {u.rank}
          </span>
        ) : (
          <span className="num text-[12.5px] font-bold text-text-3">{u.rank}</span>
        )}
      </td>
      <td className="py-2.5 pr-3">
        <div className="flex items-center gap-2.5">
          {u.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={u.avatarUrl}
              alt={u.name}
              className="h-8 w-8 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white"
              style={{ background: AVATAR_COLORS[u.name.length % AVATAR_COLORS.length] }}
            >
              {initialsOf(u.name)}
            </span>
          )}
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate text-[12.5px] font-extrabold text-text-1">
              {u.name}
              {isMe && (
                <span className="pill !px-1.5 !py-0 text-[9px] text-white" style={{ background: "var(--violet, #7C6CF0)" }}>
                  {t("page.rewards.leaderboard.you")}
                </span>
              )}
            </p>
            <p className="text-[10.5px] text-text-3">
              {u.count} {t("rewards.trades")} · {u.streak > 0 ? `+${u.streak}` : u.streak}
            </p>
          </div>
        </div>
      </td>
      <td className="py-2.5 pr-4">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral/10">
            <div className="h-full rounded-full bg-violet" style={{ width: `${u.score}%` }} />
          </div>
          <span className="num text-[12.5px] font-extrabold text-text-1">{u.score}</span>
        </div>
      </td>
      <td className="num py-2.5 pr-4 font-semibold text-text-2">{u.winRate}%</td>
      <td className="num py-2.5 pr-4 font-semibold text-text-2">{u.profitFactor}</td>
      <td className="num py-2.5 pr-4 font-semibold text-text-2">{u.avgR}</td>
      <td className="py-2.5 pr-4">
        <span
          className={cn(
            "num font-bold",
            u.discipline >= 80 ? "text-pos" : u.discipline >= 50 ? "text-orange" : "text-neg",
          )}
        >
          {u.discipline}
        </span>
      </td>
      <td className="num py-2.5 pr-4 font-semibold text-text-2">{u.volume}</td>
    </tr>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("page.rewards.t")}
        subtitle={t("page.rewards.s")}
        actions={
          <button type="button" className={cn("btn", customize ? "btn-primary" : "btn-ghost")} onClick={() => setCustomize((v) => !v)}>
            <Settings2 size={15} />
            {customize ? t("rewards.customizeDone") : t("rewards.customizeMetrics")}
          </button>
        }
      />

      {/* ── Hero профиля ── */}
      <Card className="hero-card animate-in overflow-hidden p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {lb?.me?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={lb.me.avatarUrl}
                alt="avatar"
                className="h-14 w-14 rounded-2xl object-cover"
              />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange to-[#F97316] text-[18px] font-extrabold text-white">
                D
              </span>
            )}
            <div>
              <p className="flex items-center gap-2 text-[19px] font-extrabold tracking-tight text-white">
                District <Crown size={16} className="text-[#FBBF24]" />
              </p>
              <p className="mt-0.5 text-[12.5px] text-white/60">{t("rewards.trader")} · {rankLabel}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
          <p className="text-[12px] font-semibold text-white/50">
            {t("rewards.showing")} <span className="num font-bold text-white">{visibleCount}</span> {t("rewards.of")}{" "}
            <span className="num font-bold text-white">{metrics.length}</span>
          </p>
          <span className="text-[12px] font-semibold text-white/50">{t("rewards.metricsOnProfile")}</span>
        </div>
      </Card>

      {/* ── Таблица лидеров ── */}
      <Card className="animate-in animate-delay-1 overflow-hidden p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-violet" />
            <h2 className="text-[15px] font-extrabold tracking-tight text-text-1">{t("page.rewards.leaderboard.t")}</h2>
          </div>
          <span className="pill pill-neutral">
            {lb?.total ?? "…"} {t("page.rewards.leaderboard.participants")}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-card-border text-[10.5px] font-bold uppercase tracking-wider text-text-3">
                <th className="py-2 pr-2">#</th>
                <th className="py-2 pr-3">{t("page.rewards.col.trader")}</th>
                <th className="py-2 pr-4">{t("page.rewards.col.score")}</th>
                <th className="py-2 pr-4">{t("page.rewards.col.winRate")}</th>
                <th className="py-2 pr-4">{t("page.rewards.col.profitFactor")}</th>
                <th className="py-2 pr-4">{t("page.rewards.col.avgR")}</th>
                <th className="py-2 pr-4">{t("page.rewards.col.discipline")}</th>
                <th className="py-2 pr-4">{t("page.rewards.col.volume")}</th>
              </tr>
            </thead>
            <tbody>
              {(lb?.users ?? []).map((u) => renderRow(u, u.id === lb?.me?.id))}
            </tbody>
          </table>
          {!lb && <p className="py-8 text-center text-[13px] text-text-3">{t("rewards.loading")}</p>}
        </div>
      </Card>

      {/* ── Показанные метрики ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {shown.map((m) => (
          <Card key={m.key} className="animate-in p-4">
            <div className="flex items-center justify-between">
              <span className={cn("pill !px-2 !py-0.5 text-[9.5px]", CATEGORY_COLOR[m.category])}>{m.category}</span>
              <Eye size={12} className="text-text-3" />
            </div>
            <p className="num mt-3 text-[18px] font-extrabold leading-none text-text-1">{m.value}</p>
            <p className="mt-1 text-[11px] font-semibold text-text-3">{m.label}</p>
          </Card>
        ))}
      </div>

      {/* ── Кольца ── */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="animate-in animate-delay-2 flex items-center gap-5 p-5">
          <Ring value={stats?.winRate ?? 0} size={92} stroke={8} color="#22C55E">
            <p className="num text-[18px] font-extrabold text-text-1">{(stats?.winRate ?? 0).toFixed(1)}%</p>
          </Ring>
          <div>
            <p className="text-[14px] font-extrabold text-text-1">Win rate</p>
            <p className="mt-1 text-[12.5px] text-text-2">
              {stats?.count ?? 0} {t("rewards.tradesPf")} {(stats?.profitFactor ?? 0).toFixed(2)}
            </p>
          </div>
        </Card>

        <Card className="animate-in animate-delay-3 flex items-center gap-5 p-5">
          <Ring
            value={stats && stats.longCount + stats.shortCount > 0 ? (stats.longCount / (stats.longCount + stats.shortCount)) * 100 : 0}
            size={92}
            stroke={8}
            color="#7C6CF0"
          >
            <p className="num text-[16px] font-extrabold text-text-1">
              {stats?.longCount ?? 0}/{stats?.shortCount ?? 0}
            </p>
          </Ring>
          <div>
            <p className="text-[14px] font-extrabold text-text-1">Trades: Long vs Short</p>
            <p className="mt-1 flex items-center gap-3 text-[12.5px]">
              <span className="flex items-center gap-1 font-bold text-pos">
                <Zap size={13} /> {stats?.longCount ?? 0} Long
              </span>
              <span className="flex items-center gap-1 font-bold text-neg">
                <Gauge size={13} /> {stats?.shortCount ?? 0} Short
              </span>
            </p>
          </div>
        </Card>
      </div>

      {/* ── Кастомизация метрик ── */}
      {customize && <MetricsEditor />}
    </div>
  );
}
