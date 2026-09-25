import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TradesService } from '../trades/trades.service';
import { RewardsService } from '../rewards/rewards.service';

const ONLINE_MS = 5 * 60 * 1000;

@Injectable()
export class UsersAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trades: TradesService,
    private readonly rewards: RewardsService,
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
      telegramId: u.telegramId,
      telegramUsername: u.telegramUsername,
      tgAccess: u.role === 'ADMIN' ? true : u.tgAccess,
      lastSeenAt: u.lastSeenAt,
      promoCode: u.promoRedemptions[0]?.promo.code ?? null,
      promoActivatedAt: u.promoRedemptions[0]?.createdAt ?? null,
      balance:
        u.accounts?.reduce((s, a) => s + (a.currency === 'USD' ? a.balance : 0), 0) ?? null,
    }));
  }

  async findOne(id: string) {
    const [u, stats, equity, tradesRaw, lb] = await Promise.all([
      this.prisma.user.findUnique({ where: { id }, include: this.include }),
      this.trades.stats(id),
      this.trades.equityCurve(id, 365),
      this.prisma.trade.findMany({
        where: { userId: id, deletedAt: null },
        select: { asset: true, pnl: true },
      }),
      this.rewards.leaderboard(id).then((r) => r.users.find((x) => x.id === id)),
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
      telegramId: u.telegramId,
      telegramUsername: u.telegramUsername,
      telegramPhoto: u.telegramPhoto,
      tgAccess: u.role === 'ADMIN' ? true : u.tgAccess,
      tgAccessGrantedAt: u.tgAccessGrantedAt,
      tgAccessRevokedAt: u.tgAccessRevokedAt,
      lastSeenAt: u.lastSeenAt,
      online: u.lastSeenAt
        ? Date.now() - u.lastSeenAt.getTime() < ONLINE_MS
        : false,
      rank: lb?.rank ?? null,
      score: lb?.score ?? null,
      netPnl: lb?.totalPnl ?? null,
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

  async setTgAccess(id: string, access: boolean) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Пользователь не найден');
    if (existing.role === 'ADMIN' && !access) {
      throw new ConflictException('Нельзя отозвать доступ у администратора');
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        tgAccess: access,
        tgAccessGrantedAt: access ? new Date() : null,
        tgAccessRevokedAt: access ? null : new Date(),
      },
    });

    if (!access) {
      await this.prisma.session.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return {
      id: user.id,
      tgAccess: user.role === 'ADMIN' ? true : user.tgAccess,
      tgAccessGrantedAt: user.tgAccessGrantedAt,
      tgAccessRevokedAt: user.tgAccessRevokedAt,
    };
  }

  async tgList() {
    const [users, trades, admins] = await Promise.all([
      this.prisma.user.findMany({
        where: { telegramId: { not: null } },
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          role: true,
          telegramId: true,
          telegramUsername: true,
          telegramPhoto: true,
          tgAccess: true,
          tgAccessGrantedAt: true,
          tgAccessRevokedAt: true,
          lastSeenAt: true,
        },
        orderBy: { lastSeenAt: 'desc' },
      }),
      this.prisma.trade.findMany({
        where: { deletedAt: null },
        select: { userId: true, asset: true },
      }),
      this.prisma.user.findFirst({ where: { role: 'ADMIN' } }),
    ]);

    const lb = await this.rewards.leaderboard(admins?.id ?? '');
    const lbMap = new Map(
      lb.users.map((u) => [
        u.id,
        {
          rank: u.rank,
          totalPnl: u.totalPnl,
          score: u.score,
          winRate: u.winRate,
          count: u.count,
        },
      ]),
    );

    const assetMap = new Map<string, Map<string, number>>();
    for (const t of trades) {
      const m = assetMap.get(t.userId) ?? new Map<string, number>();
      m.set(t.asset, (m.get(t.asset) ?? 0) + 1);
      assetMap.set(t.userId, m);
    }

    const now = Date.now();
    return users.map((u) => {
      const counts = assetMap.get(u.id);
      const topAsset = counts
        ? [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
        : null;
      const meta = lbMap.get(u.id);
      const protectedAdmin = u.role === 'ADMIN';
      return {
        id: u.id,
        name: u.name,
        avatarUrl: u.avatarUrl,
        telegramId: u.telegramId,
        telegramUsername: u.telegramUsername,
        tgAccess: protectedAdmin ? true : u.tgAccess,
        tgAccessGrantedAt: u.tgAccessGrantedAt,
        tgAccessRevokedAt: u.tgAccessRevokedAt,
        lastSeenAt: u.lastSeenAt,
        online: u.lastSeenAt ? now - u.lastSeenAt.getTime() < ONLINE_MS : false,
        netPnl: meta?.totalPnl ?? null,
        rank: meta?.rank ?? null,
        score: meta?.score ?? null,
        winRate: meta?.winRate ?? null,
        count: meta?.count ?? 0,
        topAsset,
        protected: protectedAdmin,
      };
    });
  }
}