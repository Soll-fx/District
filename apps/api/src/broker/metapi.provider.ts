import {
  BrokerAccountInfo,
  BrokerConnectionSpec,
  BrokerDeal,
  BrokerProvider,
} from './broker.provider';

interface RawDeal {
  id: string;
  type: string;
  entryType: string;
  symbol?: string;
  time: Date;
  volume?: number;
  price?: number;
  commission?: number;
  swap?: number;
  profit: number;
  positionId?: string;
}

/**
 * Провайдер MetaApi (read-only). Подключается к облачному терминалу и тянет
 * историю сделок с демо MT4/MT5 счёта. Требует METAAPI_TOKEN в env.
 * Включается только при наличии токена (см. BrokerService).
 */
export class MetaApiBrokerProvider implements BrokerProvider {
  readonly apiProvider = 'metapi' as const;

  constructor(private readonly token: string) {}

  private async account(spec: BrokerConnectionSpec) {
    const mod: any = await import('metaapi.cloud-sdk');
    const MetaApi = mod.default ?? mod;
    const api = new MetaApi(this.token);
    const account = await api.metatraderAccountApi.getAccount(spec.accountId);
    if (!account) {
      throw new Error(`MetaApi счёт ${spec.accountId} не найден`);
    }
    return account;
  }

  async testConnection(spec: BrokerConnectionSpec): Promise<BrokerAccountInfo> {
    const account = await this.account(spec);
    await account.deploy();
    await account.waitConnected();
    const connection = account.getRPCConnection();
    const info = await connection.getAccountInformation();
    return {
      accountId: spec.accountId,
      login: info.login,
      serverName: spec.serverName,
      balance: info.balance,
      currency: info.currency,
      demo: true,
    };
  }

  async fetchHistory(
    spec: BrokerConnectionSpec,
    from: Date,
    to: Date,
  ): Promise<BrokerDeal[]> {
    const account = await this.account(spec);
    await account.deploy();
    await account.waitConnected();
    const connection = account.getRPCConnection();
    const history = await connection.getDealsByTimeRange(from, to);
    const raw = (history?.deals ?? []) as RawDeal[];

    const byPosition = new Map<string, RawDeal[]>();
    for (const deal of raw) {
      if (deal.type !== 'DEAL_TYPE_BUY' && deal.type !== 'DEAL_TYPE_SELL') continue;
      if (!deal.positionId) continue;
      const group = byPosition.get(deal.positionId) ?? [];
      group.push(deal);
      byPosition.set(deal.positionId, group);
    }

    const deals: BrokerDeal[] = [];
    for (const group of byPosition.values()) {
      const entry = group.find((d) => d.entryType === 'DEAL_ENTRY_IN');
      const exit = group.find(
        (d) => d.entryType === 'DEAL_ENTRY_OUT' || d.entryType === 'DEAL_ENTRY_OUT_BY',
      );
      if (!exit) continue;
      const direction: 'LONG' | 'SHORT' =
        entry?.type === 'DEAL_TYPE_BUY' || group[0].type === 'DEAL_TYPE_BUY'
          ? 'LONG'
          : 'SHORT';
      const pnl = group.reduce((s, d) => s + d.profit, 0);
      const swap = group.reduce((s, d) => s + (d.swap ?? 0), 0);
      const commission = group.reduce((s, d) => s + (d.commission ?? 0), 0);
      deals.push({
        dealId: `metapi:${exit.id}`,
        symbol: exit.symbol ?? '?',
        direction,
        entry: entry?.price ?? null,
        exit: exit.price ?? null,
        lots: exit.volume ?? 0,
        pnl,
        swap,
        commission,
        rMultiplier: null,
        openedAt: entry?.time ?? exit.time,
        closedAt: exit.time,
      });
    }

    deals.sort((a, b) => a.openedAt.getTime() - b.openedAt.getTime());
    return deals;
  }
}
