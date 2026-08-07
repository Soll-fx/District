import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(userId: string) {
    const trades = await this.prisma.trade.findMany({
      where: { userId, deletedAt: null },
    });
    const closed = trades.filter((t) => t.pnl !== 0 || t.exitDate);
    const wins = closed.filter((t) => t.pnl > 0).length;
    const winRate = closed.length ? (wins / closed.length) * 100 : 0;

    const grossProfit = closed
      .filter((t) => t.pnl > 0)
      .reduce((s, t) => s + t.pnl, 0);
    const grossLoss = Math.abs(
      closed.filter((t) => t.pnl < 0).reduce((s, t) => s + t.pnl, 0),
    );
    const profitFactor =
      grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

    const avgWin = closed.filter((t) => t.pnl > 0).length
      ? grossProfit / closed.filter((t) => t.pnl > 0).length
      : 0;
    const avgLoss = closed.filter((t) => t.pnl < 0).length
      ? grossLoss / closed.filter((t) => t.pnl < 0).length
      : 0;

    const sorted = [...closed].sort(
      (a, b) => a.entryDate.getTime() - b.entryDate.getTime(),
    );
    const pnlSeries = sorted.map((t) => t.pnl);
    const drawdown = this.maxDrawdown(pnlSeries);

    const discipline = this.disciplineScore(closed);

    // Пульс эффективности — 6 осей
    const axes = [
      { key: 'wr', label: 'Винрейт', value: Math.round(winRate) },
      {
        key: 'pf',
        label: 'Профит-фактор',
        value: this.scale(profitFactor, 0, 4),
      },
      {
        key: 'risk',
        label: 'Риск:прибыль',
        value: this.scale(avgLoss > 0 ? avgWin / avgLoss : 4, 0, 4),
      },
      {
        key: 'stab',
        label: 'Стабильность',
        value: this.stabilityScore(pnlSeries),
      },
      { key: 'disc', label: 'Дисциплина', value: discipline },
      {
        key: 'rec',
        label: 'Восстановление',
        value: this.recoveryScore(pnlSeries),
      },
    ];
    const overall = Math.round(
      axes.reduce((s, a) => s + a.value, 0) / axes.length,
    );
    const grade =
      overall >= 85
        ? 'A'
        : overall >= 70
          ? 'B+'
          : overall >= 55
            ? 'B'
            : overall >= 40
              ? 'C'
              : 'D';

    return {
      overall,
      grade,
      axes,
      winRate,
      profitFactor,
      avgWin,
      avgLoss,
      maxWin: closed.length ? Math.max(...closed.map((t) => t.pnl)) : 0,
      maxLoss: closed.length ? Math.min(...closed.map((t) => t.pnl)) : 0,
      maxDrawdown: drawdown,
      count: closed.length,
      longCount: closed.filter((t) => t.direction === 'LONG').length,
      shortCount: closed.filter((t) => t.direction === 'SHORT').length,
    };
  }

  private scale(value: number, min: number, max: number) {
    if (!isFinite(value)) return 100;
    return Math.max(
      0,
      Math.min(100, Math.round(((value - min) / (max - min)) * 100)),
    );
  }

  private maxDrawdown(pnl: number[]) {
    let peak = 0;
    let maxDd = 0;
    let running = 0;
    for (const p of pnl) {
      running += p;
      peak = Math.max(peak, running);
      maxDd = Math.max(maxDd, peak - running);
    }
    return maxDd;
  }

  private stabilityScore(pnl: number[]) {
    if (!pnl.length) return 0;
    const mean = pnl.reduce((s, v) => s + v, 0) / pnl.length;
    const variance = pnl.reduce((s, v) => s + (v - mean) ** 2, 0) / pnl.length;
    const cv = mean !== 0 ? Math.sqrt(variance) / Math.abs(mean) : 10;
    return Math.max(0, Math.min(100, Math.round(100 - cv * 8)));
  }

  private recoveryScore(pnl: number[]) {
    const maxDd = this.maxDrawdown(pnl);
    const totalProfit = pnl.reduce((s, v) => s + Math.max(0, v), 0);
    if (totalProfit === 0) return 0;
    const ratio = maxDd / totalProfit;
    return Math.max(0, Math.min(100, Math.round(100 - ratio * 150)));
  }

  private disciplineScore(
    closed: { rMultiplier: number | null; pnl: number }[],
  ) {
    if (!closed.length) return 0;
    const noPlan = closed.filter(
      (t) => t.pnl < 0 && (t.rMultiplier ?? 0) <= -2,
    ).length;
    const ratio = noPlan / closed.length;
    return Math.max(0, Math.min(100, Math.round(100 - ratio * 100)));
  }
}
