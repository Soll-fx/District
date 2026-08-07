"use client";

import { useState } from "react";
import { Globe2, ChevronRight, ChevronDown, Check, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { MarketIcon } from "@/components/MarketIcon";
import { Card } from "@/components/ui/card";
import { AdvancedKpiGrid } from "@/components/ui/advanced-stats";
import { DashboardEquityCard } from "@/components/ui/dashboard-equity";
import { TimelineAnimation } from "@/components/ui/advanced-stats-utils/timeline-animation";
import { cn, formatMoney, pluralRu } from "@/lib/utils";
import { timeLabel } from "@/lib/mappers";
import { useTradeStats, useTrades } from "@/hooks/use-trades";
import { useNews } from "@/hooks/use-news";
import { useGeopolitics } from "@/hooks/use-geopolitics";
import { useLang } from "@/lib/i18n";
import { useSessions } from "@/hooks/use-sessions";
import { useAuth } from "@/lib/auth-store";
import { regionKey } from "@/lib/sessions";

function formatPnl(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toLocaleString("ru-RU", { maximumFractionDigits: 0 })} $`;
}

function relTime(iso: string, lang: string) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  if (Number.isNaN(diff)) return iso;
  if (diff < 60_000) return lang === "ru" ? "только что" : "just now";
  const min = Math.floor(diff / 60_000);
  if (min < 60) return lang === "ru" ? `${min} мин назад` : `${min} min ago`;
  const h = Math.floor(diff / 3_600_000);
  if (h < 24) return lang === "ru" ? `${h} ${pluralRu(h, "час", "часа", "часов")} назад` : `${h} ${h === 1 ? "hour" : "hours"} ago`;
  const d = Math.floor(diff / 86_400_000);
  return lang === "ru" ? `${d} ${pluralRu(d, "день", "дня", "дней")} назад` : `${d} ${d === 1 ? "day" : "days"} ago`;
}

const INSTRUMENT_ORDER = [
  "USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "NZD", "CNY", "RUB",
  "GER40", "US500", "UK100", "NAS100", "JP225",
];
const IMPACT_WEIGHT: Record<string, number> = { high: 0, medium: 1, low: 2 };

export default function DashboardPage() {
  const [impactFilter, setImpactFilter] = useState<"high" | "all">("all");
  const [instrumentFilter, setInstrumentFilter] = useState("all");
  const [instrOpen, setInstrOpen] = useState(false);
  const [openPost, setOpenPost] = useState<string | null>(null);
  const { t, lang } = useLang();
  const user = useAuth((s) => s.user);
  const { sessions, active, nextOpen, countdown } = useSessions();

  const { data: stats } = useTradeStats();
  const { data: tradesData } = useTrades();
  const recentTrades = [...(tradesData?.items ?? [])]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);
  const { data: news } = useNews();
  const { data: geoPosts } = useGeopolitics(lang);

  const allGeo = geoPosts ?? [];

  const allNews = news ?? [];
  const instruments = Array.from(new Set(allNews.map((n) => n.instrument))).sort(
    (a, b) =>
      (INSTRUMENT_ORDER.indexOf(a) < 0 ? 99 : INSTRUMENT_ORDER.indexOf(a)) -
      (INSTRUMENT_ORDER.indexOf(b) < 0 ? 99 : INSTRUMENT_ORDER.indexOf(b)),
  );
  const visibleNews = allNews
    .filter(
      (n) =>
        (impactFilter === "all" || n.impact === impactFilter) &&
        (instrumentFilter === "all" || n.instrument === instrumentFilter),
    )
    .sort(
      (a, b) =>
        IMPACT_WEIGHT[a.impact] - IMPACT_WEIGHT[b.impact] || (a.time ?? "").localeCompare(b.time ?? ""),
    );
  const kpiNews = allNews.filter((n) => n.impact === "high").length;
  const hiddenNews = allNews.length - visibleNews.length;

  return (
    <div className="space-y-5">
      {/* ── Приветствие ── */}
      <div className="animate-in pt-2">
        <h1 className="text-[22px] font-extrabold tracking-tight text-text-1">
          {t("dashboard.hello").replace("{name}", user?.name ?? "")}
        </h1>
        <p className="mt-1 text-[13px] font-semibold text-text-3">{t("dashboard.sub")}</p>
      </div>

      {/* ── KPI в стиле Advanced Stats ── */}
      <TimelineAnimation delay={80}>
        <AdvancedKpiGrid />
      </TimelineAnimation>

      {/* ── Кривая капитала + Новости ── */}
      <section className="grid gap-5 lg:grid-cols-3">
        <DashboardEquityCard className="min-h-[300px] lg:col-span-2 lg:min-h-[420px]" />

        {/* Новости */}
        <Card className="flex h-[300px] flex-col overflow-hidden p-5 lg:h-[420px]">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="live-dot absolute h-full w-full rounded-full bg-neg" />
              </span>
              <h2 className="text-[15px] font-extrabold tracking-tight text-text-1">{t("dashboard.news.t")}</h2>
            </div>
            <span className="pill pill-neg">{t("geopolitics.live")}</span>
          </div>

          <div className="relative mb-3 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setImpactFilter("all");
                setInstrOpen((v) => !v);
              }}
              className={cn("chip", impactFilter === "all" && "active")}
              aria-haspopup="listbox"
              aria-expanded={instrOpen}
            >
              {impactFilter === "all" && instrumentFilter !== "all" ? instrumentFilter : "All impacts"}
              <ChevronDown size={13} className={cn("transition-transform duration-200", instrOpen && "rotate-180")} />
            </button>
            <button
              type="button"
              onClick={() => {
                setImpactFilter("high");
                setInstrumentFilter("all");
                setInstrOpen(false);
              }}
              className={cn("chip", impactFilter === "high" && "active")}
            >
              High impact · {kpiNews}
            </button>

            {instrOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setInstrOpen(false)} />
                <div
                  role="listbox"
                  className="absolute left-0 top-full z-20 mt-1 max-h-52 w-44 overflow-y-auto rounded-xl border border-card-border bg-card p-1.5 shadow-xl"
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={instrumentFilter === "all"}
                    onClick={() => {
                      setInstrumentFilter("all");
                      setInstrOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors",
                      instrumentFilter === "all" ? "bg-text-1 text-bg" : "text-text-2 hover:bg-bg",
                    )}
                  >
                    {t("dashboard.news.all")}
                    {instrumentFilter === "all" && <Check size={13} />}
                  </button>
                  {instruments.map((ins) => (
                    <button
                      key={ins}
                      type="button"
                      role="option"
                      aria-selected={instrumentFilter === ins}
                      onClick={() => {
                        setInstrumentFilter(ins);
                        setInstrOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors",
                        instrumentFilter === ins ? "bg-text-1 text-bg" : "text-text-2 hover:bg-bg",
                      )}
                    >
                      <MarketIcon symbol={ins} size={16} />
                      <span className="flex-1 text-left">{ins}</span>
                      {instrumentFilter === ins && <Check size={13} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
            {visibleNews.map((n) => (
              <div
                key={n.id}
                className="flex items-center gap-2.5 rounded-xl border border-transparent bg-card px-3 py-2.5 transition-colors hover:bg-bg"
              >
                <span
                  className={cn(
                    "h-8 w-1 shrink-0 rounded-full",
                    n.impact === "high" ? "bg-neg" : n.impact === "medium" ? "bg-orange" : "bg-neutral/25",
                  )}
                />
                <MarketIcon symbol={n.instrument} size={30} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-bold text-text-1">{n.title}</p>
                  <p className="mt-0.5 text-[11px] text-text-3">
                    <span className="num font-semibold text-text-2">{n.time}</span> ·{" "}
                    {t("dashboard.news.actual")} {n.prev} · {t("dashboard.news.forecast")} {n.forecast}
                  </p>
                </div>
                <span
                  className={cn(
                    "pill shrink-0",
                    n.impact === "high" ? "pill-neg" : n.impact === "medium" ? "pill-orange" : "pill-neutral",
                  )}
                >
                  {n.impact}
                </span>
              </div>
            ))}
            {visibleNews.length === 0 && (
              <p className="px-2 py-6 text-center text-[13px] text-text-3">
                {t("dashboard.news.empty")}
              </p>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-card-border pt-3">
            <span className="text-[11px] font-semibold text-text-3">Forex Factory</span>
            <span className="num text-[11px] font-semibold text-text-3">
              {visibleNews.length} {t("dashboard.news.events")} · {hiddenNews} {t("dashboard.news.hidden")}
            </span>
          </div>
        </Card>
      </section>

      {/* ── Геополитика + Сессии ── */}
      <section className="grid gap-5 lg:grid-cols-3">
        <Card className="animate-in animate-delay-3 !border-0 flex h-[460px] flex-col overflow-hidden p-5 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Globe2 size={16} className="text-text-2" />
            <h2 className="text-[15px] font-extrabold tracking-tight text-text-1">{t("geopolitics.t")}</h2>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {allGeo.map((g) => (
              <div
                key={g.id}
                className="rounded-xl px-4 py-3 transition-colors hover:bg-bg"
              >
                <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      {g.emoji && <span className="text-[13px] leading-none">{g.emoji}</span>}
                      <span className="label-caps">{g.region}</span>
                    </div>
                    <p className="truncate text-[13.5px] font-bold text-text-1">{g.title}</p>
                    <p className="mt-0.5 text-[11.5px] text-text-3">
                      {g.source} · {timeLabel(g.createdAt)}
                    </p>
                    {openPost === g.id && <p className="mt-2 text-[12.5px] leading-relaxed text-text-2">{g.body}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {g.tags.map((tag) => (
                        <span key={tag} className="pill pill-neutral !px-2 !py-0.5 text-[10.5px]">
                          {tag}
                        </span>
                      ))}
                      <button
                        type="button"
                        onClick={() => setOpenPost(openPost === g.id ? null : g.id)}
                        className="ml-auto text-[11px] font-bold text-violet hover:underline"
                      >
                        {openPost === g.id ? t("geopolitics.collapse") : t("geopolitics.readMore")}
                      </button>
                    </div>
                  </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="animate-in animate-delay-4 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-extrabold tracking-tight text-text-1">{t("dashboard.sessions.t")}</h2>
            {active && <span className="pill pill-teal">{t("dashboard.sessions.region." + regionKey(active))} {t("dashboard.sessions.active")}</span>}
          </div>
          <div className="space-y-4">
            {sessions.map((s) => (
              <div key={s.key}>
                <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
                  <span className="flex items-center gap-1.5 font-bold text-text-1">
                    {s.active && <span className="live-dot h-2 w-2 rounded-full bg-pos" />}
                    {t(`dashboard.sessions.region.${regionKey(s.key)}`)}
                  </span>
                  <span className="num font-semibold text-text-3">
                    {s.open}–{s.close}
                  </span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-neutral/6">
                  <div
                    className={cn("h-full rounded-full", s.active ? "bg-pos" : "bg-neutral/15")}
                    style={{ width: s.active ? `${s.progress}%` : "100%" }}
                  />
                </div>
              </div>
            ))}
          </div>
          {nextOpen && (
            <div className="mt-5 border-t border-card-border pt-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-text-3">
                  {t(`dashboard.sessions.region.${regionKey(nextOpen.key)}`)} {t("dashboard.sessions.nextOpen")}
                </span>
                <span className="num text-[13px] font-bold text-text-1">{countdown}</span>
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* ── Недавние сделки ── */}
      <Card className="animate-in animate-delay-2 overflow-hidden p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-extrabold tracking-tight text-text-1">{t("dashboard.recentTrades.t")}</h2>
          <a href="/trades" className="pill pill-neutral transition-colors hover:bg-neutral/15">
            {t("dashboard.recentTrades.all")}
          </a>
        </div>

        <div className="space-y-2">
          {recentTrades.map((trade) => {
            const win = trade.pnl >= 0;
            return (
              <div
                key={trade.id}
                className="flex items-center gap-3 rounded-xl border border-card-border bg-card p-3 transition-colors hover:bg-bg"
              >
                <MarketIcon symbol={trade.asset} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="num truncate text-[13.5px] font-extrabold text-text-1">{trade.asset}</span>
                    <span className={cn("pill !px-2 !py-0.5 text-[10px]", trade.direction === "long" ? "pill-pos" : "pill-neg")}>
                      {trade.direction === "long" ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                      {trade.direction === "long" ? "LONG" : "SHORT"}
                    </span>
                    <span className="pill num !px-2 !py-0.5 text-[10px]">R {trade.r.toFixed(2)}</span>
                  </div>
                  <p className="mt-1 text-[11px] font-semibold text-text-3">{relTime(trade.createdAt, lang)}</p>
                </div>
                <span className={cn("num text-[15px] font-extrabold", win ? "text-pos" : "text-neg")}>
                  {formatPnl(trade.pnl)}
                </span>
              </div>
            );
          })}
          {recentTrades.length === 0 && (
            <p className="py-6 text-center text-[13px] text-text-3">{t("dashboard.recentTrades.empty")}</p>
          )}
        </div>
      </Card>

      {/* ── Быстрый переход в журнал ── */}
      <section className="animate-in animate-delay-5">
        <a
          href="/trades"
          className="card card-hover flex items-center justify-between p-5"
        >
          <div>
            <p className="text-[15px] font-extrabold tracking-tight text-text-1">{t("dashboard.journal.t")}</p>
            <p className="mt-0.5 text-[12.5px] text-text-2">
              {stats?.count ?? 0} {t("dashboard.journal.tradesInJuly")} · {formatMoney(stats?.totalPnl ?? 0)} {t("dashboard.journal.netPnl")} · {t("dashboard.journal.winRate")}{" "}
              {(stats?.winRate ?? 0).toFixed(0)}%
            </p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-hero text-white">
            <ChevronRight size={18} />
          </span>
        </a>
      </section>
    </div>
  );
}
