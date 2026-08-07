"use client";

import { useState } from "react";
import { ExternalLink, ImageOff, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn, tvSnapshotUrl } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

export function TvThumb({
  link,
  onClick,
  className,
  rounded = "rounded-xl",
}: {
  link: string | null;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  rounded?: string;
}) {
  const { t } = useLang();
  const src = tvSnapshotUrl(link);
  const [failed, setFailed] = useState(false);
  if (!src) return null;
  return (
    <div className={cn("relative aspect-[16/9] w-full overflow-hidden bg-[#131722]", rounded, className)}>
      {failed ? (
        <div className="flex h-full items-center justify-center gap-1.5 text-[11px] font-semibold text-text-3">
          <ImageOff size={14} /> {t("tv.noPreview")}
        </div>
      ) : (
        <img
          src={src}
          alt="TradingView"
          loading="lazy"
          onError={() => setFailed(true)}
          onClick={onClick}
          className={cn("h-full w-full object-cover", onClick && "cursor-pointer transition-opacity hover:opacity-90")}
        />
      )}
    </div>
  );
}

export function TvLightbox({
  trade,
  onClose,
}: {
  trade: { asset: string; link: string | null } | null;
  onClose: () => void;
}) {
  const { t } = useLang();
  const src = trade ? tvSnapshotUrl(trade.link) : null;
  const href =
    trade?.link && /^https?:\/\//i.test(trade.link) ? trade.link : trade?.link ? `https://${trade.link}` : "#";
  const [failed, setFailed] = useState(false);
  const open = !!trade && !!src;

  return (
    <AnimatePresence>
      {open && trade && src && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-0 z-50 flex flex-col p-3 sm:p-5"
          >
            <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="num text-[15px] font-extrabold text-white">{trade.asset}</span>
                <span className="text-[12px] font-semibold text-white/50">TradingView</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn btn-ghost !px-3 !py-1.5 text-[12.5px] text-white/80 hover:text-white"
                >
                  <ExternalLink size={13} /> {t("trades.link.open")}
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:text-white"
                  aria-label={t("common.close")}
                >
                  <X size={15} />
                </button>
              </div>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl bg-[#131722]">
              {failed ? (
                <span className="text-[13px] font-semibold text-white/50">{t("tv.noPreview")}</span>
              ) : (
                <img
                  src={src}
                  alt={`${trade.asset} TradingView`}
                  loading="lazy"
                  onError={() => setFailed(true)}
                  className="max-h-full max-w-full object-contain"
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
