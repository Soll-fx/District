import { PrismaClient, Direction, TradeSession, IdeaStatus, MetricCategory, Tag } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "sollo@example.com";
  const passwordHash = await bcrypt.hash("sollo123", 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      name: "Sollo",
      role: "USER",
    },
  });

  // ── Теги ──
  const tags = [
    { name: "Тренд", color: "#7C6CF0" },
    { name: "Сопротивление", color: "#14B8A6" },
    { name: "Новости", color: "#F59E0B" },
    { name: "Разворот", color: "#EF4444" },
    { name: "Ликвидность", color: "#22C55E" },
  ];
  const createdTags: Tag[] = [];
  for (const t of tags) {
    createdTags.push(await prisma.tag.upsert({
      where: { userId_name: { userId: user.id, name: t.name } },
      update: { color: t.color },
      create: { userId: user.id, ...t },
    }));
  }
  const [trend, resistance, news, reversal, liquidity] = createdTags;

  // ── Сделки ──
  const trades = [
    { asset: "XAUUSD", direction: Direction.LONG, entry: 3120, exit: 3240, pnl: 3240, rMultiplier: 3.4, session: TradeSession.LONDON, entryDate: new Date("2026-07-30T12:00:00Z"), exitDate: new Date("2026-07-30T15:30:00Z"), flagged: true, tags: [news, reversal] },
    { asset: "EURUSD", direction: Direction.SHORT, entry: 1.092, exit: 1.098, pnl: -1280, rMultiplier: -1.4, session: TradeSession.NEW_YORK, entryDate: new Date("2026-07-29T16:00:00Z"), exitDate: new Date("2026-07-29T20:00:00Z"), tags: [resistance] },
    { asset: "BTCUSD", direction: Direction.LONG, entry: 94000, exit: 98600, pnl: 5600, rMultiplier: 4.1, session: TradeSession.ASIA, entryDate: new Date("2026-07-28T02:00:00Z"), exitDate: new Date("2026-07-28T08:00:00Z"), tags: [trend] },
    { asset: "GBPJPY", direction: Direction.SHORT, entry: 189.2, exit: 188.2, pnl: 890, rMultiplier: 1.2, session: TradeSession.LONDON, entryDate: new Date("2026-07-25T11:00:00Z"), exitDate: new Date("2026-07-25T13:00:00Z"), flagged: true, tags: [liquidity] },
    { asset: "US30", direction: Direction.LONG, entry: 40100, exit: 39900, pnl: -2350, rMultiplier: -2.2, session: TradeSession.NEW_YORK, entryDate: new Date("2026-07-24T16:00:00Z"), exitDate: new Date("2026-07-24T19:00:00Z"), tags: [] },
    { asset: "USDJPY", direction: Direction.SHORT, entry: 155.8, exit: 154.6, pnl: 1750, rMultiplier: 2.1, session: TradeSession.ASIA, entryDate: new Date("2026-07-23T01:00:00Z"), exitDate: new Date("2026-07-23T06:00:00Z"), tags: [resistance] },
    { asset: "NAS100", direction: Direction.LONG, entry: 20800, exit: 21350, pnl: 4020, rMultiplier: 3.8, session: TradeSession.NEW_YORK, entryDate: new Date("2026-07-22T16:00:00Z"), exitDate: new Date("2026-07-22T18:30:00Z"), flagged: true, tags: [trend] },
    { asset: "AUDUSD", direction: Direction.SHORT, entry: 0.678, exit: 0.681, pnl: -640, rMultiplier: -0.8, session: TradeSession.LONDON, entryDate: new Date("2026-07-21T10:00:00Z"), exitDate: new Date("2026-07-21T12:00:00Z"), tags: [] },
  ];

  for (const t of trades) {
    const tagIds = t.tags ?? [];
    await prisma.trade.create({
      data: {
        userId: user.id,
        asset: t.asset,
        direction: t.direction,
        entry: t.entry,
        exit: t.exit,
        pnl: t.pnl,
        rMultiplier: t.rMultiplier,
        session: t.session,
        entryDate: t.entryDate,
        exitDate: t.exitDate,
        flagged: t.flagged ?? false,
        tags: tagIds.length ? { create: tagIds.map((tag) => ({ tagId: tag.id })) } : undefined,
      },
    });
  }

  // ── Идеи ──
  await prisma.idea.createMany({
    data: [
      { userId: user.id, asset: "EURUSD", direction: Direction.LONG, entry: "1.0855", tp: "1.0940", sl: "1.0820", thesis: "Покупка от зоны 1.0850 — слияние дневного уровня и H4-сопротивления после разворота S/R.", status: IdeaStatus.WATCH },
      { userId: user.id, asset: "BTCUSD", direction: Direction.LONG, entry: "96 400", tp: "102 800", sl: "94 000", thesis: "Пробой нисходящей структуры на H4, ретест вершины — лонг по тренду.", status: IdeaStatus.HIT },
      { userId: user.id, asset: "XAUUSD", direction: Direction.SHORT, entry: "3 240", tp: "3 150", sl: "3 285", thesis: "Потенциальная двойная вершина на D1, продажа от медианы канала.", status: IdeaStatus.WATCH },
      { userId: user.id, asset: "GBPJPY", direction: Direction.LONG, entry: "189.2", tp: "192.0", sl: "187.4", thesis: "Заход на ликвидность в лондонскую сессию — отменено по появлению sell-side ликвидности.", status: IdeaStatus.INVALID },
      { userId: user.id, asset: "US30", direction: Direction.SHORT, entry: "—", tp: "—", sl: "—", thesis: "Перед NFP — флет, не торговал.", status: IdeaStatus.ARCHIVE },
    ],
  });

  // ── Активы ──
  await prisma.asset.createMany({
    data: [
      { symbol: "XAU", name: "Золото", color: "#F59E0B", category: "metals" },
      { symbol: "EUR", name: "EUR/USD", color: "#2563EB", category: "forex" },
      { symbol: "BTC", name: "Bitcoin", color: "#F7931A", category: "crypto" },
      { symbol: "NAS", name: "NAS100", color: "#6366F1", category: "index" },
    ],
  });

  // ── Метрики профиля ──
  const metrics = [
    { key: "volume", label: "Объём торгов", value: "$184K", category: MetricCategory.TRADING, visible: false },
    { key: "streak", label: "Серия сделок", value: "14", category: MetricCategory.TRADING, visible: false },
    { key: "consistency", label: "Consistency score", value: "88%", category: MetricCategory.TRADING, visible: false },
  ];
  for (const [i, m] of metrics.entries()) {
    await prisma.profileMetric.upsert({
      where: { userId_key: { userId: user.id, key: m.key } },
      update: { visible: m.visible, value: m.value },
      create: { userId: user.id, order: i, ...m },
    });
  }

  // ── Новости ──
  const todayAt = (hour: number, minute = 0) => {
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    return d;
  };
  await prisma.newsItem.createMany({
    data: [
      { country: "🇺🇸 США", instrument: "USD", impact: "medium", title: "Final Manufacturing PMI", time: "18:45", prev: "53.8", forecast: "53.8", date: todayAt(18, 45) },
      { country: "🇺🇸 США", instrument: "USD", impact: "high", title: "ISM Manufacturing PMI", time: "19:00", prev: "53.3", forecast: "54.0", date: todayAt(19, 0) },
      { country: "🇺🇸 США", instrument: "USD", impact: "high", title: "ISM Manufacturing Prices", time: "19:00", prev: "73.0", forecast: "70.0", date: todayAt(19, 0) },
      { country: "🇺🇸 США", instrument: "USD", impact: "low", title: "Construction Spending m/m", time: "19:00", prev: "0.1%", forecast: "0.2%", date: todayAt(19, 0) },
      { country: "🇺🇸 США", instrument: "USD", impact: "low", title: "Omdia Total Vehicle Sales", time: "All day", prev: "—", forecast: "—", date: todayAt(23, 59) },
    ],
  });

  // ── Академия ──
  await prisma.course.createMany({
    data: [
      { title: 'Структура рынка H1–D1', tag: 'Базовый', color: '#7C6CF0', lessons: 12, done: 12, time: '3 ч 20 мин', locked: false, order: 1 },
      { title: 'Ликвидность и заходы', tag: 'Средний', color: '#14B8A6', lessons: 14, done: 8, time: '4 ч 05 мин', locked: false, order: 2 },
      { title: 'Управление рисками', tag: 'Базовый', color: '#22C55E', lessons: 9, done: 9, time: '2 ч 40 мин', locked: false, order: 3 },
      { title: 'Новости и геополитика', tag: 'Продвинутый', color: '#F59E0B', lessons: 11, done: 1, time: '3 ч 45 мин', locked: false, order: 4 },
      { title: 'Психология сделки', tag: 'Продвинутый', color: '#EF4444', lessons: 10, done: 0, time: '2 ч 55 мин', locked: true, order: 5 },
    ],
  });

  console.log("Seed готов. Вход:");
  console.log("  email: sollo@example.com");
  console.log("  пароль: sollo123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
