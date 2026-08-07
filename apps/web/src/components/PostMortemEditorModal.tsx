"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { MarketIcon } from "@/components/MarketIcon";
import { cn, formatMoney, formatR } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import type { TradeView } from "@/lib/mappers";
import type { PostMortem } from "@/lib/types";

export function PostMortemEditorModal({
  open,
  onClose,
  trade,
  initial,
  saving,
  onSave,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  trade?: TradeView | null;
  initial?: PostMortem | null;
  saving?: boolean;
  onSave: (content: string) => void;
  onDelete?: () => void;
}) {
  const { t } = useLang();
  const [content, setContent] = useState(initial?.content ?? "");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={trade ? "Post-mortem" : t("pm.titleEdit")}
      wide
    >
      <div className="space-y-4">
        {trade && (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-bg p-3">
            <div className="flex items-center gap-2.5">
              <MarketIcon symbol={trade.symbol} size={36} />
              <div>
                <p className="num text-[14px] font-extrabold leading-tight text-text-1">{trade.asset}</p>
                <p className="text-[11.5px] text-text-3">{trade.direction === "long" ? "Long" : "Short"}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={cn("num text-[14px] font-extrabold", trade.pnl >= 0 ? "text-pos" : "text-neg")}>
                {formatMoney(trade.pnl)}
              </p>
              <p className={cn("num text-[11.5px] font-bold", trade.r >= 0 ? "text-pos" : "text-neg")}>
                {formatR(trade.r)}
              </p>
            </div>
          </div>
        )}

        <div>
          <label className="field-label">{t("pm.question")}</label>
          <textarea
            className="field min-h-[160px] resize-y"
            placeholder={t("pm.placeholder")}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          {onDelete && initial ? (
            <button
              type="button"
              className="btn btn-ghost !px-3 !py-1.5 text-[12.5px] text-neg"
              onClick={onDelete}
            >
              <Trash2 size={14} /> {t("pm.delete")}
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              {t("pm.cancel")}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!content.trim() || saving}
              onClick={() => onSave(content.trim())}
            >
              {saving ? t("pm.saving") : t("pm.save")}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
