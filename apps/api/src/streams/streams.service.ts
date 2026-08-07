import { unlink } from 'fs/promises';
import { join } from 'path';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateStreamDto,
  ToggleReactionDto,
  UpdateStreamDto,
} from './dto/stream.dto';

const EMOJI_ORDER = ['🔥', '❤️', '👍', '👏', '😮', '💀'];

@Injectable()
export class StreamsService {
  constructor(private readonly prisma: PrismaService) {}

  private async toView(
    stream: Awaited<ReturnType<typeof this.findById>>,
    userId?: string,
  ) {
    const streamId = stream!.id;
    const [rawReactions, myReactions] = await Promise.all([
      this.prisma.streamReaction.groupBy({
        by: ['emoji'],
        where: { streamId },
        _count: { emoji: true },
      }),
      userId
        ? this.prisma.streamReaction.findMany({
            where: { streamId, userId },
            select: { emoji: true },
          })
        : Promise.resolve([]),
    ]);

    const counts = new Map(rawReactions.map((r) => [r.emoji, r._count.emoji]));
    const mine = new Set(myReactions.map((r) => r.emoji));

    return {
      id: stream!.id,
      title: stream!.title,
      description: stream!.description,
      url: stream!.url,
      type: stream!.type,
      thumbnailUrl: stream!.thumbnailUrl,
      fileName: stream!.fileName,
      mimeType: stream!.mimeType,
      createdAt: stream!.createdAt,
      reactions: EMOJI_ORDER.map((emoji) => ({
        emoji,
        count: counts.get(emoji) ?? 0,
        mine: mine.has(emoji),
      })),
    };
  }

  private async findById(id: string) {
    const stream = await this.prisma.stream.findUnique({ where: { id } });
    if (!stream) throw new NotFoundException('Стрим не найден');
    return stream;
  }

  async findAll(userId: string) {
    const streams = await this.prisma.stream.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(streams.map((s) => this.toView(s, userId)));
  }

  async findOne(userId: string, id: string) {
    return this.toView(await this.findById(id), userId);
  }

  async create(userId: string, dto: CreateStreamDto) {
    const stream = await this.prisma.stream.create({
      data: {
        title: dto.title,
        description: dto.description ?? '',
        url: dto.url,
        type: dto.type ?? 'YOUTUBE',
        thumbnailUrl: dto.thumbnailUrl,
        fileName: dto.fileName,
        mimeType: dto.mimeType,
        createdById: userId,
      },
    });
    return this.toView(stream, userId);
  }

  async update(id: string, dto: UpdateStreamDto) {
    await this.findById(id);
    const stream = await this.prisma.stream.update({ where: { id }, data: dto });
    return this.toView(stream);
  }

  async uploadFile(file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Файл не передан');
    return {
      url: `/uploads/streams/${file.filename}`,
      fileName: file.originalname,
      mimeType: file.mimetype || 'application/octet-stream',
      size: file.size,
    };
  }

  async remove(id: string) {
    const stream = await this.findById(id);
    await this.prisma.stream.delete({ where: { id } });
    if (stream.url.startsWith('/uploads/')) {
      unlink(join(process.cwd(), stream.url)).catch(() => undefined);
    }
    return { ok: true };
  }

  async toggleReaction(userId: string, id: string, dto: ToggleReactionDto) {
    await this.findById(id);
    const existing = await this.prisma.streamReaction.findUnique({
      where: { streamId_userId_emoji: { streamId: id, userId, emoji: dto.emoji } },
    });

    if (existing) {
      await this.prisma.streamReaction.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.streamReaction.create({
        data: { streamId: id, userId, emoji: dto.emoji },
      });
    }
    return this.findOne(userId, id);
  }
}
