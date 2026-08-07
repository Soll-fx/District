import { Injectable, NotFoundException } from '@nestjs/common';
import { Direction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type AccountDto = {
  name: string;
  type?: string;
  balance?: number;
  currency?: string;
};

export type AccountStats = {
  trades: number;
  wins: number;
  losses: number;
  longs: number;
  shorts: number;
  winRate: number;
};

const emptyStats = (): AccountStats => ({
  trades: 0,
  wins: 0,
  losses: 0,
  longs: 0,
  shorts: 0,
  winRate: 0,
});

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const [accounts, trades] = await Promise.all([
      this.prisma.account.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { trades: true } } },
      }),
      this.prisma.trade.findMany({
        where: { userId, deletedAt: null },
        select: { accountId: true, direction: true, pnl: true },
      }),
    ]);

    const stats = new Map<string, AccountStats & { pnl: number }>();
    for (const t of trades) {
      if (!t.accountId) continue;
      const s = stats.get(t.accountId) ?? { ...emptyStats(), pnl: 0 };
      s.trades += 1;
      s.pnl += t.pnl;
      if (t.pnl > 0) s.wins += 1;
      else if (t.pnl < 0) s.losses += 1;
      if (t.direction === Direction.LONG) s.longs += 1;
      else s.shorts += 1;
      stats.set(t.accountId, s);
    }

    return accounts.map((a) => {
      const { pnl, ...agg } = stats.get(a.id) ?? { ...emptyStats(), pnl: 0 };
      return {
        ...a,
        currentBalance: Math.round((a.balance + pnl) * 100) / 100,
        stats: {
          ...agg,
          winRate: agg.trades ? Math.round((agg.wins / agg.trades) * 100) : 0,
        },
      };
    });
  }

  async findOwned(userId: string, id: string) {
    const account = await this.prisma.account.findFirst({ where: { id, userId } });
    if (!account) throw new NotFoundException('Счёт не найден');
    return account;
  }

  create(userId: string, dto: AccountDto) {
    return this.prisma.account.create({
      data: {
        userId,
        name: dto.name.trim(),
        type: dto.type?.trim() || 'Personal',
        balance: dto.balance ?? 0,
        currency: dto.currency?.trim() || 'USD',
      },
    });
  }

  async update(userId: string, id: string, dto: AccountDto) {
    await this.findOwned(userId, id);
    return this.prisma.account.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.balance !== undefined ? { balance: dto.balance } : {}),
        ...(dto.currency !== undefined ? { currency: dto.currency } : {}),
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOwned(userId, id);
    await this.prisma.account.delete({ where: { id } });
    return { deleted: true };
  }
}
