import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersAdminService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly include = {
    promoRedemptions: {
      include: { promo: { select: { code: true } } },
      orderBy: { createdAt: 'asc' as const },
    },
    accounts: { select: { name: true, balance: true, currency: true } },
  };

  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: this.include,
    });
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      avatarUrl: u.avatarUrl,
      role: u.role,
      locale: u.locale,
      twoFactorEnabled: u.twoFactorEnabled,
      createdAt: u.createdAt,
      banned: u.banned,
      country: u.country,
      promoCode: u.promoRedemptions[0]?.promo.code ?? null,
      promoActivatedAt: u.promoRedemptions[0]?.createdAt ?? null,
      balance:
        u.accounts?.reduce((s, a) => s + (a.currency === 'USD' ? a.balance : 0), 0) ?? null,
    }));
  }

  async findOne(id: string) {
    const [u, tradeStats] = await Promise.all([
      this.prisma.user.findUnique({ where: { id }, include: this.include }),
      this.prisma.trade.aggregate({
        where: { userId: id },
        _count: { _all: true },
        _sum: { pnl: true },
      }),
    ]);
    if (!u) throw new NotFoundException('Пользователь не найден');

    return {
      id: u.id,
      email: u.email,
      name: u.name,
      avatarUrl: u.avatarUrl,
      role: u.role,
      locale: u.locale,
      timezone: u.timezone,
      instagram: u.instagram,
      telegram: u.telegram,
      youtube: u.youtube,
      tradingview: u.tradingview,
      twoFactorEnabled: u.twoFactorEnabled,
      createdAt: u.createdAt,
      banned: u.banned,
      bannedAt: u.bannedAt,
      country: u.country,
      stats: {
        tradesCount: tradeStats._count._all,
        totalPnl: tradeStats._sum.pnl ?? 0,
      },
      promos: u.promoRedemptions.map((r) => ({
        code: r.promo.code,
        activatedAt: r.createdAt,
      })),
      accounts: u.accounts ?? [],
    };
  }

  async setBan(id: string, banned: boolean) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Пользователь не найден');

    const user = await this.prisma.user.update({
      where: { id },
      data: { banned, bannedAt: banned ? new Date() : null },
    });

    if (banned) {
      await this.prisma.session.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return { id: user.id, banned: user.banned };
  }
}
