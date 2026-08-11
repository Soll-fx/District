import { createHash } from 'node:crypto';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

const FF_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const SOURCE_FF = 'forexfactory';
const DEFAULT_SYNC_INTERVAL = 30 * 60 * 1000;

interface FfEvent {
  title: string;
  country: string;
  date: string;
  impact: string;
  forecast?: string;
  previous?: string;
}

interface ParsedItem {
  extId: string;
  country: string;
  instrument: string;
  impact: string;
  title: string;
  time: string | null;
  prev: string | null;
  forecast: string | null;
  date: Date;
  source: string;
}

@Injectable()
export class NewsService implements OnModuleInit {
  private readonly logger = new Logger(NewsService.name);
  private timer?: ReturnType<typeof setInterval>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    this.sync().catch((e) =>
      this.logger.error(`Первичная синхронизация новостей не удалась: ${(e as Error).message}`),
    );
    const intervalMs =
      Number(this.config.get<string>('NEWS_SYNC_INTERVAL_MS')) ||
      DEFAULT_SYNC_INTERVAL;
    this.timer = setInterval(() => {
      this.sync().catch((e) =>
        this.logger.error(`Синхронизация новостей не удалась: ${(e as Error).message}`),
      );
    }, intervalMs);
    this.timer.unref?.();
    this.logger.log(`Новости: интервал синхронизации ${Math.round(intervalMs / 1000)} с`);
  }

  list(impact?: string) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

    return this.prisma.newsItem.findMany({
      where: {
        date: { gte: start, lt: end },
        ...(impact ? { impact } : {}),
      },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });
  }

  async sync() {
    const res = await fetch(FF_URL, {
      headers: { 'user-agent': USER_AGENT },
    });
    if (!res.ok) throw new Error(`ForexFactory ответил ${res.status}`);
    const events = (await res.json()) as FfEvent[];
    if (!events.length) throw new Error('Пустой календарь ForexFactory');

    const items = events.map(this.parseEvent).filter((e): e is ParsedItem => !!e);
    for (const item of items) {
      await this.prisma.newsItem.upsert({
        where: { extId: item.extId },
        create: item,
        update: {
          country: item.country,
          instrument: item.instrument,
          impact: item.impact,
          title: item.title,
          time: item.time,
          prev: item.prev,
          forecast: item.forecast,
          date: item.date,
        },
      });
    }

    const now = new Date();
    const weekStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - now.getDay(),
    );
    await this.prisma.newsItem.deleteMany({ where: { source: null } });
    await this.prisma.newsItem.deleteMany({
      where: { source: SOURCE_FF, date: { lt: weekStart } },
    });

    this.logger.log(`Новости: синхронизировано ${items.length} событий ForexFactory`);
    return items.length;
  }

  private parseEvent(e: FfEvent): ParsedItem | null {
    const title = e.title?.trim();
    if (!title) return null;

    const parsed = e.date ? new Date(e.date) : null;
    if (!parsed || Number.isNaN(parsed.getTime())) return null;

    const datePart = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
    const time = `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`;

    const rawImpact = (e.impact ?? '').toLowerCase();
    const impact = rawImpact === 'high' || rawImpact === 'medium' ? rawImpact : 'low';
    const country = e.country || 'All';

    const extId = createHash('sha1')
      .update(`${country}|${datePart}|${time}|${title}`)
      .digest('hex')
      .slice(0, 24);

    return {
      extId,
      country,
      instrument: country === 'All' ? 'USD' : country,
      impact,
      title,
      time,
      prev: e.previous?.trim() ? e.previous.trim() : null,
      forecast: e.forecast?.trim() ? e.forecast.trim() : null,
      date: new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()),
      source: SOURCE_FF,
    };
  }
}
