import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersAdminService } from '../../users-admin/users-admin.service';
import { TelegramAppBotService } from './telegram-app-bot.service';

const ADMIN_CB_PREFIX = 'tg:';

const CMD_ALIASES: Record<string, string> = {
  '/админ': '/admin',
  '/старт': '/start',
  '/помощь': '/help',
};

@Injectable()
export class TelegramAppBotUpdatesService {
  private readonly logger = new Logger(TelegramAppBotUpdatesService.name);

  constructor(
    private readonly bot: TelegramAppBotService,
    private readonly prisma: PrismaService,
    private readonly usersAdmin: UsersAdminService,
  ) {}

  async handleUpdate(update: any) {
    const cq = update?.callback_query;
    if (cq?.id) {
      await this.handleCallback(cq);
      return;
    }
    const msg = update?.message;
    if (msg?.message_id) {
      await this.handleMessage(msg);
    }
  }

  private async handleCallback(cq: any) {
    const fromId = String(cq?.from?.id ?? '');
    const sender = await this.prisma.user.findUnique({ where: { telegramId: fromId } });
    if (!sender || sender.role !== 'ADMIN') {
      await this.bot.answer(cq.id, 'Доступ запрещён');
      return;
    }
    if (!cq.data) return;

    const parsed = this.bot.parse(cq.data);
    if (!parsed) {
      await this.bot.answer(cq.id, 'Неизвестная кнопка');
      return;
    }
    if (!parsed.startsWith(ADMIN_CB_PREFIX)) {
      await this.bot.answer(cq.id, 'Неизвестная кнопка');
      return;
    }

    const [, action, id] = parsed.split(':');
    const chatId: number | string | undefined = cq?.message?.chat?.id;
    if (!chatId) {
      await this.bot.answer(cq.id, 'Ошибка: чат не найден');
      return;
    }

    switch (action) {
      case 'menu':
        await this.sendAdminPanel(chatId);
        break;
      case 'list':
        await this.sendUserList(chatId, cq.id);
        break;
      case 'glist':
        await this.sendAccessList(chatId, cq.id, true);
        break;
      case 'rlist':
        await this.sendAccessList(chatId, cq.id, false);
        break;
      case 'grant':
        await this.toggleAccess(cq, chatId, id, true);
        break;
      case 'revoke':
        await this.toggleAccess(cq, chatId, id, false);
        break;
      default:
        await this.bot.answer(cq.id, 'Неизвестная кнопка');
    }
  }

  private async handleMessage(msg: any) {
    const text = String(msg?.text ?? '').trim();
    if (!text.startsWith('/')) return;

    const fromId = String(msg?.from?.id ?? '');
    const rawCmd = text.toLowerCase().split(/\s+/)[0];
    const cmd = CMD_ALIASES[rawCmd] ?? rawCmd;
    if (!['/start', '/admin', '/help'].includes(cmd)) return;

    const chatId: number | string = msg.chat.id;
    const user = await this.prisma.user.findUnique({ where: { telegramId: fromId } });
    const isAdminSender = Boolean(user?.role === 'ADMIN');

    if (isAdminSender) {
      await this.sendAdminPanel(chatId);
      return;
    }

    if (cmd === '/start') {
      const allowed = Boolean(user && (user.role === 'ADMIN' || user.tgAccess));
      if (allowed) {
        await this.bot.send(
          chatId,
          '✅ <b>Доступ открыт</b>\n\nВоспользуйтесь кнопкой «Открыть Web App» в меню бота, чтобы запустить приложение.',
        );
      } else {
        await this.bot.send(
          chatId,
          '🔒 <b>Доступ закрыт</b>\n\nБот и мини-приложение доступны только по приглашению. Обратитесь к администратору, чтобы открыть вам доступ.',
        );
      }
      return;
    }

    await this.bot.send(
      chatId,
      '🔒 <b>Доступ закрыт</b>\n\nБот и мини-приложение доступны только по приглашению.',
    );
  }

  private async sendAdminPanel(chatId: number | string) {
    const keyboard = {
      inline_keyboard: [
        [{ text: '👥 Список пользователей', callback_data: this.cb('tg:list') }],
        [
          { text: '🔓 Выдать доступ', callback_data: this.cb('tg:glist') },
          { text: '🔒 Забрать доступ', callback_data: this.cb('tg:rlist') },
        ],
      ],
    };
    await this.bot.send(
      chatId,
      '🛡 <b>Админ-панель бота</b>\n\nУправление доступом к боту и мини-приложению.\n\nСписок пользователей — карточки с прибылью, активностью и рейтингом.',
      keyboard,
    );
  }

