"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Lightbulb,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Rocket,
  Archive,
  Trash2,
  ChevronDown,
  CheckCheck,
  XCircle,
  Pencil,
  CheckSquare,
  ExternalLink,
} from "lucide-react";
import { MarketIcon } from "@/components/MarketIcon";
import { Card } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi";
import { PageHeader } from "@/components/ui/page-header";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty";
import { TvThumb, TvLightbox } from "@/components/TvThumb";
import { cn } from "@/lib/utils";
import {
  useConvertIdea,
  useCreateIdea,
  useDeleteIdea,
  useIdeas,
  useIdeaStats,
  useUpdateIdea,
  useUpdateIdeaStatus,
} from "@/hooks/use-ideas";
import { useTrade, useUpdateTrade } from "@/hooks/use-trades";
import { useLang } from "@/lib/i18n";
import type { IdeaView as Idea } from "@/lib/mappers";
import type { Trade } from "@/lib/types";

const STATUS = [
  { key: "all", labelKey: "ideas.status.all" },
  { key: "watch", labelKey: "ideas.status.watch" },
  { key: "hit", labelKey: "ideas.status.hit" },
  { key: "invalid", labelKey: "ideas.status.invalid" },
  { key: "archive", labelKey: "ideas.status.archive" },
] as const;

type StatusKey = (typeof STATUS)[number]["key"];

const STATUS_PILL_KEY: Record<string, string> = {
  watch: "ideas.status.watch",
  hit: "ideas.card.hit",
  invalid: "ideas.card.invalid",
  archive: "ideas.status.archive",
};

export default function IdeasPage() {
  const [status, setStatus] = useState<StatusKey>("all");
  const [newOpen, setNewOpen] = useState(false);
  const [preview, setPreview] = useState<{ asset: string; link: string } | null>(null);
  const [editIdea, setEditIdea] = useState<Idea | null>(null);
  const { t } = useLang();

  const { data: stats } = useIdeaStats();
  const { data: ideas = [] } = useIdeas(status);
  const convert = useConvertIdea();
  const updateStatus = useUpdateIdeaStatus();
  const deleteIdea = useDeleteIdea();
  const create = useCreateIdea();
  const updateIdea = useUpdateIdea();
  const updateTrade = useUpdateTrade();

  const counts: Record<string, number> = useMemo(
    () => ({
      all: stats?.total ?? 0,
      watch: stats?.watch ?? 0,
      hit: stats?.hit ?? 0,
      invalid: stats?.invalid ?? 0,
      archive: stats?.archive ?? 0,
    }),
    [stats],
  );

  const visible = ideas;

  const accuracy = stats?.accuracy ?? 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("page.ideas.t")}
        subtitle={t("page.ideas.s")}
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setNewOpen(true)}>
            <Plus size={15} /> {t("ideas.new")}
          </button>
        }
      />

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard tone="hero" label={t("ideas.kpi.total")} value={counts.all} sub={t("ideas.kpi.totalSub")} className="animate-in" />
        <KpiCard label={t("ideas.status.watch")} value={counts.watch} sub={t("ideas.kpi.watchSub")} className="animate-in animate-delay-1" />
        <KpiCard label={t("ideas.status.hit")} value={counts.hit} sub={t("ideas.kpi.hitSub")} className="animate-in animate-delay-2" />
        <KpiCard label={t("ideas.kpi.accuracy")} value={`${Math.round(accuracy)}%`} sub={t("ideas.kpi.accuracySub")} className="animate-in animate-delay-3" />
      </div>

      {/* Статусные вкладки */}
      <div className="animate-in animate-delay-1 flex flex-wrap gap-1.5">
        {STATUS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setStatus(s.key)}
            className={cn("chip", status === s.key && "active")}
          >
            {t(s.labelKey)}
            <span className={cn("num", status === s.key ? "text-white/60" : "text-text-3")}>{counts[s.key]}</span>
          </button>
        ))}
      </div>

      {/* Список идей */}
      {visible.length === 0 ? (
        <EmptyState
          icon={<Lightbulb size={26} />}
          title={t("ideas.empty.t")}
          description={t("ideas.empty.s")}
          action={
            <button type="button" className="btn btn-primary" onClick={() => setNewOpen(true)}>
              <Plus size={15} /> {t("ideas.new")}
            </button>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visible.map((idea, i) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              index={i}
              onPreview={() => idea.tvLink && setPreview({ asset: idea.asset, link: idea.tvLink })}
              onEdit={() => setEditIdea(idea)}
              onConvert={() => convert.mutate({ id: idea.id })}
              onInvalidate={() => updateStatus.mutate({ id: idea.id, status: "INVALID" })}
              onArchive={() => updateStatus.mutate({ id: idea.id, status: "ARCHIVE" })}
              onDelete={() => deleteIdea.mutate({ id: idea.id })}
            />
          ))}
        </div>
      )}

      <NewIdeaModal open={newOpen} onClose={() => setNewOpen(false)} create={create} />
      {editIdea && (
        <EditIdeaModal
          idea={editIdea}
          onClose={() => setEditIdea(null)}
          updateIdea={updateIdea}
          updateTrade={updateTrade}
        />
      )}
      <TvLightbox trade={preview} onClose={() => setPreview(null)} />
    </div>
  );
}

