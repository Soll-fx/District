import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const METRIC_DEFS = [
  { key: 'volume', label: 'Объём торгов', category: 'TRADING' as const },
  { key: 'streak', label: 'Серия сделок', category: 'TRADING' as const },
  { key: 'consistency', label: 'Consistency score', category: 'TRADING' as const },
];

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return `$${n.toLocaleString('en-US')}`;
}

function disciplineScore(closed: { rMultiplier: number | null; pnl: number }[]): number {
  if (!closed.length) return 0;
  const noPlan = closed.filter((t) => t.pnl < 0 && (t.rMultiplier ?? 0) <= -2).length;
  return Math.max(0, Math.min(100, Math.round(100 - (noPlan / closed.length) * 100)));
}

function streakOf(sorted: { pnl: number; exitDate: Date | null }[]): number {
  let streak = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const pnl = sorted[i].pnl;
    if (pnl === 0) continue;
    if (streak === 0) {
      streak = pnl > 0 ? 1 : -1;
      continue;
    }
    if ((pnl > 0) === (streak > 0)) streak += streak > 0 ? 1 : -1;
    else break;
  }
  return streak;
}

@Injectable()
export class RewardsService {
  constructor(private readonly prisma: PrismaService) {}

  private async computeValues(userId: string) {
    const trades = await this.prisma.trade.findMany({
      where: { userId, deletedAt: null },
    });
    const closed = trades.filter((t) => t.pnl !== 0 || t.exitDate);
    const wins = closed.filter((t) => t.pnl > 0).length;
    const winRate = closed.length ? Math.round((wins / closed.length) * 100) : 0;
    const volume = closed.reduce(
      (s, t) => s + Math.abs((t.entry ?? 0) * (t.lots ?? 1)),
      0,
    );

    const sorted = [...closed].sort(
      (a, b) => (a.exitDate?.getTime() ?? 0) - (b.exitDate?.getTime() ?? 0),
    );
    const streak = streakOf(sorted);

    return {
      volume: formatMoney(volume),
      streak: streak > 0 ? `+${streak}` : String(streak),
      consistency: `${winRate}%`,
    };
  }

