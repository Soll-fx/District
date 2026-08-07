import {
  BrokerAccountInfo,
  BrokerConnectionSpec,
  BrokerDeal,
  BrokerProvider,
} from './broker.provider';

const ASSETS: { symbol: string; base: number }[] = [
  { symbol: 'EURUSD', base: 1.09 },
  { symbol: 'GBPUSD', base: 1.27 },
  { symbol: 'BTCUSD', base: 95000 },
  { symbol: 'XAUUSD', base: 3240 },
];

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

/**
 * Симулятор MT4/MT5 демо-счёта. Генерирует детерминированный набор сделок
 * по (accountId + день), чтобы повторные синхронизации были идемпотентны
 * (dealId зависит только от времени открытия).
 */
export class MockBrokerProvider implements BrokerProvider {
  readonly apiProvider = 'mock' as const;

  async testConnection(spec: BrokerConnectionSpec): Promise<BrokerAccountInfo> {
    return {
      accountId: spec.accountId,
      login: spec.login,
      serverName: spec.serverName,
      balance: 10_000 + (hashStr(`${spec.accountId}:bal`) % 50_000),
      currency: 'USD',
      demo: true,
    };
  }

  async fetchHistory(
    spec: BrokerConnectionSpec,
    from: Date,
    to: Date,
  ): Promise<BrokerDeal[]> {
    const deals: BrokerDeal[] = [];
    const dayStart = new Date(from);
    dayStart.setUTCHours(0, 0, 0, 0);

    for (
      let day = new Date(dayStart);
      day.getTime() < to.getTime();
      day = new Date(day.getTime() + 86_400_000)
    ) {
      const rand = mulberry32(
        hashStr(`${spec.accountId}:${day.toISOString().slice(0, 10)}`),
      );
      const count = 1 + Math.floor(rand() * 4); // 1..4 сделки в день

      for (let i = 0; i < count; i++) {
        const openedAt = new Date(
          day.getTime() + Math.floor(rand() * 8 * 3_600_000),
        );
        if (openedAt < from || openedAt > to) continue;

        const asset = ASSETS[Math.floor(rand() * ASSETS.length)];
        const direction: 'LONG' | 'SHORT' = rand() < 0.55 ? 'LONG' : 'SHORT';
        const lots = round(0.1 + rand() * 1.4);
        const move = (rand() * 3.2 - 0.9) / 100; // -0.9% .. +2.3%
        const entry = round(asset.base * (1 + (rand() - 0.5) / 200), asset.base < 100 ? 5 : 1);
        const exit = round(entry * (1 + (direction === 'LONG' ? move : -move)), asset.base < 100 ? 5 : 1);
        const contract = asset.base < 100 ? 100_000 : asset.base < 1000 ? 100 : 1;
        const pnl = round((exit - entry) * lots * contract);
        const rMultiplier = round(rand() * 6.5 - 3.4, 2); // -3.4R .. +3.1R
        const closedAt = new Date(openedAt.getTime() + Math.floor(rand() * 6 * 3_600_000));

        deals.push({
          dealId: `${spec.accountId}:${openedAt.getTime()}`,
          symbol: asset.symbol,
          direction,
          entry,
          exit,
          lots,
          pnl,
          swap: round((rand() - 0.5) * 8),
          commission: round(lots * (rand() * 3 + 1)),
          rMultiplier,
          openedAt,
          closedAt,
        });
      }
    }

    deals.sort((a, b) => a.openedAt.getTime() - b.openedAt.getTime());
    return deals;
  }
}
