import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

const CHANNEL_URL = 'https://t.me/s/markettwits';
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const DEFAULT_SYNC_INTERVAL = 60_000;

const FLAG_REGIONS: Record<string, string> = {
  '🇺🇸': 'США',
  '🇷🇺': 'Россия',
  '🇨🇳': 'Китай',
  '🇪🇺': 'Европа',
  '🇬🇧': 'Великобритания',
  '🇯🇵': 'Япония',
  '🇮🇷': 'Иран',
  '🇩🇪': 'Германия',
  '🇫🇷': 'Франция',
  '🇺🇦': 'Украина',
  '🇰🇿': 'Казахстан',
  '🇮🇳': 'Индия',
  '🇸🇦': 'Саудовская Аравия',
  '🇦🇪': 'ОАЭ',
  '🇮🇱': 'Израиль',
  '🇹🇷': 'Турция',
  '🇧🇷': 'Бразилия',
  '🇦🇷': 'Аргентина',
  '🇨🇦': 'Канада',
  '🇦🇺': 'Австралия',
  '🇰🇷': 'Южная Корея',
  '🇮🇩': 'Индонезия',
  '🇲🇽': 'Мексика',
  '🇳🇴': 'Норвегия',
  '🇵🇱': 'Польша',
  '🇨🇭': 'Швейцария',
  '🇳🇱': 'Нидерланды',
  '🇸🇬': 'Сингапур',
  '🌎': 'Мир',
  '🌍': 'Мир',
  '🌏': 'Мир',
};

const EMOJI_CLASS =
  '\\u{1F300}-\\u{1FAFF}\\u{1F1E6}-\\u{1F1FF}\\u{2600}-\\u{27BF}\\u{2B00}-\\u{2BFF}\\u{FE0F}\\u{2705}\\u{2B50}\\u{2764}';
const LEADING_EMOJI_RE = new RegExp(
  `^(\\s*(?:[${EMOJI_CLASS}]\\s*)+)\\s*(.*)$`,
  'u',
);
const IMPACT_RE = /[❗⚠⛔🔥🚨]/;

const RU_KEYWORDS = [
  '₽',
  'рубл',
  'сбер',
  'втб',
  'тинькофф',
  'т-банк',
  'альфа-банк',
  'альфабанк',
  'газпромбанк',
  'мосбиржа',
];

interface ParsedPost {
  telegramId: string;
  emoji: string | null;
  region: string;
  title: string;
  body: string;
  tags: string[];
  source: string;
  impact: string;
  impactEn: string;
  impactKey: string;
  live: boolean;
  createdAt: Date;
}

@Injectable()
export class GeopoliticsService implements OnModuleInit {
  private readonly logger = new Logger(GeopoliticsService.name);
  private timer?: ReturnType<typeof setInterval>;

  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  onModuleInit() {
    this.sync().catch((e) =>
      this.logger.error(`Первичная синхронизация геополитики не удалась: ${(e as Error).message}`),
    );
    const intervalMs =
      Number(this.config.get<string>('GEOPOLITICS_SYNC_INTERVAL_MS')) ||
      DEFAULT_SYNC_INTERVAL;
    this.timer = setInterval(() => {
      this.sync().catch((e) =>
        this.logger.error(`Синхронизация геополитики не удалась: ${(e as Error).message}`),
      );
    }, intervalMs);
    this.timer.unref?.();
    this.logger.log(`Геополитика: интервал синхронизации ${Math.round(intervalMs / 1000)} с`);
  }

  async list(lang?: string) {
    const isEn = lang === 'en';
    const posts = await this.prisma.geopoliticsPost.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return posts.map((p) => ({
      id: p.id,
      emoji: p.emoji,
      region: isEn && p.regionEn ? p.regionEn : p.region,
      title: isEn && p.titleEn ? p.titleEn : p.title,
      body: isEn && p.bodyEn ? p.bodyEn : p.body,
      tags: isEn && p.tagsEn.length ? p.tagsEn : p.tags,
      source: p.source,
      impact: isEn && p.impactEn ? p.impactEn : p.impact,
      impactKey: p.impactKey,
      live: p.live,
      createdAt: p.createdAt,
    }));
  }

