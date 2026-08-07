"use client";

import { useState } from "react";
import { Trash2, NotebookPen, ChevronLeft, ChevronRight } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { TvThumb } from "@/components/TvThumb";
import { PostMortemEditorModal } from "@/components/PostMortemEditorModal";
import { PositionReportCard } from "@/components/trades/PositionReportCard";
import { cn, formatMoney, formatR } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { useSavePostMortem, useTradePostMortem } from "@/hooks/use-postmortems";
import type { TradeView } from "@/lib/mappers";

function fullDate(iso: string, lang: "ru" | "en") {
  return new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function fullDateTime(iso: string, lang: "ru" | "en") {
  return new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "en-US", {
    weekday: "short",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-[12.5px] text-text-3">{label}</span>
      <span className="text-right text-[12.5px] font-semibold text-text-1">{children}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-card-border pt-2">
      <p className="label-caps mb-1">{title}</p>
      {children}
    </div>
  );
}

export function TradeDetailModal({
  trades,
  index,
  onClose,
  onNavigate,
  onOpenLink,
  onPreview,
  onDelete,
}: {
  trades: TradeView[];
  index: number;
  onClose: () => void;
  onNavigate?: (index: number) => void;
  onOpenLink: (trade: TradeView) => void;
  onPreview: (trade: TradeView) => void;
  onDelete: (trade: TradeView) => void;
}) {
  const { t, lang } = useLang();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pmOpen, setPmOpen] = useState(false);
  const trade = index >= 0 ? trades[index] : undefined;
  const win = trade ? trade.pnl >= 0 : false;
  const closed = trade ? trade.pnl !== 0 || !!trade.exitDate : false;
  const { data: pmList = [] } = useTradePostMortem(trade?.id ?? null);
  const pm = pmList[0] ?? null;
  const savePm = useSavePostMortem();

  const handleDelete = () => {
    if (!trade) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      window.setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    setConfirmDelete(false);
    onDelete(trade);
  };

  const notional = trade?.entry != null ? Math.abs(trade.entry) * (trade.lots ?? 1) : 0;
  const risk =
    trade?.entry != null && trade?.exit != null ? Math.abs(trade.entry - trade.exit) * (trade.lots ?? 1) : null;
  const riskPct = notional > 0 && risk != null ? (risk / notional) * 100 : null;
  const pnlPct = notional > 0 ? (trade?.pnl ?? 0) / notional : null;

  return (
    <>
      <Modal open={!!trade} onClose={onClose} title={t("trades.detail.t")}>
      {trade && (
        <div className="space-y-3">
          <PositionReportCard trade={trade} trades={trades} />

          <Section title={t("trades.detail.position")}>
            <Row label={t("trades.detail.direction")}>
              {trade.direction === "long" ? "Long" : "Short"}
            </Row>
            <Row label={t("trades.detail.asset")}>{trade.asset}</Row>
            <Row label={t("trades.detail.session")}>{t(`trades.session.${trade.session}`)}</Row>
            <Row label={t("trades.detail.tradeDate")}>{fullDate(trade.entryDate, lang)}</Row>
            <Row label={t("trades.detail.entry")}>{trade.entry ?? "—"}</Row>
            <Row label={t("trades.detail.exit")}>{trade.exit ?? "—"}</Row>
            <Row label={t("trades.detail.lots")}>{trade.lots ?? "—"}</Row>
          </Section>

          <Section title={t("trades.detail.result")}>
            <Row label={t("trades.detail.outcome")}>
              <span className={cn("pill !px-2 !py-0.5 text-[10.5px]", win ? "pill-pos" : "pill-neg")}>
                {win ? t("trades.detail.win") : t("trades.detail.loss")}
              </span>
            </Row>
            <Row label={t("trades.detail.pnl")}>
              <span className={cn("num", win ? "text-pos" : "text-neg")}>{formatMoney(trade.pnl)}</span>
              {pnlPct != null && (
                <span className={cn("num ml-1 text-[11.5px]", win ? "text-pos" : "text-neg")}>
                  ({pnlPct >= 0 ? "+" : ""}
                  {pnlPct.toFixed(2)}%)
                </span>
              )}
            </Row>
            <Row label={t("trades.detail.rMultiple")}>
              <span className={cn("num", trade.r >= 0 ? "text-pos" : "text-neg")}>{formatR(trade.r)}</span>
            </Row>
            <Row label={t("trades.detail.risk")}>{risk != null ? formatMoney(risk) : "—"}</Row>
            <Row label={t("trades.detail.riskPct")}>{riskPct != null ? `${riskPct.toFixed(2)}%` : "—"}</Row>
            <Row label={t("trades.detail.riskReward")}>1 : {trade.r.toFixed(2)}</Row>
          </Section>

          <Section title={t("trades.detail.journal")}>
            <Row label={t("trades.detail.notes")}>
              {trade.notes ? (
                <span className="max-w-[240px] whitespace-pre-wrap break-words text-left">{trade.notes}</span>
              ) : (
                t("trades.detail.noNotes")
              )}
            </Row>
            {closed && (
              <div className="mt-2 flex items-center justify-between gap-3 border-t border-card-border pt-2">
                <button
                  type="button"
                  onClick={() => setPmOpen(true)}
                  className="flex items-center gap-1.5 text-[12.5px] font-bold text-hero transition-opacity hover:opacity-80"
                >
                  <NotebookPen size={14} />
                  {pm ? t("trades.pm.open") : t("trades.pm.create")}
                </button>
                {pm && (
                  <p className="line-clamp-2 max-w-[220px] text-right text-[11.5px] leading-snug text-text-3">
                    {pm.content}
                  </p>
                )}
              </div>
            )}
          </Section>

          {trade.link && (
            <Section title={t("trades.detail.links")}>
              <TvThumb link={trade.link} onClick={() => onPreview(trade)} className="mb-2" />
              <div className="flex items-center justify-between gap-3 py-1">
                <span className="truncate text-[12px] text-text-3">{trade.link}</span>
                <button
                  type="button"
                  onClick={() => onOpenLink(trade)}
                  className="btn btn-ghost !px-3 !py-1 text-[12px]"
                >
                  {t("trades.link.go")}
                </button>
              </div>
            </Section>
          )}

          <Section title={t("trades.detail.tags")}>
            {trade.tags.length ? (
              <div className="flex flex-wrap gap-1.5">
                {trade.tags.map((tag) => (
                  <span key={tag} className="pill pill-neutral !px-2 !py-0.5 text-[10.5px]">
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[12.5px] text-text-3">{t("trades.detail.noTags")}</p>
            )}
          </Section>

          <Section title={t("trades.detail.audit")}>
            <Row label={t("trades.detail.logged")}>{fullDateTime(trade.createdAt, lang)}</Row>
            <Row label={t("trades.detail.id")}>
              <code className="max-w-[220px] break-all text-[10.5px] text-text-3">{trade.id}</code>
            </Row>
          </Section>

          <div className="flex items-center justify-between gap-3 border-t border-card-border pt-2">
            <button
              type="button"
              onClick={handleDelete}
              title={confirmDelete ? t("trades.delete.confirm") : t("trades.delete.t")}
              className={cn(
                "btn !px-3 !py-1.5 text-[12.5px]",
                confirmDelete ? "bg-neg/15 text-neg" : "btn-ghost",
              )}
            >
              <Trash2 size={14} /> {confirmDelete ? t("trades.delete.confirm") : t("trades.delete.t")}
            </button>
            <p className={cn("num text-[14px] font-extrabold", win ? "text-pos" : "text-neg")}>
              {formatMoney(trade.pnl)}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onNavigate?.(index - 1)}
                disabled={index <= 0}
                aria-label={t("trades.detail.prev")}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-text-2 transition-colors hover:bg-bg hover:text-text-1 disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                onClick={() => onNavigate?.(index + 1)}
                disabled={index >= trades.length - 1}
                aria-label={t("trades.detail.next")}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-text-2 transition-colors hover:bg-bg hover:text-text-1 disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronRight size={15} />
              </button>
              <button type="button" onClick={onClose} className="btn btn-ghost !px-3 !py-1.5 text-[12.5px]">
                {t("trades.detail.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>

    <PostMortemEditorModal
      open={pmOpen}
      onClose={() => setPmOpen(false)}
      trade={trade}
      initial={pm}
      saving={savePm.isPending}
      onSave={(content) => {
        if (!trade) return;
        savePm.mutate(
          { tradeId: trade.id, content },
          { onSuccess: () => setPmOpen(false) },
        );
      }}
    />
  </>
  );
}
