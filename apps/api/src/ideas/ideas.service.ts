import { Injectable, NotFoundException } from '@nestjs/common';
import { IdeaStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateIdeaDto, UpdateIdeaDto, QueryIdeasDto } from './dto/idea.dto';

@Injectable()
export class IdeasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateIdeaDto) {
    return this.prisma.idea.create({
      data: {
        userId,
        asset: dto.asset,
        direction: dto.direction,
        entry: dto.entry,
        tp: dto.tp,
        sl: dto.sl,
        thesis: dto.thesis,
        tvLink: dto.tvLink,
        status: dto.status ?? IdeaStatus.WATCH,
      },
    });
  }

  async findAll(userId: string, query: QueryIdeasDto) {
    const where: Prisma.IdeaWhereInput = {
      userId,
      deletedAt: query.includeDeleted === 'true' ? undefined : null,
    };
    if (query.status) where.status = query.status;

    const [items, total] = await Promise.all([
      this.prisma.idea.findMany({ where, orderBy: { createdAt: 'desc' } }),
      this.prisma.idea.count({ where }),
    ]);

    return { items, total };
  }

  async stats(userId: string) {
    const ideas = await this.prisma.idea.findMany({
      where: { userId, deletedAt: null },
    });
    const closed = ideas.filter(
      (i) => i.status === IdeaStatus.HIT || i.status === IdeaStatus.INVALID,
    );
    const accuracy = closed.length
      ? (ideas.filter((i) => i.status === IdeaStatus.HIT).length /
          closed.length) *
        100
      : 0;

    return {
      total: ideas.length,
      watch: ideas.filter((i) => i.status === IdeaStatus.WATCH).length,
      hit: ideas.filter((i) => i.status === IdeaStatus.HIT).length,
      invalid: ideas.filter((i) => i.status === IdeaStatus.INVALID).length,
      archive: ideas.filter((i) => i.status === IdeaStatus.ARCHIVE).length,
      accuracy,
    };
  }

  async updateStatus(userId: string, id: string, status: IdeaStatus) {
    await this.findOne(userId, id);
    const updated = await this.prisma.idea.update({
      where: { id },
      data: { status },
    });
    if (status === IdeaStatus.HIT) {
      this.notifications.sendIdeaAlert(userId, {
        title: 'Идея сработала',
        body: `${updated.asset} · ${directionLabel(updated.direction)} — цель достигнута`,
        url: '/ideas',
      });
    }
    return updated;
  }

  async update(userId: string, id: string, dto: UpdateIdeaDto) {
    const idea = await this.findOne(userId, id);
    const data: Record<string, unknown> = {};
    if (dto.asset !== undefined) data.asset = dto.asset.trim().toUpperCase();
    if (dto.direction !== undefined) data.direction = dto.direction;
    if (dto.entry !== undefined) data.entry = dto.entry;
    if (dto.tp !== undefined) data.tp = dto.tp;
    if (dto.sl !== undefined) data.sl = dto.sl;
    if (dto.thesis !== undefined) data.thesis = dto.thesis;
    if (dto.tvLink !== undefined) data.tvLink = dto.tvLink;
    const updated = await this.prisma.idea.update({ where: { id }, data });

    if (idea.convertedTradeId) {
      const tradeData: Record<string, unknown> = {};
      if (dto.asset !== undefined) tradeData.asset = dto.asset.trim().toUpperCase();
      if (dto.direction !== undefined) tradeData.direction = dto.direction;
      if (dto.entry !== undefined) tradeData.entry = parseFloat(dto.entry) || undefined;
      if (dto.tvLink !== undefined) tradeData.link = dto.tvLink || undefined;
      if (Object.keys(tradeData).length > 0) {
        await this.prisma.trade.update({ where: { id: idea.convertedTradeId }, data: tradeData });
      }
    }

    return updated;
  }

  async convertToTrade(userId: string, id: string, pnl?: number) {
    const idea = await this.findOne(userId, id);

    const trade = await this.prisma.trade.create({
      data: {
        userId,
        asset: idea.asset,
        direction: idea.direction,
        entry: idea.entry ? parseFloat(idea.entry) || undefined : undefined,
        entryDate: new Date(),
        pnl: pnl ?? 0,
        link: idea.tvLink ?? undefined,
      },
    });

    await this.prisma.idea.update({
      where: { id },
      data: { status: IdeaStatus.HIT, convertedTradeId: trade.id },
    });

    this.notifications.sendIdeaAlert(userId, {
      title: 'Идея отработала',
      body: `${idea.asset} · ${directionLabel(idea.direction)} — конвертировано в сделку`,
      url: '/ideas',
    });

    return { idea, trade };
  }

  async softDelete(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.idea.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { deleted: true };
  }

  async restore(userId: string, id: string) {
    const idea = await this.prisma.idea.findFirst({
      where: { id, userId, deletedAt: { not: null } },
    });
    if (!idea) throw new NotFoundException('Идея в корзине не найдена');
    await this.prisma.idea.update({ where: { id }, data: { deletedAt: null } });
    return { restored: true };
  }

  private async findOne(userId: string, id: string) {
    const idea = await this.prisma.idea.findFirst({ where: { id, userId } });
    if (!idea) throw new NotFoundException('Идея не найдена');
    return idea;
  }
}

function directionLabel(direction: string) {
  return direction === 'LONG' ? 'Long' : 'Short';
}