  private async syncMetrics(userId: string) {
    const values = await this.computeValues(userId);
    const existing = await this.prisma.profileMetric.findMany({ where: { userId } });
    const visibleByKey = new Map(existing.map((m) => [m.key, m.visible]));

    for (let i = 0; i < METRIC_DEFS.length; i++) {
      const def = METRIC_DEFS[i];
      const prevVisible = visibleByKey.get(def.key);
      await this.prisma.profileMetric.upsert({
        where: { userId_key: { userId, key: def.key } },
        create: {
          userId,
          key: def.key,
          label: def.label,
          value: values[def.key],
          category: def.category,
          visible: prevVisible ?? true,
          order: i,
        },
        update: {
          label: def.label,
          value: values[def.key],
          category: def.category,
          order: i,
        },
      });
    }

    const stale = existing
      .filter((m) => !METRIC_DEFS.some((d) => d.key === m.key))
      .map((m) => m.id);
    if (stale.length) {
      await this.prisma.profileMetric.deleteMany({ where: { id: { in: stale } } });
    }

    return this.prisma.profileMetric.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
    });
  }

  async metrics(userId: string) {
    return this.syncMetrics(userId);
  }

  async leaderboard(userId: string) {
    const users = await this.prisma.user.findMany({
      include: {
        trades: { where: { deletedAt: null } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const rows = users.map((u) => {
      const closed = u.trades.filter((t) => t.pnl !== 0 || t.exitDate);
      const wins = closed.filter((t) => t.pnl > 0).length;
      const grossProfit = closed.filter((t) => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
      const grossLoss = Math.abs(closed.filter((t) => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
      const winRate = closed.length ? (wins / closed.length) * 100 : 0;
      const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : closed.length ? grossProfit : 0;
      const avgR = closed.length
        ? closed.reduce((s, t) => s + (t.rMultiplier ?? 0), 0) / closed.length
        : 0;
      const totalPnl = closed.reduce((s, t) => s + t.pnl, 0);
      const volume = closed.reduce((s, t) => s + Math.abs((t.entry ?? 0) * (t.lots ?? 1)), 0);
      const sorted = [...closed].sort(
        (a, b) => (a.exitDate?.getTime() ?? 0) - (b.exitDate?.getTime() ?? 0),
      );

      return {
        user: u,
        count: closed.length,
        winRate,
        profitFactor,
        avgR,
        totalPnl,
        volume,
        streak: streakOf(sorted),
        discipline: disciplineScore(closed),
      };
    });

    const maxVolume = Math.max(1, ...rows.map((r) => r.volume));

    const scored = rows
      .map((r) => {
        const pfScore = (Math.min(r.profitFactor, 4) / 4) * 100;
        const avgRScore = (Math.max(0, Math.min(r.avgR, 3)) / 3) * 100;
        const volumeScore = (Math.min(Math.log10(r.volume + 1) / Math.log10(maxVolume + 1), 1)) * 100;
        return {
          ...r,
          score: Math.round(
            ((r.discipline * 0.25 +
              r.winRate * 0.2 +
              pfScore * 0.2 +
              avgRScore * 0.15 +
              volumeScore * 0.1) /
              0.9),
          ),
        };
      })
      .sort((a, b) => b.score - a.score || b.totalPnl - a.totalPnl);

    const list = scored.map((r, i) => ({
      id: r.user.id,
      name: r.user.name,
      avatarUrl: r.user.avatarUrl,
      rank: i + 1,
      score: r.score,
      count: r.count,
      winRate: Number(r.winRate.toFixed(1)),
      profitFactor: Number(r.profitFactor.toFixed(2)),
      avgR: Number(r.avgR.toFixed(2)),
      totalPnl: Number(r.totalPnl.toFixed(2)),
      volume: formatMoney(r.volume),
      streak: r.streak,
      discipline: r.discipline,
    }));

    return {
      users: list,
      total: list.length,
      me: list.find((x) => x.id === userId) ?? null,
    };
  }

  async toggleMetric(userId: string, key: string) {
    const metric = await this.prisma.profileMetric.findUnique({
      where: { userId_key: { userId, key } },
    });
    if (!metric) throw new NotFoundException('Метрика не найдена');
    return this.prisma.profileMetric.update({
      where: { id: metric.id },
      data: { visible: !metric.visible },
    });
  }

  async achievements(userId: string) {
    return this.prisma.achievement.findMany({
      where: { userId },
      include: {
        reactions: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { awardedAt: 'desc' },
    });
  }

  async react(userId: string, achievementId: string, emoji: string) {
    const achievement = await this.prisma.achievement.findUnique({
      where: { id: achievementId },
    });
    if (!achievement) throw new NotFoundException('Достижение не найдено');

    const existing = await this.prisma.reaction.findUnique({
      where: { achievementId_userId_emoji: { achievementId, userId, emoji } },
    });

    if (existing) {
      await this.prisma.reaction.delete({ where: { id: existing.id } });
      return { reacted: false, emoji };
    }

    await this.prisma.reaction.create({
      data: { achievementId, userId, emoji },
    });
    return { reacted: true, emoji };
  }

  async feed(userId: string) {
    const achievements = await this.prisma.achievement.findMany({
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        reactions: true,
      },
      orderBy: { awardedAt: 'desc' },
      take: 20,
    });

    return achievements.map((a) => ({
      id: a.id,
      user: a.user.name,
      avatarUrl: a.user.avatarUrl,
      action: a.title,
      description: a.description,
      time: a.awardedAt,
      meReacted: a.reactions.some((r) => r.userId === userId),
      reactions: a.reactions.reduce<{ emoji: string; count: number }[]>(
        (acc, r) => {
          const found = acc.find((x) => x.emoji === r.emoji);
          if (found) found.count += 1;
          else acc.push({ emoji: r.emoji, count: 1 });
          return acc;
        },
        [],
      ),
    }));
  }
}