  private async sendUserList(chatId: number | string, ackId?: string) {
    const cards = await this.usersAdmin.tgList();
    if (!cards.length) {
      await this.bot.send(chatId, 'Пока никто не входил через Telegram.');
      if (ackId) await this.bot.answer(ackId, 'Пользователей: 0');
      return;
    }

    let buffer = '';
    const chunks: string[] = [];
    const shown = cards.slice(0, 12);
    for (const c of shown) {
      const card = this.cardText(c);
      if (buffer.length + card.length > 1800) {
        chunks.push(buffer);
        buffer = '';
      }
      buffer += card + '\n────────────\n';
    }
    if (buffer) chunks.push(buffer);
    if (cards.length > shown.length) {
      chunks[chunks.length - 1] += `\n…и ещё ${cards.length - shown.length} пользователей`;
    }

    for (const chunk of chunks) {
      await this.bot.send(chatId, chunk);
    }
    if (ackId) await this.bot.answer(ackId, `Пользователей: ${cards.length}`);
  }

  private async sendAccessList(chatId: number | string, ackId: string, wantGranted: boolean) {
    const cards = await this.usersAdmin.tgList();
    const target = cards.filter((c) => !c.protected && c.tgAccess === wantGranted);

    if (!target.length) {
      await this.bot.answer(
        ackId,
        wantGranted ? 'Всем уже выдан доступ' : 'Нет пользователей с доступом',
      );
      return;
    }

    const rows = target.slice(0, 8).map((c) => [
      {
        text: (c.name ?? '?').slice(0, 28),
        callback_data: this.cb(`tg:${wantGranted ? 'revoke' : 'grant'}:${c.id}`),
      },
    ]);
    rows.push([{ text: '🛡 Меню', callback_data: this.cb('tg:menu') }]);

    await this.bot.send(
      chatId,
      wantGranted
        ? 'Нажмите на пользователя, чтобы <b>забрать</b> доступ:'
        : 'Нажмите на пользователя, чтобы <b>выдать</b> доступ:',
      { inline_keyboard: rows },
    );
    await this.bot.answer(ackId, 'Оk');
  }

  private async toggleAccess(
    cq: any,
    chatId: number | string,
    id: string | undefined,
    grant: boolean,
  ) {
    if (!id) {
      await this.bot.answer(cq.id, 'Ошибка: id не передан');
      return;
    }
    try {
      await this.usersAdmin.setTgAccess(id, grant);
      await this.bot.answer(cq.id, grant ? '✅ Доступ выдан' : '🔒 Доступ отозван');
      await this.sendUserList(chatId);
    } catch (err) {
      this.logger.warn(`tg access ${grant ? 'grant' : 'revoke'}: ${(err as Error).message}`);
      await this.bot.answer(cq.id, (err as Error).message.slice(0, 120));
    }
  }

  private cardText(c: {
    name: string;
    telegramUsername: string | null;
    telegramId: string | null;
    tgAccess: boolean;
    online: boolean;
    lastSeenAt: string | Date | null;
    netPnl: number | null;
    rank: number | null;
    topAsset: string | null;
    count: number;
    protected: boolean;
  }) {
    const esc = (v: string) =>
      v.replace(/[&<>"']/g, (ch) => {
        switch (ch) {
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
    const name = esc(c.name || 'Пользователь');
    const handle = c.telegramUsername ? `@${c.telegramUsername}` : String(c.telegramId ?? '');
    const pnl =
      c.netPnl === null
        ? '—'
        : `${c.netPnl >= 0 ? '+' : '−'}${Math.abs(c.netPnl).toLocaleString('ru-RU', { maximumFractionDigits: 0 })}$`;
    const seen = c.lastSeenAt
      ? new Date(c.lastSeenAt).toLocaleString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      : null;
    const state = c.tgAccess ? '✅ Доступ открыт' : '❌ Доступ закрыт';
    const activity = c.online ? '🟢 В сети' : `⚪ Не в сети${seen ? ` · ${seen}` : ''}`;
    return `#${c.rank ?? '—'} <b>${name}</b>${c.protected ? ' 👑' : ''}
${handle} · ${c.telegramId ?? '—'}
${state} · ${activity}
💰 ${pnl} · 🏆 Топ: ${c.topAsset ?? '—'} · ${c.count} сделок`;
  }

  private cb(data: string) {
    return this.bot.sign(data);
  }
}