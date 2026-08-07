"use client";

import { ExternalLink } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useLang } from "@/lib/i18n";
import type { TradeView } from "@/lib/mappers";

const TV_SYMBOL: Record<string, string> = {
  XAUUSD: "OANDA:XAUUSD",
  EURUSD: "OANDA:EURUSD",
  GBPUSD: "OANDA:GBPUSD",
  USDJPY: "OANDA:USDJPY",
  AUDUSD: "OANDA:AUDUSD",
  US30: "OANDA:US30",
  NAS100: "OANDA:NAS100",
  GER40: "OANDA:GER40",
  BTCUSD: "BITSTAMP:BTCUSD",
};

function tvSymbolOf(asset: string) {
  return TV_SYMBOL[asset.toUpperCase()] ?? `TVC:${asset.toUpperCase()}`;
}

export function TradeLinkModal({
  trade,
  onClose,
}: {
  trade: TradeView | null;
  onClose: () => void;
}) {
  const { t, lang } = useLang();
  if (!trade) return null;

  const symbol = tvSymbolOf(trade.asset);
  const embedUrl = `https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.html?symbol=${encodeURIComponent(
    symbol,
  )}&interval=D&theme=dark&style=1&locale=${lang}&allow_symbol_change=false&hide_side_toolbar=false&hide_top_toolbar=false`;

  const href = /^https?:\/\//i.test(trade.link ?? "") ? trade.link! : `https://${trade.link}`;

  return (
    <Modal open onClose={onClose} title={`${t("trades.link.modal")} · ${trade.asset}`} wide>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="num text-[14px] font-extrabold text-text-1">{trade.asset}</span>
            <span className="pill pill-neutral !px-2 !py-0.5 text-[10.5px]">{symbol}</span>
          </div>
          {trade.link && (
            <a
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-primary !px-3 !py-1.5 text-[12.5px]"
            >
              <ExternalLink size={13} /> {t("trades.link.open")}
            </a>
          )}
        </div>

        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-[#131722]">
          <iframe
            src={embedUrl}
            title={trade.asset}
            loading="lazy"
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      </div>
    </Modal>
  );
}
