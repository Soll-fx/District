import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  TournamentMatch,
  TournamentMatchStatus,
  TournamentRound,
  TournamentStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTournamentDto,
  RecordResultDto,
  StartTournamentDto,
  TournamentSeeding,
  UpdateMatchDto,
} from './dto/tournament.dto';

const USER_SELECT = { id: true, name: true, avatarUrl: true } as const;

const DEFAULT_RULES = {
  weightProfit: 1,
  weightDrawdown: 1.5,
  penaltyPerViolation: 5,
  maxSingleLoss: 2,
};

type Rules = typeof DEFAULT_RULES;

function seedOrder(size: number): number[] {
  let seeds = [1];
  let k = 1;
  while (seeds.length < size) {
    const next: number[] = [];
    for (const s of seeds) {
      next.push(s);
      next.push(2 ** k + 1 - s);
    }
    seeds = next;
    k++;
  }
  return seeds;
}

function nextPow2(n: number): number {
  return 2 ** Math.ceil(Math.log2(Math.max(2, n)));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function normalizeRules(rules: unknown): Rules {
  const r = (rules ?? {}) as Partial<Rules>;
  return {
    weightProfit:
      typeof r.weightProfit === 'number'
        ? r.weightProfit
        : DEFAULT_RULES.weightProfit,
    weightDrawdown:
      typeof r.weightDrawdown === 'number'
        ? r.weightDrawdown
        : DEFAULT_RULES.weightDrawdown,
    penaltyPerViolation:
      typeof r.penaltyPerViolation === 'number'
        ? r.penaltyPerViolation
        : DEFAULT_RULES.penaltyPerViolation,
    maxSingleLoss:
      typeof r.maxSingleLoss === 'number'
        ? r.maxSingleLoss
        : DEFAULT_RULES.maxSingleLoss,
  };
}

function riskScore(
  closed: { rMultiplier: number | null; pnl: number }[],
): number {
  if (!closed.length) return 0;
  const avgR =
    closed.reduce((s, t) => s + (t.rMultiplier ?? 0), 0) / closed.length;
  const noPlan = closed.filter(
    (t) => t.pnl < 0 && (t.rMultiplier ?? 0) <= -2,
  ).length;
  return round2(avgR * 10 - noPlan);
}

type MatchWithRound = TournamentMatch & { round: TournamentRound };

@Injectable()
export class TournamentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const [tournaments, entries] = await Promise.all([
      this.prisma.tournament.findMany({
        include: { _count: { select: { players: true } } },
        orderBy: { startAt: 'desc' },
      }),
      this.prisma.tournamentPlayer.findMany({
        where: { userId },
        select: { tournamentId: true },
      }),
    ]);
    const myIds = new Set(entries.map((e) => e.tournamentId));

    return tournaments.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      format: t.format,
      minPlayers: t.minPlayers,
      maxPlayers: t.maxPlayers,
      prizePool: t.prizePool,
      rules: t.rules,
      startAt: t.startAt,
      endDate: t.endDate,
      finishedAt: t.finishedAt,
      players: t._count.players,
      meJoined: myIds.has(t.id),
    }));
  }

  async findOne(id: string, userId: string) {
    const detail = await this.loadDetail(id);
    return {
      ...detail,
      meJoined: detail.players.some((p) => p.userId === userId),
    };
  }

  async getMatchDetail(tournamentId: string, matchId: string) {
    const match = await this.loadMatch(tournamentId, matchId);
    const tournament = await this.requireTournament(tournamentId);
    const rules = normalizeRules(tournament.rules);

    const { start, end } = this.windowOf(tournament, match);
    const source: 'BROKER' | undefined = tournament.requireBroker ? 'BROKER' : undefined;

    const a = match.playerAId
      ? await this.computeTraderScore(match.playerAId, start, end, rules, source)
      : null;
    const b = match.playerBId
      ? await this.computeTraderScore(match.playerBId, start, end, rules, source)
      : null;

    return {
      id: match.id,
      tournamentId: match.tournamentId,
      roundNumber: match.round.number,
      position: match.position,
      status: match.status,
      startTime: match.startTime,
      endTime: match.endTime,
      streamUrl: match.streamUrl,
      winnerId: match.winnerId,
      scoreA: match.scoreA,
      scoreB: match.scoreB,
      playedAt: match.playedAt,
      rules,
      requireBroker: tournament.requireBroker,
      playerA: match.playerAId && a ? { user: match.playerA, ...a } : null,
      playerB: match.playerBId && b ? { user: match.playerB, ...b } : null,
      bye: !match.playerAId || !match.playerBId,
    };
  }

  async create(dto: CreateTournamentDto) {
    return this.prisma.tournament.create({
      data: {
        title: dto.title,
        description: dto.description,
        prizePool: dto.prizePool,
        startAt: new Date(dto.startAt),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        minPlayers: dto.minPlayers ?? 8,
        maxPlayers: dto.maxPlayers ?? 16,
        rules: dto.rules
          ? (normalizeRules(dto.rules) as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        requireBroker: dto.requireBroker ?? false,
      },
    });
  }

  async open(id: string) {
    const tournament = await this.requireTournament(id);
    if (tournament.status !== TournamentStatus.DRAFT) {
      throw new BadRequestException('Турнир уже опубликован');
    }
    return this.prisma.tournament.update({
      where: { id },
      data: { status: TournamentStatus.OPEN },
    });
  }

  async cancel(id: string) {
    const tournament = await this.requireTournament(id);
    if (
      tournament.status === TournamentStatus.FINISHED ||
      tournament.status === TournamentStatus.CANCELLED
    ) {
      throw new BadRequestException('Турнир уже завершён');
    }
    return this.prisma.tournament.update({
      where: { id },
      data: { status: TournamentStatus.CANCELLED },
    });
  }

  async join(id: string, userId: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      include: { _count: { select: { players: true } } },
    });
    if (!tournament) throw new NotFoundException('Турнир не найден');
    if (tournament.status !== TournamentStatus.OPEN) {
      throw new BadRequestException('Регистрация закрыта');
    }
    if (tournament._count.players >= tournament.maxPlayers) {
      throw new BadRequestException('Турнир уже заполнен');
    }
    if (tournament.requireBroker) {
      const broker = await this.prisma.integration.findFirst({
        where: { userId, provider: 'metatrader', connected: true },
      });
      if (!broker) {
        throw new BadRequestException(
          'Для участия подключите MT4/MT5 демо-счёт в разделе «Счета»',
        );
      }
    }
    try {
      await this.prisma.tournamentPlayer.create({
        data: { tournamentId: id, userId },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new BadRequestException('Вы уже зарегистрированы');
      }
      throw e;
    }
    return { ok: true };
  }

  async leave(id: string, userId: string) {
    const tournament = await this.requireTournament(id);
    if (tournament.status !== TournamentStatus.OPEN) {
      throw new BadRequestException('Отменить заявку можно до старта');
    }
    await this.prisma.tournamentPlayer.deleteMany({
      where: { tournamentId: id, userId },
    });
    return { ok: true };
  }

  async start(id: string, dto?: StartTournamentDto) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      include: { players: true },
    });
    if (!tournament) throw new NotFoundException('Турнир не найден');
    if (tournament.status !== TournamentStatus.OPEN) {
      throw new BadRequestException('Начать можно только открытый турнир');
    }

    const players = tournament.players;
    if (players.length < tournament.minPlayers) {
      throw new BadRequestException(
        `Участников меньше минимума (${players.length}/${tournament.minPlayers})`,
      );
    }
    if (players.length > tournament.maxPlayers) {
      throw new BadRequestException('Слишком много участников');
    }

    const ordered = await this.orderForSeeding(
      players,
      dto?.seeding ?? TournamentSeeding.RANDOM,
    );

    const bySeed = new Map<number, string>();
    await this.prisma.$transaction(
      ordered.map((p, i) => {
        bySeed.set(i + 1, p.userId);
        return this.prisma.tournamentPlayer.update({
          where: { id: p.id },
          data: { seed: i + 1 },
        });
      }),
    );

    const size = nextPow2(players.length);
    const roundsCount = Math.log2(size);
    const order = seedOrder(size);
    const roundHours = (dto?.roundHours ?? 24) * 3_600_000;
    const baseStart = tournament.startAt.getTime();

    for (let r = 1; r <= roundsCount; r++) {
      const slots = size / 2 ** (r - 1);
      const windowStart = new Date(baseStart + (r - 1) * roundHours);
      const windowEnd = new Date(baseStart + r * roundHours);
      await this.prisma.$transaction(async (tx) => {
        const round = await tx.tournamentRound.create({
          data: { tournamentId: id, number: r },
        });
        const matches: Prisma.TournamentMatchCreateManyInput[] = [];
        for (let m = 0; m < slots / 2; m++) {
          const posA = order[2 * m];
          const posB = order[2 * m + 1];
          matches.push({
            tournamentId: id,
            roundId: round.id,
            position: m,
            playerAId: r === 1 ? (bySeed.get(posA) ?? null) : null,
            playerBId: r === 1 ? (bySeed.get(posB) ?? null) : null,
            startTime: windowStart,
            endTime: windowEnd,
          });
        }
        await tx.tournamentMatch.createMany({ data: matches });
      });
    }

    const round1 = await this.prisma.tournamentRound.findUnique({
      where: { tournamentId_number: { tournamentId: id, number: 1 } },
      include: { matches: true },
    });

    for (const match of round1?.matches ?? []) {
      if (match.playerAId && !match.playerBId) {
        await this.resolveBye(match, match.playerAId);
      } else if (!match.playerAId && match.playerBId) {
        await this.resolveBye(match, match.playerBId);
      }
    }

    return this.prisma.tournament.update({
      where: { id },
      data: { status: TournamentStatus.RUNNING },
    });
  }

  async updateMatch(
    tournamentId: string,
    matchId: string,
    dto: UpdateMatchDto,
  ) {
    const match = await this.loadMatch(tournamentId, matchId);
    if (match.status === TournamentMatchStatus.PLAYED && dto.status) {
      throw new BadRequestException(
        'Сыгранный матч нельзя перевести в другой статус',
      );
    }
    if (dto.status === TournamentMatchStatus.PLAYED) {
      throw new BadRequestException(
        'Статус PLAYED выставляется через скоринг матча',
      );
    }
    return this.prisma.tournamentMatch.update({
      where: { id: match.id },
      data: {
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
        streamUrl:
          dto.streamUrl === undefined ? undefined : dto.streamUrl || null,
        status: dto.status,
      },
    });
  }

  async scoreMatch(tournamentId: string, matchId: string) {
    const match = await this.loadMatch(tournamentId, matchId);
    if (match.status === TournamentMatchStatus.PLAYED) {
      throw new BadRequestException('Матч уже сыгран');
    }
    if (!match.playerAId || !match.playerBId) {
      throw new BadRequestException('Недостаточно игроков для матча');
    }
    const tournament = await this.requireTournament(tournamentId);
    const rules = normalizeRules(tournament.rules);
    const { start, end } = this.windowOf(tournament, match);
    const source: 'BROKER' | undefined = tournament.requireBroker ? 'BROKER' : undefined;

    const a = await this.computeTraderScore(match.playerAId, start, end, rules, source);
    const b = await this.computeTraderScore(match.playerBId, start, end, rules, source);

    let winnerId: string;
    if (a.score !== b.score)
      winnerId = a.score > b.score ? match.playerAId : match.playerBId;
    else if (a.pnlPercent !== b.pnlPercent)
      winnerId =
        a.pnlPercent > b.pnlPercent ? match.playerAId : match.playerBId;
    else winnerId = match.playerAId;

    await this.finishMatch(match, winnerId, a.score, b.score);
    return this.loadDetail(tournamentId);
  }

  async recordResult(
    tournamentId: string,
    matchId: string,
    dto: RecordResultDto,
  ) {
    const match = await this.loadMatch(tournamentId, matchId);
    if (match.status === TournamentMatchStatus.PLAYED) {
      throw new BadRequestException('Матч уже сыгран');
    }
    if (!match.playerAId || !match.playerBId) {
      throw new BadRequestException('Недостаточно игроков для матча');
    }
    if (dto.winnerId !== match.playerAId && dto.winnerId !== match.playerBId) {
      throw new BadRequestException('Победитель должен быть участником матча');
    }
    await this.finishMatch(
      match,
      dto.winnerId,
      dto.scoreA ?? 0,
      dto.scoreB ?? 0,
    );
    return this.loadDetail(tournamentId);
  }

  private async computeTraderScore(
    userId: string,
    start: Date,
    end: Date,
    rules: Rules,
    source?: 'BROKER',
  ) {
    const trades = await this.prisma.trade.findMany({
      where: {
        userId,
        deletedAt: null,
        source: source ? { in: [source] } : undefined,
        entryDate: { gte: start, lte: end },
      },
      orderBy: { entryDate: 'asc' },
    });

    const views = trades.map((t) => ({
      id: t.id,
      asset: t.asset,
      direction: t.direction,
      entry: t.entry,
      exit: t.exit,
      lots: t.lots,
      entryTime: t.entryDate,
      exitTime: t.exitDate,
      pnl: t.pnl,
      rMultiplier: t.rMultiplier,
    }));

    let pnlPercent = 0;
    let totalPnl = 0;
    let running = 0;
    let minRunning = 0;
    let violations = 0;

    for (const t of views) {
      totalPnl += t.pnl;
      const notional = (t.entry ?? 0) * (t.lots ?? 0);
      const pct =
        t.rMultiplier !== null && t.rMultiplier !== undefined
          ? t.rMultiplier
          : t.entry && t.lots && notional !== 0
            ? (t.pnl / notional) * 100
            : 0;
      pnlPercent += pct;
      running += pct;
      if (running < minRunning) minRunning = running;

      if (pct < -rules.maxSingleLoss) violations += 1;
    }

    const maxDrawdown = Math.abs(Math.min(0, minRunning));
    const score =
      pnlPercent * rules.weightProfit -
      maxDrawdown * rules.weightDrawdown -
      violations * rules.penaltyPerViolation;

    return {
      trades: views,
      count: views.length,
      totalPnl: round2(totalPnl),
      pnlPercent: round2(pnlPercent),
      maxDrawdown: round2(maxDrawdown),
      violations,
      score: round2(score),
    };
  }

  private windowOf(
    tournament: { startAt: Date; endDate: Date | null },
    match: { startTime: Date | null; endTime: Date | null },
  ) {
    const start = match.startTime ?? tournament.startAt;
    const end = match.endTime ?? tournament.endDate ?? new Date();
    return { start, end };
  }

  private async orderForSeeding(
    players: { id: string; userId: string; joinedAt: Date }[],
    seeding: TournamentSeeding,
  ) {
    if (seeding === TournamentSeeding.RANDOM) {
      return [...players].sort(() => Math.random() - 0.5);
    }
    if (seeding === TournamentSeeding.RATING) {
      const users = await this.prisma.user.findMany({
        where: { id: { in: players.map((p) => p.userId) } },
        include: { trades: { where: { deletedAt: null } } },
      });
      const scoreByUser = new Map<string, number>();
      for (const u of users) {
        const closed = u.trades.filter((t) => t.pnl !== 0 || t.exitDate);
        scoreByUser.set(u.id, riskScore(closed));
      }
      return [...players].sort(
        (a, b) =>
          (scoreByUser.get(b.userId) ?? 0) - (scoreByUser.get(a.userId) ?? 0) ||
          a.joinedAt.getTime() - b.joinedAt.getTime(),
      );
    }
    return [...players].sort(
      (a, b) => a.joinedAt.getTime() - b.joinedAt.getTime(),
    );
  }

  private async resolveBye(match: TournamentMatch, winnerId: string) {
    await this.prisma.tournamentMatch.update({
      where: { id: match.id },
      data: {
        winnerId,
        status: TournamentMatchStatus.PLAYED,
        playedAt: new Date(),
      },
    });
    await this.advance(match, 1, winnerId);
  }

  private async finishMatch(
    match: MatchWithRound,
    winnerId: string,
    scoreA: number,
    scoreB: number,
  ) {
    await this.prisma.tournamentMatch.update({
      where: { id: match.id },
      data: {
        scoreA,
        scoreB,
        winnerId,
        status: TournamentMatchStatus.PLAYED,
        playedAt: new Date(),
      },
    });
    const finished = await this.advance(match, match.round.number, winnerId);
    if (finished) {
      await this.prisma.tournament.update({
        where: { id: match.tournamentId },
        data: { status: TournamentStatus.FINISHED, finishedAt: new Date() },
      });
    }
  }

  private async advance(
    match: MatchWithRound | TournamentMatch,
    roundNumber: number,
    winnerId: string,
  ): Promise<boolean> {
    const next = await this.prisma.tournamentRound.findUnique({
      where: {
        tournamentId_number: {
          tournamentId: match.tournamentId,
          number: roundNumber + 1,
        },
      },
      include: { matches: true },
    });
    if (!next) return true;

    const target = next.matches.find(
      (m) => m.position === Math.floor(match.position / 2),
    );
    if (!target)
      throw new NotFoundException('Матч следующего раунда не найден');

    await this.prisma.tournamentMatch.update({
      where: { id: target.id },
      data:
        match.position % 2 === 0
          ? { playerAId: winnerId }
          : { playerBId: winnerId },
    });
    return false;
  }

  private async loadDetail(id: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      include: {
        players: {
          orderBy: [{ seed: 'asc' }, { joinedAt: 'asc' }],
          include: { user: { select: USER_SELECT } },
        },
        rounds: {
          orderBy: { number: 'asc' },
          include: {
            matches: {
              orderBy: { position: 'asc' },
              include: {
                playerA: { select: USER_SELECT },
                playerB: { select: USER_SELECT },
              },
            },
          },
        },
      },
    });
    if (!tournament) throw new NotFoundException('Турнир не найден');

    const { players, rounds, ...rest } = tournament;
    return {
      ...rest,
      rules: tournament.rules as Rules | null,
      players: players.map((p) => ({
        id: p.id,
        userId: p.userId,
        seed: p.seed,
        joinedAt: p.joinedAt,
        user: p.user,
      })),
      rounds: rounds.map((r) => ({
        id: r.id,
        number: r.number,
        matches: r.matches.map((m) => ({
          id: m.id,
          position: m.position,
          status: m.status,
          scoreA: m.scoreA,
          scoreB: m.scoreB,
          winnerId: m.winnerId,
          startTime: m.startTime,
          endTime: m.endTime,
          streamUrl: m.streamUrl,
          playedAt: m.playedAt,
          playerA: m.playerA,
          playerB: m.playerB,
        })),
      })),
    };
  }

  private async loadMatch(tournamentId: string, matchId: string) {
    const match = await this.prisma.tournamentMatch.findFirst({
      where: { id: matchId, tournamentId },
      include: {
        round: true,
        playerA: { select: USER_SELECT },
        playerB: { select: USER_SELECT },
      },
    });
    if (!match) throw new NotFoundException('Матч не найден');
    return match;
  }

  private async requireTournament(id: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
    });
    if (!tournament) throw new NotFoundException('Турнир не найден');
    return tournament;
  }
}
