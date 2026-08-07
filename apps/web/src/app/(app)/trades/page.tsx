"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  List,
  LayoutGrid,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  Search,
  Filter,
  Plus,
  Trash2,
} from "lucide-react";
import { MarketIcon } from "@/components/MarketIcon";
import { KpiCard } from "@/components/ui/kpi";
import { Ring } from "@/components/ui/ring";
import { PageHeader } from "@/components/ui/page-header";
import { Modal } from "@/components/ui/modal";
import { TradeDetailModal } from "@/components/TradeDetailModal";
import { TradeLinkModal } from "@/components/TradeLinkModal";
import { TvThumb, TvLightbox } from "@/components/TvThumb";
import { cn, formatMoney, formatR } from "@/lib/utils";
import {
  useTrades,
  useCreateTrade,
  useDeleteTrade,
  type CreateTradeInput,
} from "@/hooks/use-trades";
import { useTradesFilters } from "@/hooks/use-trades-filters";
import { useAccounts } from "@/hooks/use-accounts";
import { useUiStore } from "@/lib/ui-store";
import { useLang } from "@/lib/i18n";
import type { TradeView as Trade } from "@/lib/mappers";

const SESSIONS = ["All", "ASIA", "LONDON", "NEW_YORK"];

const DAY_MS = 24 * 60 * 60 * 1000;
function withinPeriod(date: string, days: number) {
  return new Date(`${date}T00:00:00`).getTime() >= Date.now() - days * DAY_MS;
}

export default function TradesPage() {
  return (
    <Suspense fallback={null}>
      <TradesInner />
    </Suspense>
  );
}