const STATUS_PILL: Record<string, string> = {
  watch: "pill-orange",
  hit: "pill-pos",
  invalid: "pill-neg",
  archive: "pill-neutral",
};

function IdeaCard({
  idea,
  index,
  onPreview,
  onEdit,
  onConvert,
  onInvalidate,
  onArchive,
  onDelete,
}: {
  idea: Idea;
  index: number;
  onPreview: () => void;
  onEdit: () => void;
  onConvert: () => void;
  onInvalidate: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const { t } = useLang();
  return (
    <Card
      className="card-hover animate-in p-4"
    >
      <div
        className="animate-in"
        style={{ animationDelay: `${Math.min(index, 4) * 0.05}s` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MarketIcon symbol={idea.asset} size={36} />
            <div>
              <p className="num text-[14px] font-extrabold leading-tight text-text-1">{idea.asset}</p>
              <p className="text-[11.5px] font-semibold text-text-3">{idea.dateLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={cn("pill", idea.direction === "long" ? "pill-pos" : "pill-neg")}
            >
              {idea.direction === "long" ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {idea.direction === "long" ? "Long" : "Short"}
            </span>
            <span className={cn("pill", STATUS_PILL[idea.status])}>{t(STATUS_PILL_KEY[idea.status])}</span>
            <button type="button" onClick={onEdit} className="flex h-7 w-7 items-center justify-center rounded-lg text-text-3 transition-colors hover:bg-bg hover:text-text-1" title={t("ideas.edit")}>
              <Pencil size={13} />
            </button>
          </div>
        </div>

        <p className="mt-3 text-[13px] leading-relaxed text-text-2">{idea.thesis}</p>

        {idea.tvLink && (
          <div className="mt-3">
            <TvThumb link={idea.tvLink} onClick={onPreview} />
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Level label={t("ideas.entry")} value={idea.entry} />
          <Level label={t("ideas.tp")} value={idea.tp} tone="pos" />
          <Level label={t("ideas.sl")} value={idea.sl} tone="neg" />
        </div>

        {idea.status === "watch" && (
          <div className="mt-4 flex items-center justify-between border-t border-card-border pt-3">
            <button type="button" onClick={onDelete} className="btn btn-ghost !px-3 !py-1.5 text-[12.5px] !text-neg hover:!text-neg">
              <Trash2 size={13} /> {t("ideas.delete")}
            </button>
            <ConvertMenu onConvert={onConvert} onInvalidate={onInvalidate} onArchive={onArchive} />
          </div>
        )}
        {idea.status !== "watch" && (
          <div className="mt-4 flex justify-end border-t border-card-border pt-3">
            <button type="button" onClick={onDelete} className="btn btn-ghost !px-3 !py-1.5 text-[12.5px] !text-neg hover:!text-neg">
              <Trash2 size={13} /> {t("ideas.delete")}
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}

function ConvertMenu({
  onConvert,
  onInvalidate,
  onArchive,
}: {
  onConvert: () => void;
  onInvalidate: () => void;
  onArchive: () => void;
}) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const run = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="btn btn-ghost !px-3 !py-1.5 text-[12.5px]"
      >
        <Rocket size={13} /> {t("ideas.convert")} <ChevronDown size={13} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1.5 w-60 overflow-hidden rounded-xl border border-card-border bg-card p-1 shadow-lg">
          <button
            type="button"
            onClick={run(onConvert)}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[12.5px] font-semibold text-text-1 transition-colors hover:bg-bg"
          >
            <CheckCheck size={14} className="text-pos" /> {t("ideas.convert.hit")}
          </button>
          <button
            type="button"
            onClick={run(onInvalidate)}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[12.5px] font-semibold text-text-1 transition-colors hover:bg-bg"
          >
            <XCircle size={14} className="text-neg" /> {t("ideas.convert.invalid")}
          </button>
          <button
            type="button"
            onClick={run(onArchive)}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[12.5px] font-semibold text-text-1 transition-colors hover:bg-bg"
          >
            <Archive size={14} className="text-text-3" /> {t("ideas.convert.archive")}
          </button>
        </div>
      )}
    </div>
  );
}

function Level({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" }) {
  return (
    <div className="rounded-xl bg-bg px-3 py-2">
      <p className="label-caps">{label}</p>
      <p className={cn("num mt-0.5 text-[13px] font-bold", tone === "pos" ? "text-pos" : tone === "neg" ? "text-neg" : "text-text-1")}>
        {value}
      </p>
    </div>
  );
}

function NewIdeaModal({
  open,
  onClose,
  create,
}: {
  open: boolean;
  onClose: () => void;
  create: ReturnType<typeof useCreateIdea>;
}) {
  const { t } = useLang();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asset, setAsset] = useState("");
  const [direction, setDirection] = useState("LONG");
  const [entry, setEntry] = useState("");
  const [tp, setTp] = useState("");
  const [sl, setSl] = useState("");
  const [thesis, setThesis] = useState("");
  const [tvLink, setTvLink] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    create.mutate(
      {
        asset: asset.trim().toUpperCase(),
        direction: direction as "LONG" | "SHORT",
        entry: entry.trim() || undefined,
        tp: tp.trim() || undefined,
        sl: sl.trim() || undefined,
        thesis: thesis.trim() || undefined,
        tvLink: tvLink.trim() || undefined,
      },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => {
            setSaved(false);
            setAsset("");
            setEntry("");
            setTp("");
            setSl("");
            setThesis("");
            setTvLink("");
            onClose();
          }, 1200);
        },
        onError: (err) => setError(err instanceof Error ? err.message : t("ideas.error")),
      },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title={t("ideas.new")} wide>
      {saved ? (
        <div className="flex flex-col items-center py-8">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-pos-bg text-pos">
            <Archive size={22} />
          </span>
          <p className="text-[15px] font-extrabold text-text-1">{t("ideas.saved")}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="field-label">{t("ideas.asset")}</label>
              <input
                className="field"
                placeholder="XAUUSD"
                required
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">{t("ideas.direction")}</label>
              <select className="field" value={direction} onChange={(e) => setDirection(e.target.value)}>
                <option value="LONG">Long</option>
                <option value="SHORT">Short</option>
              </select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="field-label">{t("ideas.entry")}</label>
              <input className="field num" placeholder="0.0000" value={entry} onChange={(e) => setEntry(e.target.value)} />
            </div>
            <div>
              <label className="field-label">{t("ideas.tp")}</label>
              <input className="field num" placeholder="0.0000" value={tp} onChange={(e) => setTp(e.target.value)} />
            </div>
            <div>
              <label className="field-label">{t("ideas.sl")}</label>
              <input className="field num" placeholder="0.0000" value={sl} onChange={(e) => setSl(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="field-label">{t("ideas.thesis")}</label>
            <textarea
              className="field min-h-[88px] resize-none"
              placeholder={t("ideas.thesisPlaceholder")}
              value={thesis}
              onChange={(e) => setThesis(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">{t("trades.link.t")}</label>
            <input
              className="field"
              placeholder="https://www.tradingview.com/x/…"
              value={tvLink}
              onChange={(e) => setTvLink(e.target.value)}
            />
            {tvLink.trim() && <TvThumb link={tvLink} className="mt-2" />}
          </div>
          {error && (
            <p className="rounded-xl bg-neg/10 px-3.5 py-2.5 text-[12.5px] font-semibold text-neg">{error}</p>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              {t("ideas.cancel")}
            </button>
            <button type="submit" className="btn btn-primary">
              {t("ideas.save")}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function EditIdeaModal({
  idea,
  onClose,
  updateIdea,
  updateTrade,
}: {
  idea: Idea;
  onClose: () => void;
  updateIdea: ReturnType<typeof useUpdateIdea>;
  updateTrade: ReturnType<typeof useUpdateTrade>;
}) {
  const { t } = useLang();
  const { data: linkedTrade } = useTrade(idea.convertedTradeId);
  const isConverted = !!idea.convertedTradeId;

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [asset, setAsset] = useState(idea.asset);
  const [direction, setDirection] = useState(idea.direction.toUpperCase());
  const [entry, setEntry] = useState(idea.entry === "—" ? "" : idea.entry);
  const [tp, setTp] = useState(idea.tp === "—" ? "" : idea.tp);
  const [sl, setSl] = useState(idea.sl === "—" ? "" : idea.sl);
  const [thesis, setThesis] = useState(idea.thesis ?? "");
  const [tvLink, setTvLink] = useState(idea.tvLink ?? "");

  const [exit, setExit] = useState("");
  const [lots, setLots] = useState("");
  const [pnl, setPnl] = useState("");
  const [rMultiplier, setRMult] = useState("");
  const [session, setSession] = useState("LONDON");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (linkedTrade) {
      setExit(linkedTrade.exit != null ? String(linkedTrade.exit) : "");
      setLots(linkedTrade.lots != null ? String(linkedTrade.lots) : "");
      setPnl(String(linkedTrade.pnl ?? ""));
      setRMult(linkedTrade.rMultiplier != null ? String(linkedTrade.rMultiplier) : "");
      setSession(linkedTrade.session ?? "LONDON");
      setNotes(linkedTrade.notes ?? "");
    }
  }, [linkedTrade]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const ideaPayload: Record<string, unknown> = {
      id: idea.id,
      asset: asset.trim().toUpperCase(),
      direction: direction as "LONG" | "SHORT",
      entry: entry.trim() || undefined,
      tp: tp.trim() || undefined,
      sl: sl.trim() || undefined,
      thesis: thesis.trim() || undefined,
      tvLink: tvLink.trim() || undefined,
    };

    updateIdea.mutate(ideaPayload as Parameters<typeof updateIdea.mutate>[0], {
      onSuccess: () => {
        if (isConverted) {
          updateTrade.mutate(
            {
              id: idea.convertedTradeId!,
              asset: asset.trim().toUpperCase(),
              direction: direction as "LONG" | "SHORT",
              entry: entry.trim() ? Number(entry.trim().replace(",", ".")) : undefined,
              link: tvLink.trim() || undefined,
              exit: exit.trim() ? Number(exit.trim().replace(",", ".")) : undefined,
              lots: lots.trim() ? Number(lots.trim().replace(",", ".")) : undefined,
              pnl: pnl.trim() ? Number(pnl.trim().replace(",", ".")) : undefined,
              rMultiplier: rMultiplier.trim() ? Number(rMultiplier.trim().replace(",", ".")) : undefined,
              session: session as "ASIA" | "LONDON" | "NEW_YORK",
              notes: notes.trim() || undefined,
            },
            { onSuccess: close, onError: () => { setSaved(true); setTimeout(close, 1200); } },
          );
        } else {
          close();
        }
      },
      onError: (err) => setError(err instanceof Error ? err.message : t("ideas.error")),
    });

    function close() {
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 1200);
    }
  };

  return (
    <Modal open onClose={onClose} title={t("ideas.edit")} wide>
      {saved ? (
        <div className="flex flex-col items-center py-8">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-pos-bg text-pos">
            <CheckSquare size={22} />
          </span>
          <p className="text-[15px] font-extrabold text-text-1">{t("ideas.saved")}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="field-label">{t("ideas.asset")}</label>
              <input className="field" required value={asset} onChange={(e) => setAsset(e.target.value)} />
            </div>
            <div>
              <label className="field-label">{t("ideas.direction")}</label>
              <select className="field" value={direction} onChange={(e) => setDirection(e.target.value)}>
                <option value="LONG">Long</option>
                <option value="SHORT">Short</option>
              </select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="field-label">{t("ideas.entry")}</label>
              <input className="field num" placeholder="0.0000" value={entry} onChange={(e) => setEntry(e.target.value)} />
            </div>
            <div>
              <label className="field-label">{t("ideas.tp")}</label>
              <input className="field num" placeholder="0.0000" value={tp} onChange={(e) => setTp(e.target.value)} />
            </div>
            <div>
              <label className="field-label">{t("ideas.sl")}</label>
              <input className="field num" placeholder="0.0000" value={sl} onChange={(e) => setSl(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="field-label">{t("ideas.thesis")}</label>
            <textarea className="field min-h-[88px] resize-none" value={thesis} onChange={(e) => setThesis(e.target.value)} />
          </div>
          <div>
            <label className="field-label">{t("trades.link.t")}</label>
            <input className="field" placeholder="https://www.tradingview.com/x/…" value={tvLink} onChange={(e) => setTvLink(e.target.value)} />
            {tvLink.trim() && <TvThumb link={tvLink} className="mt-2" />}
          </div>

          {isConverted && (
            <>
              <div className="border-t border-card-border pt-4">
                <p className="mb-3 text-[13px] font-extrabold text-text-1">{t("ideas.journal")}</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="field-label">{t("trades.detail.exit")}</label>
                    <input className="field num" placeholder="0.0000" value={exit} onChange={(e) => setExit(e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label">{t("trades.detail.lots")}</label>
                    <input className="field num" placeholder="1.0" value={lots} onChange={(e) => setLots(e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label">P/L</label>
                    <input className="field num" placeholder="+1240" value={pnl} onChange={(e) => setPnl(e.target.value)} />
                  </div>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="field-label">R</label>
                    <input className="field num" placeholder="2.4" value={rMultiplier} onChange={(e) => setRMult(e.target.value)} />
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
                <div className="mt-3">
                  <label className="field-label">{t("trades.detail.notes")}</label>
                  <textarea className="field min-h-[72px] resize-none" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>
            </>
          )}

          {error && (
            <p className="rounded-xl bg-neg/10 px-3.5 py-2.5 text-[12.5px] font-semibold text-neg">{error}</p>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              {t("ideas.cancel")}
            </button>
            <button type="submit" className="btn btn-primary">
              {t("ideas.save")}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
