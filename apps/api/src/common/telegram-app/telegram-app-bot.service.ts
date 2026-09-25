import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import {
  answerBotCallback,
  parseData,
  sendBotMessage,
  setBotWebhook,
  setCommands,
  signData,
  TgPayload,
} from '../telegram/telegram-api.util';

const BOT_TOKEN_FALLBACK = '8618066024:AAGY4r1FP0Q_ogtj2qNRNzK8EBbRbtqjveM';
const APP_URL_FALLBACK = 'https://district-api-xlc3.onrender.com';
const WEBHOOK_SECRET_FALLBACK = 'district-app-bot-wh-2026-x9';

@Injectable()
export class TelegramAppBotService implements OnModuleInit {
  private readonly logger = new Logger(TelegramAppBotService.name);
  private readonly token: string | undefined;
  private readonly appUrl: string;
  private readonly secret: string;
  private readonly adminEnv: string | undefined;
  private resolvedAdminChat: string | null | undefined;

  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.token =
      config.get<string>('TELEGRAM_APP_BOT_TOKEN')?.trim() ||
      process.env.BOT_TOKEN?.trim() ||
      BOT_TOKEN_FALLBACK;
    this.appUrl = (
      config.get<string>('PUBLIC_APP_URL')?.trim() || APP_URL_FALLBACK
    ).replace(/\/+$/, '');
    this.secret =
      config.get<string>('TELEGRAM_APP_WEBHOOK_SECRET')?.trim() || WEBHOOK_SECRET_FALLBACK;
    this.adminEnv = config.get<string>('TELEGRAM_APP_ADMIN_CHAT_ID')?.trim();
  }

  get enabled() {
    return Boolean(this.token);
  }

  onModuleInit() {
    void this.boot();
  }

  get webhookUrl() {
    return `${this.appUrl}/api/telegram-app/webhook`;
  }

  get webhookSecret() {
    return this.secret;
  }

  async adminChatId(): Promise<string | null> {
    if (this.adminEnv) return this.adminEnv;
    if (this.resolvedAdminChat !== undefined) return this.resolvedAdminChat;
    try {
      const admin = await this.prisma.user.findFirst({
        where: { role: 'ADMIN', telegramId: { not: null } },
        select: { telegramId: true },
        orderBy: { createdAt: 'asc' },
      });
      this.resolvedAdminChat = admin?.telegramId ?? null;
    } catch (err) {
      this.logger.warn(`adminChatId: ${(err as Error).message}`);
      this.resolvedAdminChat = null;
    }
    return this.resolvedAdminChat;
  }

  async boot(): Promise<void> {
    if (!this.enabled) return;
    await setCommands(this.token!);
    const ok = await setBotWebhook(this.token!, this.webhookUrl, this.secret);
    if (ok) {
      this.logger.log(`Telegram-app: вебхук включён → ${this.webhookUrl}`);
    } else {
      this.logger.warn(
        `Telegram-app: не удалось включить вебхук (${this.webhookUrl}). Повтор через 60с.`,
      );
      setTimeout(() => void this.boot(), 60_000);
    }
  }

  async send(chatId: number | string, text: string, replyMarkup?: TgPayload) {
    if (!this.enabled) return;
    await sendBotMessage(this.token!, chatId, text, replyMarkup);
  }

  async answer(queryId: string, text: string) {
    if (!this.enabled) return;
    await answerBotCallback(this.token!, queryId, text);
  }

  sign(data: string) {
    return signData(this.token ?? '', data);
  }

  parse(data: string): string | null {
    return parseData(this.token ?? '', data);
  }
}