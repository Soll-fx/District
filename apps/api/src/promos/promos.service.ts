import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromoDto, UpdatePromoDto } from './dto/promo.dto';

@Injectable()
export class PromosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const promos = await this.prisma.promoCode.findMany({
      include: { _count: { select: { redemptions: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return promos.map((p) => ({
      id: p.id,
      code: p.code,
      durationDays: p.durationDays,
      isActive: p.isActive,
      createdAt: p.createdAt,
      userCount: p._count.redemptions,
    }));
  }

  async create(userId: string, dto: CreatePromoDto) {
    const normalized = dto.code.trim().toUpperCase();
    try {
      const promo = await this.prisma.promoCode.create({
        data: {
          code: normalized,
          durationDays: dto.durationDays ?? 30,
          createdById: userId,
        },
      });
      return { ...promo, userCount: 0 };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Промокод с таким кодом уже существует');
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdatePromoDto) {
    const existing = await this.prisma.promoCode.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Промокод не найден');

    const promo = await this.prisma.promoCode.update({
      where: { id },
      data: {
        isActive: dto.isActive,
        durationDays: dto.durationDays,
      },
    });
    const count = await this.prisma.promoRedemption.count({ where: { promoId: id } });
    return { ...promo, userCount: count };
  }

  async remove(id: string) {
    const existing = await this.prisma.promoCode.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Промокод не найден');
    await this.prisma.promoCode.delete({ where: { id } });
    return { ok: true };
  }
}
