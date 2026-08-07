export type BrokerApiProvider = 'mock' | 'metapi';

export interface BrokerConnectionSpec {
  apiProvider: BrokerApiProvider;
  accountId: string;
  login: string;
  serverName: string;
}

export interface BrokerAccountInfo {
  accountId: string;
  login: string;
  serverName: string;
  balance: number;
  currency: string;
  demo: boolean;
}

export interface BrokerDeal {
  dealId: string;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  entry: number | null;
  exit: number | null;
  lots: number;
  pnl: number;
  swap: number;
  commission: number;
  rMultiplier: number | null;
  openedAt: Date;
  closedAt: Date | null;
}

export interface BrokerProvider {
  readonly apiProvider: BrokerApiProvider;
  testConnection(spec: BrokerConnectionSpec): Promise<BrokerAccountInfo>;
  fetchHistory(
    spec: BrokerConnectionSpec,
    from: Date,
    to: Date,
  ): Promise<BrokerDeal[]>;
}
