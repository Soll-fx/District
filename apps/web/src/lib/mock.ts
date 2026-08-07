export type Trade = {
  id: string;
  asset: string;
  symbol: string;
  color: string;
  direction: "long" | "short";
  date: string;
  dateLabel: string;
  pnl: number;
  r: number;
  session: "Азия" | "Лондон" | "Нью-Йорк";
  account: string;
  flagged?: boolean;
  tags: string[];
};

export const TRADES: Trade[] = [
  { id: "t1", asset: "XAUUSD", symbol: "XAU", color: "#F59E0B", direction: "long", date: "2026-07-30", dateLabel: "30 июл", pnl: 3240, r: 3.4, session: "Лондон", account: "Funded #12", flagged: true, tags: ["Новости", "Разворот"] },
  { id: "t2", asset: "EURUSD", symbol: "EUR", color: "#2563EB", direction: "short", date: "2026-07-29", dateLabel: "29 июл", pnl: -1280, r: -1.4, session: "Нью-Йорк", account: "Funded #12", tags: ["Сопротивление"] },
  { id: "t3", asset: "BTCUSD", symbol: "BTC", color: "#F7931A", direction: "long", date: "2026-07-28", dateLabel: "28 июл", pnl: 5600, r: 4.1, session: "Азия", account: "Personal", tags: ["Тренд"] },
  { id: "t4", asset: "GBPJPY", symbol: "GBP", color: "#14B8A6", direction: "short", date: "2026-07-25", dateLabel: "25 июл", pnl: 890, r: 1.2, session: "Лондон", account: "Funded #12", flagged: true, tags: ["Ликвидность"] },
  { id: "t5", asset: "US30", symbol: "US30", color: "#7C6CF0", direction: "long", date: "2026-07-24", dateLabel: "24 июл", pnl: -2350, r: -2.2, session: "Нью-Йорк", account: "Demo", tags: ["Пробой"] },
  { id: "t6", asset: "USDJPY", symbol: "USD", color: "#0EA5E9", direction: "short", date: "2026-07-23", dateLabel: "23 июл", pnl: 1750, r: 2.1, session: "Азия", account: "Funded #12", tags: ["Сопротивление"] },
  { id: "t7", asset: "NAS100", symbol: "NAS", color: "#6366F1", direction: "long", date: "2026-07-22", dateLabel: "22 июл", pnl: 4020, r: 3.8, session: "Нью-Йорк", account: "Personal", flagged: true, tags: ["Тренд", "Гэп"] },
  { id: "t8", asset: "AUDUSD", symbol: "AUD", color: "#10B981", direction: "short", date: "2026-07-21", dateLabel: "21 июл", pnl: -640, r: -0.8, session: "Лондон", account: "Demo", tags: [] },
];

export const EQUITY = [10000, 10240, 10120, 10580, 10890, 10740, 11260, 11900, 11680, 12240, 12980, 13260];

export type Idea = {
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
};

export const IDEAS: Idea[] = [
  { id: "i1", asset: "EURUSD", symbol: "EUR", color: "#2563EB", direction: "long", status: "watch", dateLabel: "31 июл", thesis: "Покупка от зоны 1.0850 — слияние дневного уровня и H4-сопротивления после разворота S/R.", entry: "1.0855", tp: "1.0940", sl: "1.0820" },
  { id: "i2", asset: "BTCUSD", symbol: "BTC", color: "#F7931A", direction: "long", status: "hit", dateLabel: "29 июл", thesis: "Пробой нисходящей структуры на H4, ретест вершины — лонг по тренду.", entry: "96 400", tp: "102 800", sl: "94 000" },
  { id: "i3", asset: "XAUUSD", symbol: "XAU", color: "#F59E0B", direction: "short", status: "watch", dateLabel: "30 июл", thesis: "Потенциальная двойная вершина на D1, продажа от медианы канала.", entry: "3 240", tp: "3 150", sl: "3 285" },
  { id: "i4", asset: "GBPJPY", symbol: "GBP", color: "#14B8A6", direction: "long", status: "invalid", dateLabel: "24 июл", thesis: "Заход на ликвидность в лондонскую сессию — отменено по появлению sell-side ликвидности.", entry: "189.2", tp: "192.0", sl: "187.4" },
  { id: "i5", asset: "US30", symbol: "US30", color: "#7C6CF0", direction: "short", status: "archive", dateLabel: "20 июл", thesis: "Перед NFP — флет, не торговал.", entry: "—", tp: "—", sl: "—" },
];

export const NEWS = [
  { id: "n1", country: "🇺🇸 США", impact: "high", time: "17:30", title: "CPI США, м/м", prev: "0.3%", forecast: "0.2%" },
  { id: "n2", country: "🇪🇺 Еврозона", impact: "high", time: "12:00", title: "Решение по ставке ЕЦБ", prev: "2.00%", forecast: "1.75%" },
  { id: "n3", country: "🇺🇸 США", impact: "medium", time: "15:45", title: "Индекс деловой активности PMI", prev: "52.1", forecast: "52.4" },
  { id: "n4", country: "🇨🇳 Китай", impact: "medium", time: "04:30", title: "Промышленное производство, г/г", prev: "6.1%", forecast: "5.8%" },
  { id: "n5", country: "🇯🇵 Япония", impact: "low", time: "02:50", title: "Платёжный баланс", prev: "¥2.1 трлн", forecast: "¥1.9 трлн" },
];

export type Achievement = {
  id: string;
  user: string;
  initials: string;
  color: string;
  action: string;
  reaction: { emoji: string; count: number }[];
  time: string;
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: "a1", user: "Alex Fox", initials: "AF", color: "#7C6CF0", action: "закрыл сделку +3.4R на XAUUSD", reaction: [{ emoji: "👻", count: 41 }, { emoji: "🔥", count: 37 }, { emoji: "💀", count: 32 }], time: "2 мин" },
  { id: "a2", user: "Mia Kovač", initials: "MK", color: "#14B8A6", action: "закрыла день в плюс +4.2R", reaction: [{ emoji: "🔥", count: 58 }, { emoji: "👑", count: 21 }], time: "14 мин" },
  { id: "a3", user: "Liam Park", initials: "LP", color: "#F59E0B", action: "оформил серию из 7 выигрышных сделок", reaction: [{ emoji: "💸", count: 33 }, { emoji: "👻", count: 19 }], time: "26 мин" },
  { id: "a4", user: "Sofia Reyes", initials: "SR", color: "#EF4444", action: "выполнила 100 сделок подряд с дисциплиной", reaction: [{ emoji: "⚡", count: 45 }], time: "1 ч" },
];
