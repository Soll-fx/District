import { Injectable, NotFoundException } from '@nestjs/common';
import { Direction, Prisma, TradeSession } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTradeDto,
  QueryTradesDto,
  UpdateTradeDto,
} from './dto/trade.dto';

@Injectable()
export class TradesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTradeDto) {
    const trade = await this.prisma.trade.create({
      data: {
        userId,
        asset: dto.asset,
        direction: dto.direction,
        entry: dto.entry,
        exit: dto.exit,
        lots: dto.lots,
        pnl: dto.pnl ?? 0,
        rMultiplier: dto.rMultiplier,
        session: dto.session,
        entryDate: dto.entryDate ? new Date(dto.entryDate) : new Date(),
        exitDate: dto.exitDate ? new Date(dto.exitDate) : undefined,
        accountId: dto.accountId ?? undefined,
        notes: dto.notes,
        link: dto.link,
        flagged: dto.flagged ?? false,
        tags: dto.tagIds?.length
          ? { create: dto.tagIds.map((tagId) => ({ tagId })) }
          : undefined,
      },
      include: { tags: { include: { tag: true } }, account: true },
    });
    return this.serialize(trade);
  }

  async findAll(userId: string, query: QueryTradesDto) {
    const includeDeleted = query.includeDeleted === 'true';

    const where: Prisma.TradeWhereInput = {
      userId,
      deletedAt: includeDeleted ? undefined : null,
    };

    if (query.session) where.session = query.session;
    if (query.direction) where.direction = query.direction;
    if (query.result === 'pos') where.pnl = { gt: 0 };
    if (query.result === 'neg') where.pnl = { lt: 0 };
    if (query.query)
      where.asset = { contains: query.query, mode: 'insensitive' };
    if (query.account)
      where.account = {
        name: { contains: query.account, mode: 'insensitive' },
      };

    const orderBy: Prisma.TradeOrderByWithRelationInput =
      query.sort === 'pnl'
        ? { pnl: 'desc' }
        : query.sort === 'r'
          ? { rMultiplier: 'desc' }
          : { entryDate: 'desc' };

    const [trades, total] = await Promise.all([
      this.prisma.trade.findMany({
        where,
        orderBy,
        take: query.take ?? 100,
        skip: query.skip ?? 0,
        include: { tags: { include: { tag: true } }, account: true },
      }),
      this.prisma.trade.count({ where }),
    ]);

    return {
      items: trades.map((t) => this.serialize(t)),
      total,
      shown: trades.length,
    };
  }

  async findOne(userId: string, id: string) {
    const trade = await this.prisma.trade.findFirst({
      where: { id, userId },
      include: { tags: { include: { tag: true } }, account: true },
    });
    if (!trade) throw new NotFoundException('Сделка не найдена');
    return this.serialize(trade);
  }

  async update(userId: string, id: string, dto: UpdateTradeDto) {
    await this.findOne(userId, id);

    const trade = await this.prisma.trade.update({
      where: { id },
      data: {
        asset: dto.asset,
        direction: dto.direction,
        entry: dto.entry,
        exit: dto.exit,
        lots: dto.lots,
        pnl: dto.pnl,
        rMultiplier: dto.rMultiplier,
        session: dto.session,
        entryDate: dto.entryDate ? new Date(dto.entryDate) : undefined,
        exitDate: dto.exitDate ? new Date(dto.exitDate) : undefined,
        accountId: dto.accountId,
        notes: dto.notes,
        link: dto.link,
        flagged: dto.flagged,
      },
      include: { tags: { include: { tag: true } }, account: true },
    });
    return this.serialize(trade);
  }

  async softDelete(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.trade.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { deleted: true };
  }

  async restore(userId: string, id: string) {
    const trade = await this.prisma.trade.findFirst({
      where: { id, userId, deletedAt: { not: null } },
    });
    if (!trade) throw new NotFoundException('Сделка в корзине не найдена');
    await this.prisma.trade.update({
      where: { id },
      data: { deletedAt: null },
    });
    return { restored: true };
  }

  async purge(userId: string, id: string) {
    const trade = await this.prisma.trade.findFirst({
      where: { id, userId, deletedAt: { not: null } },
    });
    if (!trade) throw new NotFoundException('Сделка в корзине не найдена');
    await this.prisma.trade.delete({ where: { id } });
    return { purged: true };
  }

  async stats(userId: string) {
    const trades = await this.prisma.trade.findMany({
      where: { userId, deletedAt: null },
    });
    const closed = trades.filter((t) => t.pnl !== 0 || t.exitDate);

    const totalPnl = closed.reduce((s, t) => s + t.pnl, 0);
    const wins = closed.filter((t) => t.pnl > 0).length;
    const winRate = closed.length ? (wins / closed.length) * 100 : 0;
    const avgR = closed.length
      ? closed.reduce((s, t) => s + (t.rMultiplier ?? 0), 0) / closed.length
      : 0;

    const winPnl = closed.filter((t) => t.pnl > 0).map((t) => t.pnl);
    const lossPnl = closed.filter((t) => t.pnl < 0).map((t) => Math.abs(t.pnl));
    const grossProfit = winPnl.reduce((s, v) => s + v, 0);
    const grossLoss = lossPnl.reduce((s, v) => s + v, 0);
    const profitFactor =
      grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

    const maxDrawdown = this.maxDrawdown(
      closed
        .sort((a, b) => a.entryDate.getTime() - b.entryDate.getTime())
        .map((t) => t.pnl),
    );

    return {
      totalPnl,
      winRate,
      avgR,
      count: closed.length,
      wins,
      losses: closed.length - wins,
      profitFactor,
      avgWin: winPnl.length ? grossProfit / winPnl.length : 0,
      avgLoss: lossPnl.length ? grossLoss / lossPnl.length : 0,
      maxWin: winPnl.length ? Math.max(...winPnl) : 0,
      maxLoss: lossPnl.length ? Math.min(...lossPnl.map((v) => -v)) : 0,
      maxDrawdown,
      sessions: closed.reduce<Record<string, { count: number; pnl: number }>>(
        (acc, t) => {
          const key = t.session ?? TradeSession.LONDON;
          acc[key] = acc[key] ?? { count: 0, pnl: 0 };
          acc[key].count += 1;
          acc[key].pnl += t.pnl;
          return acc;
        },
        {},
      ),
      byMonth: closed.reduce<Record<string, { count: number; pnl: number }>>(
        (acc, t) => {
          const key = t.entryDate.toISOString().slice(0, 7);
          acc[key] = acc[key] ?? { count: 0, pnl: 0 };
          acc[key].count += 1;
          acc[key].pnl += t.pnl;
          return acc;
        },
        {},
      ),
      longCount: closed.filter((t) => t.direction === Direction.LONG).length,
      shortCount: closed.filter((t) => t.direction === Direction.SHORT).length,
    };
  }

  async equityCurve(userId: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const trades = await this.prisma.trade.findMany({
      where: { userId, deletedAt: null },
    });
    const closed = trades
      .filter((t) => t.pnl !== 0 || t.exitDate)
      .filter((t) => (t.exitDate ?? t.entryDate).getTime() >= since.getTime())
      .sort(
        (a, b) =>
          (a.exitDate ?? a.entryDate).getTime() -
          (b.exitDate ?? b.entryDate).getTime(),
      );

    let pnl = 0;
    const points: { date: string; balance: number }[] = [];
    if (closed.length) {
      points.push({ date: since.toISOString(), balance: 0 });
    }
    for (const t of closed) {
      pnl += t.pnl;
      points.push({ date: (t.exitDate ?? t.entryDate).toISOString(), balance: pnl });
    }
    if (!points.length) {
      points.push({ date: since.toISOString(), balance: pnl });
    }
    return { points, count: closed.length };
  }

  private serialize(trade: {
    id: string;
    asset: string;
    direction: Direction;
    entry: number | null;
    exit: number | null;
    lots: number | null;
    pnl: number;
    rMultiplier: number | null;
    session: TradeSession | null;
    entryDate: Date;
    exitDate: Date | null;
    notes: string | null;
    link: string | null;
    flagged: boolean;
    accountId: string | null;
    deletedAt: Date | null;
    createdAt: Date;
    tags?: { tag: { id: string; name: string; color: string } }[];
    account?: { id: string; name: string } | null;
  }) {
    return {
      ...trade,
      tags: trade.tags?.map((t) => t.tag) ?? [],
    };
  }

  private maxDrawdown(pnlSeries: number[]) {
    let peak = 0;
    let maxDd = 0;
    let running = 0;
    for (const p of pnlSeries) {
      running += p;
      peak = Math.max(peak, running);
      maxDd = Math.max(maxDd, peak - running);
    }
    return maxDd;
  }
}
