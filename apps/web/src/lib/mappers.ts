import type { Idea as ApiIdea, Trade as ApiTrade } from "@/lib/types";

export type TradeView = {
  id: string;
  asset: string;
  symbol: string;
  color: string;
  direction: "long" | "short";
  date: string;
  dateLabel: string;
  pnl: number;
  r: number;
  session: "ASIA" | "LONDON" | "NEW_YORK";
  account: string;
  flagged?: boolean;
  tags: string[];
  entry: number | null;
  exit: number | null;
  lots: number | null;
  notes: string | null;
  link: string | null;
  entryDate: string;
  exitDate: string | null;
  createdAt: string;
};

export type IdeaView = {
  id: string;
  asset: string;
  symbol: string;
  color: string;
  direction: "long" | "short";
  status: "watch" | "hit" | "invalid" | "archive";
  dateLabel: string;
  thesis: string;
  entry: string;
  tp: string;
  sl: string;
  tvLink: string | null;
  convertedTradeId: string | null;
};

const SESSION_LABEL: Record<string, TradeView["session"]> = {
  ASIA: "ASIA",
  LONDON: "LONDON",
  NEW_YORK: "NEW_YORK",
};

const SYMBOL_BY_ASSET: Record<string, string> = {
  XAUUSD: "XAU",
  EURUSD: "EUR",
  BTCUSD: "BTC",
  GBPJPY: "GBP",
  US30: "US30",
  USDJPY: "USD",
  NAS100: "NAS",
  AUDUSD: "AUD",
};

const PALETTE = [
  "#F59E0B",
  "#2563EB",
  "#F7931A",
  "#14B8A6",
  "#7C6CF0",
  "#0EA5E9",
  "#6366F1",
  "#10B981",
];

function hashAsset(asset: string) {
  let h = 0;
  for (let i = 0; i < asset.length; i++) h = (h * 31 + asset.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function shortMonth(date: string) {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" })
    .format(d)
    .replace(".", "");
}

export function mapTrade(t: ApiTrade): TradeView {
  return {
    id: t.id,
    asset: t.asset,
    symbol: SYMBOL_BY_ASSET[t.asset] ?? t.asset.slice(0, 3).toUpperCase(),
    color: PALETTE[hashAsset(t.asset) % PALETTE.length],
    direction: t.direction.toLowerCase() as TradeView["direction"],
    date: t.entryDate.slice(0, 10),
    dateLabel: shortMonth(t.entryDate),
    pnl: t.pnl,
    r: t.rMultiplier ?? 0,
    session: SESSION_LABEL[t.session ?? "LONDON"] ?? "LONDON",
    account: t.account?.name ?? "—",
    flagged: t.flagged,
    tags: t.tags?.map((tag) => tag.name) ?? [],
    entry: t.entry,
    exit: t.exit,
    lots: t.lots,
    notes: t.notes,
    link: t.link,
    entryDate: t.entryDate,
    exitDate: t.exitDate,
    createdAt: t.createdAt,
  };
}

export function timeLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return "только что";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} мин`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} ч`;
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" })
    .format(date)
    .replace(".", "");
}

export function ideaDateLabel(iso: string) {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" })
    .format(new Date(iso))
    .replace(".", "");
}

export function mapIdea(i: ApiIdea): IdeaView {
  return {
    id: i.id,
    asset: i.asset,
    symbol: SYMBOL_BY_ASSET[i.asset] ?? i.asset.slice(0, 3).toUpperCase(),
    color: PALETTE[hashAsset(i.asset) % PALETTE.length],
    direction: i.direction.toLowerCase() as IdeaView["direction"],
    status: i.status.toLowerCase() as IdeaView["status"],
    dateLabel: ideaDateLabel(i.createdAt),
    thesis: i.thesis ?? "",
    entry: i.entry ?? "—",
    tp: i.tp ?? "—",
    sl: i.sl ?? "—",
    tvLink: i.tvLink ?? null,
    convertedTradeId: i.convertedTradeId ?? null,
  };
}
