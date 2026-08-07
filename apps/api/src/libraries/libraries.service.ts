import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAssetDto,
  CreateStrategyDto,
  CreateTagDto,
} from './dto/library.dto';

@Injectable()
export class LibrariesService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Теги ──
  async listTags(userId: string) {
    return this.prisma.tag.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async createTag(userId: string, dto: CreateTagDto) {
    try {
      return await this.prisma.tag.create({
        data: { userId, name: dto.name, color: dto.color ?? '#7C6CF0' },
      });
    } catch {
      throw new BadRequestException('Тег с таким именем уже существует');
    }
  }

  async updateTag(userId: string, id: string, dto: CreateTagDto) {
    await this.ensureOwned('tag', userId, id);
    return this.prisma.tag.update({
      where: { id },
      data: { name: dto.name, color: dto.color },
    });
  }

  async deleteTag(userId: string, id: string) {
    await this.ensureOwned('tag', userId, id);
    await this.prisma.tag.delete({ where: { id } });
    return { deleted: true };
  }

  // ── Активы ──
  async listAssets(userId: string) {
    return this.prisma.asset.findMany({
      where: { OR: [{ userId }, { userId: null }] },
      orderBy: { name: 'asc' },
    });
  }

  async createAsset(userId: string, dto: CreateAssetDto) {
    return this.prisma.asset.create({
      data: {
        userId,
        ...dto,
        color: dto.color ?? '#7C6CF0',
        category: dto.category ?? 'other',
      },
    });
  }

  async deleteAsset(userId: string, id: string) {
    await this.ensureOwned('asset', userId, id);
    await this.prisma.asset.delete({ where: { id } });
    return { deleted: true };
  }

  // ── Стратегии ──
  async listStrategies(userId: string) {
    return this.prisma.strategy.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async createStrategy(userId: string, dto: CreateStrategyDto) {
    return this.prisma.strategy.create({
      data: { userId, ...dto, color: dto.color ?? '#14B8A6' },
    });
  }

  async deleteStrategy(userId: string, id: string) {
    await this.ensureOwned('strategy', userId, id);
    await this.prisma.strategy.delete({ where: { id } });
    return { deleted: true };
  }

  private async ensureOwned(
    model: 'tag' | 'asset' | 'strategy',
    userId: string,
    id: string,
  ) {
    const where = { id, userId };
    let record: unknown = null;
    switch (model) {
      case 'tag':
        record = await this.prisma.tag.findFirst({ where });
        break;
      case 'asset':
        record = await this.prisma.asset.findFirst({ where });
        break;
      case 'strategy':
        record = await this.prisma.strategy.findFirst({ where });
        break;
    }
    if (!record) throw new NotFoundException('Элемент не найден');
  }
}
