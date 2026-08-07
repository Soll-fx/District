import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, TradeSource } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  BrokerApiProvider,
  BrokerConnectionSpec,
  BrokerDeal,
  BrokerProvider,
} from './broker.provider';
import { MockBrokerProvider } from './mock.provider';
import { MetaApiBrokerProvider } from './metapi.provider';

export const BROKER_PROVIDER = 'metatrader';

type BrokerMeta = {
  broker: true;
  apiProvider: BrokerApiProvider;
  accountId: string;
  login: string;
  serverName: string;
  balance?: number;
  currency?: string;
  lastSyncedAt?: string | null;
};

const BROKER_META_SELECT = 'provider, meta, connected' as const;

function asBrokerMeta(meta: Prisma.JsonValue | null): BrokerMeta | null {
  if (!meta || typeof meta !== 'object') return null;
  const m = meta as Record<string, unknown>;
  if (m.broker !== true) return null;
  return m as unknown as BrokerMeta;
}

@Injectable()
export class BrokerService {
  private readonly providers = new Map<BrokerApiProvider, BrokerProvider>();
  private syncing = false;

  constructor(private readonly prisma: PrismaService) {
    this.providers.set('mock', new MockBrokerProvider());
    if (process.env.METAAPI_TOKEN) {
      this.providers.set(
        'metapi',
        new MetaApiBrokerProvider(process.env.METAAPI_TOKEN),
      );
    }
  }