  async sync() {
    const res = await fetch(CHANNEL_URL, {
      headers: { 'user-agent': USER_AGENT },
    });
    if (!res.ok) throw new Error(`t.me ответил ${res.status}`);
    const html = await res.text();
    const posts = this.parsePosts(html);
    if (!posts.length) throw new Error('В ленте канала не найдено постов');

    for (const post of posts) {
      await this.prisma.geopoliticsPost.upsert({
        where: { telegramId: post.telegramId },
        create: post,
        update: {
          emoji: post.emoji,
          region: post.region,
          title: post.title,
          body: post.body,
          tags: post.tags,
          impact: post.impact,
          impactEn: post.impactEn,
          impactKey: post.impactKey,
          live: post.live,
          createdAt: post.createdAt,
        },
      });
    }

    const ids = posts.map((p) => p.telegramId);
    await this.prisma.geopoliticsPost.deleteMany({
      where: { telegramId: { notIn: ids } },
    });
    await this.prisma.geopoliticsPost.deleteMany({
      where: { telegramId: null },
    });
    await this.prisma.geopoliticsPost.deleteMany({
      where: {
        OR: [
          { region: 'Россия' },
          { region: 'Украина' },
          ...RU_KEYWORDS.map((k) => ({ title: { contains: k, mode: 'insensitive' as const } })),
          ...RU_KEYWORDS.map((k) => ({ body: { contains: k, mode: 'insensitive' as const } })),
        ],
      },
    });

    this.logger.log(`Геополитика: синхронизировано ${posts.length} постов`);
    return posts.length;
  }

  private parsePosts(html: string): ParsedPost[] {
    const chunks =
      html.match(
        /<div class="tgme_widget_message_wrap[^"]*"[^>]*>[\s\S]*?(?=<div class="tgme_widget_message_wrap|$)/g,
      ) ?? [];
    const out: ParsedPost[] = [];

    for (const chunk of chunks) {
      const id = chunk.match(/data-post="markettwits\/(\d+)"/)?.[1];
      if (!id) continue;

      const date =
        chunk.match(/datetime="([^"]+)"/)?.[1] ?? new Date().toISOString();
      const textMatch = chunk.match(
        /<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/,
      );
      let text = textMatch?.[1] ?? '';
      text = text.replace(/<br\s*\/?>/g, '\n');
      text = text.replace(/[—–]{2,}/g, ' — ');
      text = text.replace(/<[^>]+>/g, ' ');
      text = this.unescape(text.replace(/\s+/g, ' ')).trim();
      if (!text) continue;
      if (this.isRussianContent(text)) continue;

      const post = this.buildPost(id, date, text);
      if (post) out.push(post);
    }
    return out;
  }

  private buildPost(
    telegramId: string,
    date: string,
    text: string,
  ): ParsedPost | null {
    const tags: string[] = [];
    const cleaned = text
      .replace(/#([\p{L}\p{N}_]+)/gu, (m, tag) => {
        tags.push(`#${tag}`);
        return ' ';
      })
      .replace(/\s+/g, ' ')
      .trim();
    if (!cleaned) return null;

    const emojiMatch = cleaned.match(LEADING_EMOJI_RE);
    const head = emojiMatch?.[1] ?? '';
    let content = (emojiMatch?.[2] ?? cleaned).trim();
    content = content
      .replace(/^(?:\s*=\s*[+-]?\d+(?:\.\d+)?%\s*)+/, '')
      .trim();
    if (!content) return null;

    const region = this.detectRegion(head) ?? 'Мир';
    if (region === 'Россия') return null;
    const impactKey = IMPACT_RE.test(head) ? 'high' : 'medium';
    const { title, body } = this.splitTitle(content);
    const emoji = head.replace(/\s+/g, '') || null;

    return {
      telegramId,
      emoji,
      region,
      title,
      body,
      tags,
      source: 'MarketTwits',
      impact: impactKey === 'high' ? 'Высокое' : 'Среднее',
      impactEn: impactKey === 'high' ? 'High' : 'Medium',
      impactKey,
      live: true,
      createdAt: new Date(date),
    };
  }

  private detectRegion(head: string): string | null {
    for (const flag of Object.keys(FLAG_REGIONS)) {
      if (head.includes(flag)) return FLAG_REGIONS[flag];
    }
    return null;
  }

  private splitTitle(content: string): { title: string; body: string } {
    const em = content.search(/\s—\s/);
    if (em > 0) {
      const head = content.slice(0, em).trim();
      const tail = content.slice(em).replace(/^\s—\s/, '');
      return { title: head || content, body: tail || content };
    }
    const sentence = content.match(/^(.{40,}?(?<![\d])\.)\s+(.*)$/s);
    if (sentence) return { title: sentence[1], body: sentence[2] };
    return { title: content, body: content };
  }

  private isRussianContent(text: string): boolean {
    const lower = text.toLowerCase();
    return RU_KEYWORDS.some((k) => lower.includes(k));
  }

  private unescape(str: string): string {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
      .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
        String.fromCharCode(parseInt(h, 16)),
      );
  }
}
