"use client";

import { useMemo, useState } from "react";
import { NotebookPen, Search, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty";
import { MarketIcon } from "@/components/MarketIcon";
import { PostMortemEditorModal } from "@/components/PostMortemEditorModal";
import { cn, formatMoney, formatR } from "@/lib/utils";
import { timeLabel } from "@/lib/mappers";
import { useLang } from "@/lib/i18n";
import {
  useDeletePostMortem,
  usePostMortems,
  useUpdatePostMortem,
} from "@/hooks/use-postmortems";
import { useAssets } from "@/hooks/use-libraries";
import type { PostMortem } from "@/lib/types";

const RESULTS = [
  { key: "all", labelKey: "postmortems.all" },
  { key: "win", labelKey: "postmortems.win" },
  { key: "loss", labelKey: "postmortems.loss" },
] as const;

type ResultKey = (typeof RESULTS)[number]["key"];

const symbolOf = (asset: string) => asset.slice(0, 3).toUpperCase();

export default function PostMortemsPage() {
  const { t } = useLang();
  const [result, setResult] = useState<ResultKey>("all");
  const [asset, setAsset] = useState("");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<PostMortem | null>(null);

  const { data: items = [], isLoading } = usePostMortems({
    result: result === "all" ? undefined : result,
    asset: asset || undefined,
    q: search || undefined,
  });
  const { data: assets = [] } = useAssets();
  const update = useUpdatePostMortem();
  const remove = useDeletePostMortem();

  const totals = useMemo(() => {
    const all = items;
    return {
      win: all.filter((p) => p.pnl > 0).length,
      loss: all.filter((p) => p.pnl < 0).length,
    };
  }, [items]);

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("page.postmortems.t")}
        subtitle={t("page.postmortems.s")}
        actions={
          <span className="flex items-center gap-1.5 text-[12.5px] font-bold text-text-3">
            <NotebookPen size={15} /> {items.length}
          </span>
        }
      />

      {/* Фильтры */}
      <div className="animate-in space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {RESULTS.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setResult(r.key)}
              className={cn("pill !py-1.5", result === r.key ? "pill-pos" : "pill-neutral")}
            >
              {t(r.labelKey)}
              <span className="opacity-60">
                {r.key === "all" ? items.length : totals[r.key]}
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-3"
            />
            <input
              className="field !pl-9"
              placeholder={t("postmortems.search")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setSearch(q.trim());
              }}
            />
          </div>
          <select
            className="field w-auto"
            value={asset}
            onChange={(e) => setAsset(e.target.value)}
          >
            <option value="">{t("postmortems.allAssets")}</option>
            {assets.map((a) => (
              <option key={a.id} value={a.symbol}>
                {a.symbol}
              </option>
            ))}
          </select>
          {q !== search && (
            <button type="button" className="btn btn-ghost" onClick={() => setSearch(q.trim())}>
              {t("postmortems.apply")}
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="card flex items-center justify-center py-14 text-[13px] font-semibold text-text-3">
          {t("postmortems.loading")}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon={<NotebookPen size={26} />}
            title={t("postmortems.empty.t")}
            description={t("postmortems.empty.s")}
          />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((pm) => {
            const win = pm.pnl >= 0;
            return (
              <Card
                key={pm.id}
                className="animate-in group cursor-pointer gap-3 p-4"
                onClick={() => setEditing(pm)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <MarketIcon symbol={symbolOf(pm.asset)} size={32} />
                    <div>
                      <p className="num text-[13.5px] font-extrabold leading-tight text-text-1">
                        {pm.asset}
                      </p>
                      <p className="text-[11px] text-text-3">{timeLabel(pm.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <p className={cn("num text-[14px] font-extrabold", win ? "text-pos" : "text-neg")}>
                      {formatMoney(pm.pnl)}
                    </p>
                    <p className={cn("num text-[11.5px] font-bold", win ? "text-pos" : "text-neg")}>
                      {pm.rMultiplier != null ? formatR(pm.rMultiplier) : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "pill !px-2 !py-0.5 text-[10.5px]",
                      pm.direction === "LONG" ? "pill-pos" : "pill-neg",
                    )}
                  >
                    {pm.direction === "LONG" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {pm.direction === "LONG" ? t("postmortems.long") : t("postmortems.short")}
                  </span>
                  <span
                    className={cn(
                      "pill !px-2 !py-0.5 text-[10.5px]",
                      win ? "pill-pos" : "pill-neg",
                    )}
                  >
                    {win ? t("postmortems.winBadge") : t("postmortems.lossBadge")}
                  </span>
                </div>
                <p className="line-clamp-4 whitespace-pre-wrap text-[12.5px] leading-snug text-text-2">
                  {pm.content}
                </p>
              </Card>
            );
          })}
        </div>
      )}

      <PostMortemEditorModal
        open={!!editing}
        onClose={() => setEditing(null)}
        initial={editing}
        saving={update.isPending}
        onSave={(content) => {
          if (!editing) return;
          update.mutate(
            { id: editing.id, content },
            { onSuccess: () => setEditing(null) },
          );
        }}
        onDelete={() => {
          if (!editing) return;
          remove.mutate(editing.id, { onSuccess: () => setEditing(null) });
        }}
      />
    </div>
  );
}
