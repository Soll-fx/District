import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TradesService } from '../trades/trades.service';

@Injectable()
export class UsersAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trades: TradesService,
  ) {}

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
    const [u, stats, equity, tradesRaw] = await Promise.all([
      this.prisma.user.findUnique({ where: { id }, include: this.include }),
      this.trades.stats(id),
      this.trades.equityCurve(id, 365),
      this.prisma.trade.findMany({
        where: { userId: id, deletedAt: null },
        select: { asset: true, pnl: true },
      }),
    ]);
    if (!u) throw new NotFoundException('Пользователь не найден');

    const assetMap = new Map<string, { count: number; pnl: number }>();
    for (const t of tradesRaw) {
      const cur = assetMap.get(t.asset) ?? { count: 0, pnl: 0 };
      cur.count += 1;
      cur.pnl += t.pnl;
      assetMap.set(t.asset, cur);
    }
    const topAssets = Array.from(assetMap.entries())
      .map(([asset, v]) => ({ asset, ...v }))
      .sort((a, b) => b.count - a.count || b.pnl - a.pnl)
      .slice(0, 5);

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
      promos: u.promoRedemptions.map((r) => ({
        code: r.promo.code,
        activatedAt: r.createdAt,
      })),
      accounts: u.accounts ?? [],
      stats,
      equityPoints: equity.points,
      topAssets,
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
