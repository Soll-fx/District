import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type PostMortemFilters = {
  result?: string;
  asset?: string;
  q?: string;
  tradeId?: string;
};

@Injectable()
export class PostMortemsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string, filters: PostMortemFilters) {
    const where: Record<string, unknown> = { userId };
    if (filters.tradeId) where.tradeId = filters.tradeId;
    if (filters.result === 'win') where.pnl = { gt: 0 };
    if (filters.result === 'loss') where.pnl = { lt: 0 };
    if (filters.asset) {
      where.asset = { equals: filters.asset, mode: 'insensitive' };
    }
    if (filters.q?.trim()) {
      const q = filters.q.trim();
      where.OR = [
        { content: { contains: q, mode: 'insensitive' } },
        { asset: { contains: q, mode: 'insensitive' } },
      ];
    }
    return this.prisma.postMortem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, tradeId: string, content: string) {
    const trade = await this.prisma.trade.findFirst({
      where: { id: tradeId, userId },
    });
    if (!trade) throw new NotFoundException('Сделка не найдена');

    const existing = await this.prisma.postMortem.findFirst({
      where: { userId, tradeId },
    });
    if (existing) {
      return this.prisma.postMortem.update({
        where: { id: existing.id },
        data: { content },
      });
    }
    return this.prisma.postMortem.create({
      data: {
        userId,
        tradeId,
        asset: trade.asset,
        direction: trade.direction,
        pnl: trade.pnl,
        rMultiplier: trade.rMultiplier,
        content,
      },
    });
  }

  async update(userId: string, id: string, content: string) {
    await this.findOwned(userId, id);
    return this.prisma.postMortem.update({ where: { id }, data: { content } });
  }

  async remove(userId: string, id: string) {
    await this.findOwned(userId, id);
    await this.prisma.postMortem.delete({ where: { id } });
    return { deleted: true };
  }

  private async findOwned(userId: string, id: string) {
    const pm = await this.prisma.postMortem.findFirst({
      where: { id, userId },
    });
    if (!pm) throw new NotFoundException('Разбор не найден');
    return pm;
  }
}