  getProvider(name: BrokerApiProvider): BrokerProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new BadRequestException(
        `Провайдер "${name}" недоступен — добавьте METAAPI_TOKEN в env`,
      );
    }
    return provider;
  }

  async listAccounts(userId: string) {
    const integrations = await this.prisma.integration.findMany({
      where: { userId, provider: BROKER_PROVIDER },
      orderBy: { createdAt: 'asc' },
    });

    return integrations.map((i) => {
      const meta = asBrokerMeta(i.meta);
      return {
        id: i.id,
        connected: i.connected,
        apiProvider: meta?.apiProvider ?? null,
        accountId: meta?.accountId ?? null,
        login: meta?.login ?? null,
        serverName: meta?.serverName ?? null,
        label: meta ? `${meta.login}@${meta.serverName}` : null,
        balance: meta?.balance ?? null,
        currency: meta?.currency ?? 'USD',
        lastSyncedAt: meta?.lastSyncedAt ?? null,
        lastSyncError: (i.meta as { lastSyncError?: string } | null)?.lastSyncError ?? null,
      };
    });
  }

  async connect(
    userId: string,
    dto: { apiProvider: BrokerApiProvider; accountId?: string; login: string; serverName: string },
  ) {
    const provider = this.getProvider(dto.apiProvider);
    const spec: BrokerConnectionSpec = {
      apiProvider: dto.apiProvider,
      accountId: dto.accountId || dto.login,
      login: dto.login,
      serverName: dto.serverName,
    };

    const info = await provider.testConnection(spec);

    const existing = await this.prisma.integration.findFirst({
      where: { userId, provider: BROKER_PROVIDER },
    });

    const meta: Prisma.InputJsonValue = {
      broker: true,
      apiProvider: dto.apiProvider,
      accountId: dto.accountId || dto.login,
      login: dto.login,
      serverName: dto.serverName,
      balance: info.balance,
      currency: info.currency,
      lastSyncedAt: null,
    };

    if (existing) {
      await this.prisma.integration.update({
        where: { id: existing.id },
        data: { connected: true, meta },
      });
    } else {
      await this.prisma.integration.create({
        data: { userId, provider: BROKER_PROVIDER, connected: true, meta },
      });
    }

    return this.listAccounts(userId);
  }

  async disconnect(userId: string, id: string) {
    const integration = await this.prisma.integration.findFirst({
      where: { id, userId, provider: BROKER_PROVIDER },
    });
    if (!integration) throw new BadRequestException('Подключение не найдено');
    await this.prisma.integration.update({
      where: { id },
      data: { connected: false },
    });
    return this.listAccounts(userId);
  }

  async mirrorDeals(userId: string, deals: BrokerDeal[]) {
    for (const deal of deals) {
      await this.prisma.trade.upsert({
        where: { externalId: deal.dealId },
        create: {
          userId,
          asset: deal.symbol,
          direction: deal.direction,
          entry: deal.entry,
          exit: deal.exit,
          lots: deal.lots,
          pnl: deal.pnl,
          rMultiplier: deal.rMultiplier,
          source: TradeSource.BROKER,
          externalId: deal.dealId,
          commission: deal.commission,
          swap: deal.swap,
          entryDate: deal.openedAt,
          exitDate: deal.closedAt,
        },
        update: {
          exit: deal.exit,
          lots: deal.lots,
          pnl: deal.pnl,
          rMultiplier: deal.rMultiplier,
          commission: deal.commission,
          swap: deal.swap,
          exitDate: deal.closedAt,
        },
      });
    }
  }

  async sync(userId: string): Promise<{ account: string | null; synced: number }> {
    const integration = await this.prisma.integration.findFirst({
      where: { userId, provider: BROKER_PROVIDER, connected: true },
    });
    if (!integration) throw new BadRequestException('MT4/MT5 аккаунт не подключён');

    const meta = asBrokerMeta(integration.meta);
    if (!meta) throw new BadRequestException('Некорректные данные подключения');

    const spec: BrokerConnectionSpec = {
      apiProvider: meta.apiProvider,
      accountId: meta.accountId,
      login: meta.login,
      serverName: meta.serverName,
    };

    const to = new Date();
    const from = meta.lastSyncedAt
      ? new Date(new Date(meta.lastSyncedAt).getTime() + 1)
      : new Date(to.getTime() - 86_400_000);

    try {
      const deals = await this.getProvider(meta.apiProvider).fetchHistory(spec, from, to);
      await this.mirrorDeals(userId, deals);
      await this.updateMeta(integration.id, meta, to);
      return { account: meta.login, synced: deals.length };
    } catch (err) {
      await this.prisma.integration.update({
        where: { id: integration.id },
        data: {
          meta: {
            ...(meta as unknown as Record<string, unknown>),
            lastSyncError: err instanceof Error ? err.message : String(err),
          },
        },
      });
      throw err;
    }
  }

  private async updateMeta(
    integrationId: string,
    meta: BrokerMeta,
    to: Date,
  ) {
    await this.prisma.integration.update({
      where: { id: integrationId },
      data: {
        meta: {
          ...(meta as unknown as Record<string, unknown>),
          lastSyncedAt: to.toISOString(),
          lastSyncError: null,
        },
      },
    });
  }

  /**
   * Фоновая синхронизация: по каждому активному матчу RUNNING-турнира тянем
   * историю сделок игроков с подключёнными брокер-аккаунтами в окне матча.
   */
  async syncTournamentMatches() {
    if (this.syncing) return;
    this.syncing = true;
    try {
      const tournaments = await this.prisma.tournament.findMany({
        where: { status: 'RUNNING' },
        include: {
          rounds: {
            include: {
              matches: {
                where: { status: { in: ['PENDING', 'LIVE'] } },
                include: { playerA: true, playerB: true },
              },
            },
          },
        },
      });

      for (const tournament of tournaments) {
        for (const round of tournament.rounds) {
          for (const match of round.matches) {
            if (!match.startTime) continue;
            const to = new Date(
              Math.min(match.endTime?.getTime() ?? Infinity, Date.now()),
            );
            if (to.getTime() <= match.startTime.getTime()) continue;

            const users = [match.playerA, match.playerB].filter(
              (u): u is NonNullable<typeof u> => !!u,
            );
            for (const user of users) {
              const integration = await this.prisma.integration.findFirst({
                where: { userId: user.id, provider: BROKER_PROVIDER, connected: true },
              });
              if (!integration) continue;
              const meta = asBrokerMeta(integration.meta);
              if (!meta) continue;

              const from = new Date(
                Math.max(
                  match.startTime.getTime(),
                  meta.lastSyncedAt
                    ? new Date(meta.lastSyncedAt).getTime() + 1
                    : 0,
                ),
              );
              if (from.getTime() >= to.getTime()) continue;

              const spec: BrokerConnectionSpec = {
                apiProvider: meta.apiProvider,
                accountId: meta.accountId,
                login: meta.login,
                serverName: meta.serverName,
              };
              try {
                const deals = await this.getProvider(meta.apiProvider).fetchHistory(
                  spec,
                  from,
                  to,
                );
                if (deals.length) await this.mirrorDeals(user.id, deals);
                await this.updateMeta(integration.id, meta, to);
              } catch {
                // ошибка одного счёта не должна ронять весь воркер
              }
            }
          }
        }
      }
    } finally {
      this.syncing = false;
    }
  }
}