function TradesInner() {
  const view = useUiStore((s) => s.tradesView);
  const setView = useUiStore((s) => s.setTradesView);
  const { t: lang } = useLang();
  const searchParams = useSearchParams();
  const [newOpen, setNewOpen] = useState(() => searchParams.get("new") === "1");
  const [detailIndex, setDetailIndex] = useState(-1);
  const [linkTrade, setLinkTrade] = useState<Trade | null>(null);
  const [lightboxTrade, setLightboxTrade] = useState<Trade | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const create = useCreateTrade();
  const remove = useDeleteTrade();

  const { filters, set: setFilters, reset } = useTradesFilters();
  const { session, account, direction, result, tags, sort, query, period } = filters;

  const { data, isLoading } = useTrades();
  const trades = useMemo(() => data?.items ?? [], [data?.items]);

  const ACCOUNTS = ["All", ...Array.from(new Set(trades.map((t) => t.account)).values())];
  const ALL_TAGS = Array.from(new Set(trades.flatMap((t) => t.tags)).values());

  const filtered = useMemo(() => {
    let list = trades.filter((t) => {
      if (session !== "All" && t.session !== session) return false;
      if (account !== "All" && t.account !== account) return false;
      if (direction !== "all" && t.direction !== direction) return false;
      if (result === "pos" && t.pnl <= 0) return false;
      if (result === "neg" && t.pnl >= 0) return false;
      if (tags.length && !tags.every((tg) => t.tags.includes(tg))) return false;
      if (query && !t.asset.toLowerCase().includes(query.toLowerCase())) return false;
      if (period !== "all") {
        const days = parseInt(period, 10);
        if (!Number.isNaN(days) && !withinPeriod(t.date, days)) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "pnl") return b.pnl - a.pnl;
      if (sort === "r") return b.r - a.r;
      return a.date < b.date ? 1 : -1;
    });
    return list;
  }, [trades, session, account, direction, result, tags, sort, query, period]);

  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const wins = trades.filter((t) => t.pnl > 0).length;
  const winRate = trades.length ? (wins / trades.length) * 100 : 0;
  const avgR = trades.length ? trades.reduce((s, t) => s + t.r, 0) / trades.length : 0;
  const bestTrade = trades.reduce<{ r: number; asset: string } | null>(
    (best, t) => (t.r > (best?.r ?? 0) ? { r: t.r, asset: t.asset } : best),
    null,
  );

  const toggleTag = (tag: string) =>
    setFilters({ tags: tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag] });

  const handleDelete = (trade: Trade) => {
    if (confirmId !== trade.id) {
      setConfirmId(trade.id);
      window.setTimeout(() => setConfirmId((cur) => (cur === trade.id ? null : cur)), 3000);
      return;
    }
    setConfirmId(null);
    remove.mutate(trade.id);
  };

  const hasFilters =
    session !== "All" || account !== "All" || direction !== "all" || result !== "all" || tags.length > 0 || query || period !== "all";

  return (
    <div className="space-y-5">
      <PageHeader
        title={lang("page.trades.t")}
        subtitle={lang("page.trades.s")}
        actions={
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setNewOpen(true)} className="btn btn-primary">
              <Plus size={15} /> {lang("trades.new.add")}
            </button>
            <div className="pill-control">
              <button type="button" onClick={() => setView("list")} className={cn(view === "list" && "active")}>
                <List size={15} className="inline" />
              </button>
              <button type="button" onClick={() => setView("calendar")} className={cn(view === "calendar" && "active")}>
                <CalendarDays size={15} className="inline" />
              </button>
              <button type="button" onClick={() => setView("gallery")} className={cn(view === "gallery" && "active")}>
                <LayoutGrid size={15} className="inline" />
              </button>
            </div>
          </div>
        }
      />

      {/* ── KPI ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          tone="hero"
          label={lang("dashboard.kpi.pnl")}
          value={formatMoney(totalPnl)}
          sub={`${trades.length} ${lang("trades.kpi.tradesSub")}`}
          className="animate-in"
        />
        <KpiCard
          label={lang("dashboard.kpi.winrate")}
          value={`${winRate.toFixed(1)}%`}
          icon={<Ring value={winRate} size={38} stroke={4} color="#22C55E" />}
          sub={`${wins} ${lang("trades.detail.of")} ${trades.length} ${lang("trades.kpi.winsProfit")}`}
          className="animate-in animate-delay-1"
        />
        <KpiCard
          label={lang("dashboard.kpi.avgR")}
          value={formatR(avgR)}
          sub={bestTrade ? `${lang("trades.kpi.bestR")} ${formatR(bestTrade.r)} · ${bestTrade.asset}` : lang("trades.kpi.noTrades")}
          className="animate-in animate-delay-2"
        />
        <KpiCard
          label={lang("trades.kpi.count")}
          value={String(trades.length)}
          sub={lang("trades.kpi.countSub")}
          className="animate-in animate-delay-3"
        />
      </div>

      {/* ── Фильтры ── */}
      <div className="card animate-in animate-delay-1 space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-text-3">
            <Filter size={13} /> {lang("trades.view.filters")}
          </span>

          <select value={account} onChange={(e) => setFilters({ account: e.target.value })} className="chip !pr-8">
            {ACCOUNTS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>

          <select value={session} onChange={(e) => setFilters({ session: e.target.value })} className="chip !pr-8">
            {SESSIONS.map((s) => (
              <option key={s} value={s}>
                {s === "All" ? "All" : lang(`trades.session.${s}`)}
              </option>
            ))}
          </select>

          <div className="relative">
            <select
              value={direction}
              onChange={(e) => setFilters({ direction: e.target.value })}
              className="chip !pr-8 appearance-none"
            >
              <option value="all">{lang("trades.detail.direction")}</option>
              <option value="long">Long</option>
              <option value="short">Short</option>
            </select>
          </div>

          <select value={result} onChange={(e) => setFilters({ result: e.target.value })} className="chip !pr-8">
            <option value="all">{lang("trades.detail.result")}</option>
            <option value="pos">{lang("trades.view.profitable")}</option>
            <option value="neg">{lang("trades.view.losing")}</option>
          </select>

          <select value={sort} onChange={(e) => setFilters({ sort: e.target.value })} className="chip !pr-8">
            <option value="date">{lang("trades.view.sortDate")}</option>
            <option value="pnl">{lang("trades.view.sortPnl")}</option>
            <option value="r">{lang("trades.view.sortR")}</option>
          </select>

          <select value={period} onChange={(e) => setFilters({ period: e.target.value })} className="chip !pr-8">
            <option value="all">{lang("trades.period.all")}</option>
            <option value="7">{lang("trades.period.7d")}</option>
            <option value="30">{lang("trades.period.30d")}</option>
            <option value="90">{lang("trades.period.90d")}</option>
          </select>

          <div className="relative min-w-[160px]">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
            <input
              value={query}
              onChange={(e) => setFilters({ query: e.target.value })}
              placeholder={lang("trades.view.searchPlaceholder")}
              className="field !py-2 !pl-9"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {ALL_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={cn("chip !py-1.5 !text-[12px]", tags.includes(tag) && "active")}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-card-border pt-3">
          <span className="text-[12.5px] font-semibold text-text-2">
            {lang("trades.view.showing")} <span className="num font-bold text-text-1">{filtered.length}</span>{" "}
            {lang("trades.detail.of")}{" "}
            <span className="num font-bold text-text-1">{trades.length}</span>
          </span>
          {hasFilters && (
            <button type="button" onClick={reset} className="btn btn-ghost !px-3 !py-1.5 text-[12.5px]">
              <RotateCcw size={13} /> {lang("trades.view.reset")}
            </button>
          )}
        </div>
      </div>

      {/* ── Режимы отображения ── */}
      {view === "gallery" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t, i) => (
            <TradeCard
              key={t.id}
              trade={t}
              index={i}
              onSelect={() => setDetailIndex(i)}
              onOpenLink={setLinkTrade}
              onPreview={setLightboxTrade}
              confirmId={confirmId}
              onDelete={handleDelete}
            />
          ))}
          {filtered.length === 0 && <EmptyFiltered />}
        </div>
      )}

      {view === "list" && (
        <div className="card animate-in overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-card-border text-[11px] font-bold uppercase tracking-[0.08em] text-text-3">
                <th className="px-4 py-3">{lang("trades.detail.asset")}</th>
                <th className="px-4 py-3">{lang("trades.col.date")}</th>
                <th className="px-4 py-3">{lang("trades.detail.session")}</th>
                <th className="px-4 py-3 text-right">P/L</th>
                <th className="px-4 py-3 text-right">R</th>
                <th className="px-4 py-3">{lang("trades.detail.accounts")}</th>
                <th className="px-4 py-3">{lang("trades.col.status")}</th>
                <th className="px-4 py-3 text-right">{lang("streams.link")}</th>
                <th className="px-4 py-3 text-right">{lang("trades.col.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr
                  key={t.id}
                  onClick={() => setDetailIndex(i)}
                  className="cursor-pointer border-b border-card-border last:border-0 transition-colors hover:bg-bg/60"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <AssetAvatar trade={t} />
                      <span className="num text-[13px] font-bold text-text-1">{t.asset}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-text-2">{t.dateLabel}</td>
                  <td className="px-4 py-3">
                    <span className="pill pill-neutral">{lang(`trades.session.${t.session}`)}</span>
                  </td>
                  <td className={cn("num px-4 py-3 text-right text-[13px] font-bold", t.pnl >= 0 ? "text-pos" : "text-neg")}>
                    {formatMoney(t.pnl)}
                  </td>
                  <td className={cn("num px-4 py-3 text-right text-[13px] font-bold", t.r >= 0 ? "text-pos" : "text-neg")}>
                    {formatR(t.r)}
                  </td>
                  <td className="px-4 py-3 text-[12.5px] text-text-2">{t.account}</td>
                  <td className="px-4 py-3">
                    <span className={cn("pill", t.pnl >= 0 ? "pill-pos" : "pill-neg")}>
                      {t.pnl >= 0 ? lang("trades.detail.win") : lang("trades.detail.loss")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {t.link ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLinkTrade(t);
                        }}
                        className="btn btn-ghost !px-3 !py-1 text-[12px]"
                      >
                        Go
                      </button>
                    ) : (
                      <span className="text-[12.5px] text-text-3">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      title={confirmId === t.id ? lang("trades.delete.confirm") : lang("trades.delete.t")}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(t);
                      }}
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                        confirmId === t.id ? "bg-neg/15 text-neg" : "text-text-3 hover:bg-bg hover:text-neg",
                      )}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <EmptyFiltered />}
        </div>
      )}

      {view === "calendar" && <CalendarView trades={filtered} />}

      {isLoading && trades.length === 0 && (
        <div className="card flex items-center justify-center py-14 text-[13px] font-semibold text-text-3">
          {lang("trades.loading")}
        </div>
      )}

      <NewTradeModal open={newOpen} onClose={() => setNewOpen(false)} create={create} />

      <TradeDetailModal
        trades={filtered}
        index={detailIndex}
        onClose={() => setDetailIndex(-1)}
        onNavigate={setDetailIndex}
        onOpenLink={setLinkTrade}
        onPreview={setLightboxTrade}
        onDelete={(trade) => {
          handleDelete(trade);
          setDetailIndex(-1);
        }}
      />

      <TradeLinkModal trade={linkTrade} onClose={() => setLinkTrade(null)} />

      <TvLightbox trade={lightboxTrade} onClose={() => setLightboxTrade(null)} />
    </div>
  );
}

