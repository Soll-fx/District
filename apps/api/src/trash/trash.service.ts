import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TrashService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const [trades, ideas] = await Promise.all([
      this.prisma.trade.findMany({
        where: { userId, deletedAt: { not: null } },
        include: { tags: { include: { tag: true } } },
        orderBy: { deletedAt: 'desc' },
      }),
      this.prisma.idea.findMany({
        where: { userId, deletedAt: { not: null } },
        orderBy: { deletedAt: 'desc' },
      }),
    ]);

    return {
      trades: trades.map((t) => ({
        id: t.id,
        kind: 'trade',
        title: `${t.asset} · ${t.direction}`,
        deletedAt: t.deletedAt,
        meta: { pnl: t.pnl, session: t.session },
      })),
      ideas: ideas.map((i) => ({
        id: i.id,
        kind: 'idea',
        title: `${i.asset} · ${i.direction}`,
        deletedAt: i.deletedAt,
        meta: { status: i.status },
      })),
    };
  }

  async purgeAll(userId: string) {
    const [trades, ideas] = await Promise.all([
      this.prisma.trade.deleteMany({
        where: { userId, deletedAt: { not: null } },
      }),
      this.prisma.idea.deleteMany({
        where: { userId, deletedAt: { not: null } },
      }),
    ]);
    return { trades: trades.count, ideas: ideas.count };
  }
}
