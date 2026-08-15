import { createHmac } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type ParseImage = { mime: string; buffer: Buffer } | null;

type TgPayload = Record<string, unknown>;

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly token?: string;
  private readonly chatId?: string;

  constructor(config: ConfigService) {
    const token = config.get<string>('TELEGRAM_BOT_TOKEN');
    const chatId = config.get<string>('TELEGRAM_ADMIN_CHAT_ID');
    this.token = token?.trim() || undefined;
    this.chatId = chatId?.trim() || undefined;
    if (this.token && this.chatId) {
      this.logger.log('Telegram-уведомления включены');
    }
  }

  get enabled() {
    return Boolean(this.token && this.chatId);
  }

  get adminChatId() {
    return this.chatId;
  }

  ticketRef(ticketId: string) {
    return `🎫 #${ticketId}`;
  }

  parseTicketRef(text: string): string | null {
    const match = /🎫\s*#([A-Za-z0-9_-]+)/.exec(text ?? '');
    return match?.[1] ?? null;
  }

  escapeHtml(value: string) {
    return value.replace(/[&<>"']/g, (c) => {
      switch (c) {
        case '&':
          return '&amp;';
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case '"':
          return '&quot;';
        default:
          return '&#39;';
      }
    });
  }

  private async post(
    method: string,
    payload: TgPayload,
  ): Promise<{ ok: boolean } | null> {
    if (!this.token || !this.chatId) return null;
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${this.token}/${method}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        this.logger.warn(
          `Telegram ${method}: HTTP ${res.status} ${JSON.stringify(data).slice(0, 200)}`,
        );
        return null;
      }
      return data;
    } catch (err) {
      this.logger.warn(`Telegram ${method}: ${(err as Error).message}`);
      return null;
    }
  }

  async sendMessage(text: string, resolveTicketId?: string) {
    if (!this.enabled) return;
    const payload: TgPayload = {
      chat_id: this.chatId,
      text: text.slice(0, 4000),
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    };
    this.applyResolveKeyboard(payload, resolveTicketId);
    await this.post('sendMessage', payload);
  }

  async sendPhoto(image: string | null | undefined, caption: string, resolveTicketId?: string) {
    if (!this.enabled) return;
    const parsed = this.parseImage(image);
    if (!parsed) {
      await this.sendMessage(caption, resolveTicketId);
      return;
    }
    const { mime, buffer } = parsed;
    try {
      const form = new FormData();
      form.append('chat_id', this.chatId!);
      form.append('photo', new Blob([new Uint8Array(buffer)], { type: mime }), 'screenshot.jpg');
      form.append('caption', caption.slice(0, 1000));
      form.append('parse_mode', 'HTML');
      if (resolveTicketId) {
        form.append('reply_markup', JSON.stringify(this.resolveKeyboard(resolveTicketId)));
      }
      const res = await fetch(
        `https://api.telegram.org/bot${this.token}/sendPhoto`,
        { method: 'POST', body: form },
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        this.logger.warn(
          `Telegram sendPhoto: HTTP ${res.status} ${JSON.stringify(data).slice(0, 200)}`,
        );
      }
    } catch (err) {
      this.logger.warn(`Telegram sendPhoto: ${(err as Error).message}`);
    }
  }

  async answerCallback(queryId: string, text: string) {
    await this.post('answerCallbackQuery', {
      callback_query_id: queryId,
      text: text.slice(0, 200),
      show_alert: false,
    });
  }

  async editMessage(
    chatId: number | string,
    messageId: number,
    newText: string,
    isPhoto: boolean,
  ) {
    const payload: TgPayload = {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: {},
    };
    if (isPhoto) {
      payload.caption = newText.slice(0, 1000);
      await this.post('editMessageCaption', payload);
    } else {
      payload.text = newText.slice(0, 4000);
      payload.parse_mode = 'HTML';
      await this.post('editMessageText', payload);
    }
  }

  async getUpdates(offset: number, timeout = 25): Promise<unknown[]> {
    if (!this.token) return [];
    try {
      const res = await fetch(`https://api.telegram.org/bot${this.token}/getUpdates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offset,
          timeout,
          allowed_updates: ['callback_query', 'message'],
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        this.logger.warn(
          `Telegram getUpdates: HTTP ${res.status} ${JSON.stringify(data).slice(0, 200)}`,
        );
        return [];
      }
      return data?.result ?? [];
    } catch (err) {
      this.logger.warn(`Telegram getUpdates: ${(err as Error).message}`);
      return [];
    }
  }

  markResolvedData(ticketId: string): string {
    const body = `resolve:${ticketId}`;
    return `${body}:${this.sign(body)}`;
  }

  parseResolvedData(data: string): string | null {
    const match = /^resolve:([^:]+):([A-Za-z0-9_-]+)$/.exec(data ?? '');
    if (!match) return null;
    const [, id, sig] = match;
    if (this.sign(`resolve:${id}`) !== sig) return null;
    return id;
  }

  private resolveKeyboard(ticketId: string) {
    return {
      inline_keyboard: [
        [{ text: '✅ Отметить решённым', callback_data: this.markResolvedData(ticketId) }],
      ],
    };
  }

  private applyResolveKeyboard(payload: TgPayload, resolveTicketId?: string) {
    if (resolveTicketId) {
      payload.reply_markup = this.resolveKeyboard(resolveTicketId);
    }
  }

  private sign(data: string) {
    return createHmac('sha256', this.token ?? '')
      .update(data)
      .digest('base64url')
      .slice(0, 16);
  }

  private parseImage(image: string | null | undefined): ParseImage {
    if (!image || typeof image !== 'string') return null;
    const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(image);
    if (!match) return null;
    try {
      return {
        mime: match[1],
        buffer: Buffer.from(match[2], 'base64'),
      };
    } catch {
      return null;
    }
  }
}