function NewTradeModal({
  open,
  onClose,
  create,
}: {
  open: boolean;
  onClose: () => void;
  create: ReturnType<typeof useCreateTrade>;
}) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asset, setAsset] = useState("");
  const [direction, setDirection] = useState("LONG");
  const [entry, setEntry] = useState("");
  const [exit, setExit] = useState("");
  const [lots, setLots] = useState("");
  const [pnl, setPnl] = useState("");
  const [rMultiplier, setRMultiplier] = useState("");
  const [session, setSession] = useState("LONDON");
  const [notes, setNotes] = useState("");
  const [link, setLink] = useState("");
  const [accountId, setAccountId] = useState("");
  const accounts = useAccounts();
  const { t } = useLang();

  const num = (v: string) => (v.trim() === "" ? undefined : Number(v.replace(",", ".")));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!asset.trim()) {
      setError(t("trades.new.assetError"));
      return;
    }
    const input: CreateTradeInput = {
      asset: asset.trim().toUpperCase(),
      direction: direction as "LONG" | "SHORT",
      entry: num(entry),
      exit: num(exit),
      lots: num(lots),
      pnl: num(pnl),
      rMultiplier: num(rMultiplier),
      session: session as "ASIA" | "LONDON" | "NEW_YORK",
      notes: notes.trim() || undefined,
      link: link.trim() || undefined,
      accountId: accountId || undefined,
    };
    create.mutate(input, {
      onSuccess: () => {
        setSaved(true);
        setTimeout(() => {
          setSaved(false);
          setAsset("");
          setEntry("");
          setExit("");
          setLots("");
          setPnl("");
          setRMultiplier("");
          setNotes("");
          setLink("");
          setAccountId("");
          onClose();
        }, 1200);
      },
      onError: (err) => setError(err instanceof Error ? err.message : t("trades.new.error")),
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={t("trades.new.add")} wide>
      {saved ? (
        <div className="flex flex-col items-center py-8">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-pos-bg text-pos">
            <CheckSquare size={22} />
          </span>
          <p className="text-[15px] font-extrabold text-text-1">{t("trades.new.added")}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="field-label">{t("trades.detail.asset")}</label>
              <input
                className="field"
                placeholder="XAUUSD"
                required
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">{t("trades.detail.direction")}</label>
              <select className="field" value={direction} onChange={(e) => setDirection(e.target.value)}>
                <option value="LONG">Long</option>
                <option value="SHORT">Short</option>
              </select>
            </div>
          </div>
          <div>
            <label className="field-label">{t("trades.detail.accounts")}</label>
            <select className="field" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              <option value="">{t("trades.new.noAccount")}</option>
              {accounts.data?.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="field-label">{t("trades.detail.entry")}</label>
              <input className="field num" placeholder="0.0000" value={entry} onChange={(e) => setEntry(e.target.value)} />
            </div>
            <div>
              <label className="field-label">{t("trades.detail.exit")}</label>
              <input className="field num" placeholder="0.0000" value={exit} onChange={(e) => setExit(e.target.value)} />
            </div>
            <div>
              <label className="field-label">{t("trades.detail.lots")}</label>
              <input className="field num" placeholder="1.0" value={lots} onChange={(e) => setLots(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="field-label">P/L</label>
              <input className="field num" placeholder="+1240" value={pnl} onChange={(e) => setPnl(e.target.value)} />
            </div>
            <div>
              <label className="field-label">R</label>
              <input className="field num" placeholder="2.4" value={rMultiplier} onChange={(e) => setRMultiplier(e.target.value)} />
            </div>
            <div>
              <label className="field-label">{t("trades.detail.session")}</label>
              <select className="field" value={session} onChange={(e) => setSession(e.target.value)}>
                <option value="ASIA">{t("trades.session.ASIA")}</option>
                <option value="LONDON">{t("trades.session.LONDON")}</option>
                <option value="NEW_YORK">{t("trades.session.NEW_YORK")}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="field-label">{t("trades.detail.notes")}</label>
            <textarea
              className="field min-h-[80px] resize-none"
              placeholder={t("trades.new.notesPlaceholder")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">{t("trades.link.t")}</label>
            <input
              className="field"
              placeholder="https://www.tradingview.com/x/…"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
            {link.trim() && <TvThumb link={link} className="mt-2" />}
          </div>
          {error && (
            <p className="rounded-xl bg-neg/10 px-3.5 py-2.5 text-[12.5px] font-semibold text-neg">{error}</p>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              {t("ideas.cancel")}
            </button>
            <button type="submit" className="btn btn-primary">
              {t("trades.new.add")}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function AssetAvatar({ trade, size = "md" }: { trade: Trade; size?: "md" | "lg" }) {
  return <MarketIcon symbol={trade.asset} size={size === "lg" ? 44 : 36} />;
}

function TradeCard({
  trade,
  index,
  onSelect,
  onOpenLink,
  onPreview,
  confirmId,
  onDelete,
}: {
  trade: Trade;
  index: number;
  onSelect: () => void;
  onOpenLink: (trade: Trade) => void;
  onPreview: (trade: Trade) => void;
  confirmId: string | null;
  onDelete: (trade: Trade) => void;
}) {
  const { t } = useLang();
  const win = trade.pnl >= 0;
  return (
    <div
      onClick={onSelect}
      className="card card-hover animate-in relative cursor-pointer p-4"
      style={{ animationDelay: `${Math.min(index, 5) * 0.04}s` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <AssetAvatar trade={trade} />
          <div>
            <p className="num text-[14px] font-extrabold leading-tight text-text-1">{trade.asset}</p>
            <p className="text-[11.5px] font-semibold text-text-3">
              {trade.dateLabel} {trade.flagged && `· ${t("trades.card.flagged")}`}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "pill",
            trade.direction === "long" ? "pill-pos" : "pill-neg",
          )}
        >
          {trade.direction === "long" ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {trade.direction === "long" ? "Long" : "Short"}
        </span>
      </div>

      {trade.link && (
        <div className="mt-3">
          <TvThumb
            link={trade.link}
            onClick={(e) => {
              e.stopPropagation();
              onPreview(trade);
            }}
          />
        </div>
      )}

      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="label-caps mb-1">P/L</p>
          <p className={cn("num text-[20px] font-extrabold leading-none", win ? "text-pos" : "text-neg")}>
            {formatMoney(trade.pnl)}
          </p>
        </div>
        <span className={cn("pill num text-[12.5px]", win ? "pill-pos" : "pill-neg")}>{formatR(trade.r)}</span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-card-border pt-3">
        <div className="flex items-center gap-1.5">
          <span className="pill pill-teal">{t(`trades.session.${trade.session}`)}</span>
          <span className="pill pill-neutral">{trade.account}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {trade.link && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenLink(trade);
              }}
              className="btn btn-ghost !px-2.5 !py-0.5 text-[11.5px]"
            >
              Go
            </button>
          )}
          <button
            type="button"
            title={confirmId === trade.id ? t("trades.delete.confirm") : t("trades.delete.t")}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(trade);
            }}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-lg transition-colors",
              confirmId === trade.id ? "bg-neg/15 text-neg" : "text-text-3 hover:bg-bg hover:text-neg",
            )}
          >
            <Trash2 size={13} />
          </button>
          <span className={cn("pill", win ? "pill-pos" : "pill-neg")}>
            {win ? t("trades.detail.win") : t("trades.detail.loss")}
          </span>
        </div>
      </div>
    </div>
  );
}

function compactVal(n: number): string {
  const abs = Math.abs(n);
  const sign = n >= 0 ? "+" : "-";
  if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${sign}${Math.round(abs)}`;
}

function CalendarView({ trades }: { trades: Trade[] }) {
  const { t, lang } = useLang();
  const locale = lang === "ru" ? "ru-RU" : "en-US";
  const [scale, setScale] = useState<"month" | "week">("month");
  const [winFilter, setWinFilter] = useState<"all" | "pos" | "neg">("all");
  const [cursor, setCursor] = useState(() => new Date());

  const byDay = useMemo(() => {
    const map = new Map<string, Trade[]>();
    for (const tr of trades) {
      map.set(tr.date, [...(map.get(tr.date) ?? []), tr]);
    }
    return map;
  }, [trades]);

  const go = (delta: number) =>
    setCursor((c) => {
      if (scale === "week") {
        return new Date(c.getFullYear(), c.getMonth(), c.getDate() + delta * 7);
      }
      return new Date(c.getFullYear(), c.getMonth() + delta, 1);
    });

  const matches = (total: number) =>
    winFilter === "all" ? true : winFilter === "pos" ? total >= 0 : total < 0;

  let title = "";
  const cells: ({ key: string; label: string; date: string } | null)[] = [];
  let weekTrades: Trade[] = [];

  if (scale === "month") {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const firstWeekday = (new Date(y, m, 1).getDay() + 6) % 7;
    const raw = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(new Date(y, m, 1));
    title = raw.charAt(0).toUpperCase() + raw.slice(1);
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ key: date, label: String(d), date });
    }
  } else {
    const dayOfWeek = cursor.getDay();
    const monday = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - ((dayOfWeek + 6) % 7));
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
    try {
      const fmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" });
      title = fmt.formatRange(monday, sunday);
    } catch {
      title = `${monday.getDate()}.${monday.getMonth() + 1} - ${sunday.getDate()}.${sunday.getMonth() + 1}`;
    }
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      cells.push({ key: date, label: String(d.getDate()), date });
    }
    weekTrades = cells.flatMap((c) => (c ? byDay.get(c.date) ?? [] : []));
  }

  const weekTotal = weekTrades.reduce((s, tr) => s + tr.pnl, 0);

  return (
    <div className="animate-in">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label={scale === "week" ? "Previous week" : "Previous month"}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-2 transition-colors hover:bg-bg"
          >
            <ChevronLeft size={15} />
          </button>
          <h3 className="min-w-[170px] px-1 text-center text-[15px] font-extrabold text-text-1">{title}</h3>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label={scale === "week" ? "Next week" : "Next month"}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-2 transition-colors hover:bg-bg"
          >
            <ChevronRight size={15} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="pill-control mr-1">
            <button
              type="button"
              onClick={() => setScale("month")}
              className={cn(scale === "month" && "active")}
            >
              {t("trades.calendar.month")}
            </button>
            <button
              type="button"
              onClick={() => setScale("week")}
              className={cn(scale === "week" && "active")}
            >
              {t("trades.calendar.week")}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setWinFilter((w) => (w === "pos" ? "all" : "pos"))}
            aria-pressed={winFilter === "pos"}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11.5px] font-semibold text-text-2 transition-colors",
              winFilter === "pos" ? "bg-[rgba(34,197,94,0.14)] text-pos" : "hover:bg-bg",
            )}
          >
            <span className="h-3 w-3 rounded-md bg-[rgba(34,197,94,0.18)] ring-1 ring-pos/40" /> {t("trades.calendar.profit")}
          </button>
          <button
            type="button"
            onClick={() => setWinFilter((w) => (w === "neg" ? "all" : "neg"))}
            aria-pressed={winFilter === "neg"}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11.5px] font-semibold text-text-2 transition-colors",
              winFilter === "neg" ? "bg-[rgba(239,68,68,0.14)] text-neg" : "hover:bg-bg",
            )}
          >
            <span className="h-3 w-3 rounded-md bg-[rgba(239,68,68,0.15)] ring-1 ring-neg/40" /> {t("trades.calendar.loss")}
          </button>
        </div>
      </div>
      <div className="card p-4">
        <div className="grid grid-cols-7 gap-1.5">
          {["mo", "tu", "we", "th", "fr", "sa", "su"].map((d) => (
            <div key={d} className="pb-1 text-center text-[11px] font-bold uppercase tracking-wide text-text-3">
              {t(`trades.calendar.${d}`)}
            </div>
          ))}
          {cells.map((c, i) => {
            if (!c) return <div key={`blank-${i}`} />;
            const dayTrades = byDay.get(c.date);
            const total = dayTrades?.reduce((s, tr) => s + tr.pnl, 0) ?? 0;
            const shown = dayTrades && matches(total);
            return (
              <div
                key={c.key}
                title={dayTrades ? `${c.date}: ${dayTrades.length} ${t("trades.calendar.trades")}` : undefined}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center rounded-xl border text-[12px] font-bold transition-colors",
                  !shown
                    ? "border-transparent text-text-3"
                    : total >= 0
                      ? "border-pos/30 bg-[rgba(34,197,94,0.12)] text-pos hover:bg-[rgba(34,197,94,0.18)]"
                      : "border-neg/30 bg-[rgba(239,68,68,0.10)] text-neg hover:bg-[rgba(239,68,68,0.16)]",
                )}
              >
                {c.label}
                {shown && (
                  <span className={cn("num text-[9.5px] leading-none", total >= 0 ? "text-pos" : "text-neg")}>
                    {compactVal(total)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {scale === "week" && (
          <div className="mt-3 flex items-center justify-between border-t border-card-border pt-3 text-[12.5px] font-semibold text-text-2">
            <span>
              {weekTrades.length} {t("trades.calendar.trades")}
            </span>
            <span className="flex items-center gap-2">
              {t("trades.calendar.weekTotal")}
              <span className={cn("num text-[14px] font-extrabold", weekTotal >= 0 ? "text-pos" : "text-neg")}>
                {formatMoney(weekTotal)}
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyFiltered() {
  const { t } = useLang();
  return (
    <div className="col-span-full card flex flex-col items-center py-14 text-center">
      <ChevronDown className="mb-3 h-8 w-8 rotate-180 text-text-3" />
      <p className="text-[14px] font-extrabold text-text-1">{t("trades.view.emptyT")}</p>
      <p className="mt-1 text-[12.5px] text-text-2">{t("trades.view.emptyS")}</p>
    </div>
  );
}
