import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
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
    const isAdmin = Boolean(
      sender?.role === 'ADMIN' || this.bot.adminChatOverride === fromId,
    );
    if (!isAdmin) {
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
    const msgId = cq?.message?.message_id as number | undefined;

    switch (action) {
      case 'menu':
        await this.render(chatId, msgId, this.adminPanelPayload(), cq.id);
        break;
      case 'list':
        await this.renderUserList(chatId, msgId, cq.id);
        break;
      case 'user':
        await this.renderUserCard(chatId, msgId, cq.id, id);
        break;
      case 'card':
        await this.toggleCard(cq, chatId, msgId, id);
        break;
      case 'gl':
        await this.toggleList(cq, chatId, msgId, id, true);
        break;
      case 'rl':
        await this.toggleList(cq, chatId, msgId, id, false);
        break;
      case 'glist':
        await this.renderAccessList(chatId, msgId, cq.id, true);
        break;
      case 'rlist':
        await this.renderAccessList(chatId, msgId, cq.id, false);
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
    let user = await this.prisma.user.findUnique({ where: { telegramId: fromId } });
    const isAdmin = Boolean(
      user?.role === 'ADMIN' || this.bot.adminChatOverride === fromId,
    );
    this.logger.log(
      `[app-bot] cmd=${cmd} from=${fromId} user=${user?.id ?? 'none'} role=${user?.role ?? 'none'} admin=${isAdmin}`,
    );

    if (isAdmin) {
      await this.render(chatId, undefined, this.adminPanelPayload());
      return;
    }

    if (cmd === '/start') {
      if (!user) {
        const tgFrom = msg.from ?? {};
        const name =
          [tgFrom.first_name, tgFrom.last_name].filter(Boolean).join(' ').trim() ||
          tgFrom.username ||
          'Telegram user';
        user = await this.prisma.user.upsert({
          where: { telegramId: fromId },
          create: {
            telegramId: fromId,
            telegramUsername: tgFrom.username ?? null,
            name,
            email: `tg_${fromId}@telegram.user`,
            passwordHash: randomBytes(32).toString('hex'),
            tgAccess: false,
            lastSeenAt: new Date(),
          },
          update: {
            telegramUsername: tgFrom.username ?? undefined,
            name,
            lastSeenAt: new Date(),
          },
        });
      }

      const allowed = user.role === 'ADMIN' || user.tgAccess;
      if (allowed) {
        await this.bot.send(
          chatId,
          '✅ <b>Доступ открыт</b>\n\nВоспользуйтесь кнопкой «Открыть Web App» в меню бота, чтобы запустить приложение.',
        );
      } else {
        await this.bot.send(
          chatId,
          '🔒 <b>Доступ закрыт</b>\n\nБот и мини-приложение доступны только по приглашению. Администратор уже получил уведомление и может открыть вам доступ.',
        );
        await this.notifyAdminNewUser(user);
      }
      return;
    }

    await this.bot.send(
      chatId,
      '🔒 <b>Доступ закрыт</b>\n\nБот и мини-приложение доступны только по приглашению.',
    );
  }

  private async notifyAdminNewUser(user: {
    id: string;
    name: string;
    telegramUsername: string | null;
  }) {
    const adminChat =
      this.bot.adminChatOverride ??
      (await this.prisma.user
        .findFirst({
          where: { role: 'ADMIN', telegramId: { not: null } },
          select: { telegramId: true },
          orderBy: { createdAt: 'asc' },
        })
        .then((a) => a?.telegramId ?? null)
        .catch(() => null));
    if (!adminChat) return;

    const handle = user.telegramUsername ? `@${user.telegramUsername}` : `id ${user.id}`;
    await this.bot.send(
      adminChat,
      `❗ <b>Новый пользователь</b>\n${user.name} (${handle})\nНажмите кнопку, чтобы выдать доступ к боту и мини-приложению:`,
      {
        inline_keyboard: [
          [{ text: '🟢 Выдать доступ', callback_data: this.cb(`tg:gl:${user.id}`) }],
        ],
      },
    );
  }

  private adminPanelPayload() {
    const keyboard = {
      inline_keyboard: [
        [{ text: '👥 Список пользователей', callback_data: this.cb('tg:list') }],
        [
          { text: '🔓 Выдать доступ', callback_data: this.cb('tg:glist') },
          { text: '🔒 Забрать доступ', callback_data: this.cb('tg:rlist') },
        ],
      ],
    };
    return {
      text: '🛡 <b>Админ-панель бота</b>\n\nУправление доступом к боту и мини-приложению.\n\nСписок пользователей — нажмите на юзера, чтобы открыть его карточку.',
      keyboard,
    };
  }

  private userListPayload(cards: TgCard[]) {
    const users = cards.slice(0, 12);
    const rows: { text: string; callback_data: string }[][] = [];
    for (let i = 0; i < users.length; i += 2) {
      const row = [this.userButton(users[i])];
      if (users[i + 1]) row.push(this.userButton(users[i + 1]));
      rows.push(row);
    }
    rows.push([{ text: '🛡 Меню', callback_data: this.cb('tg:menu') }]);
    const tail = cards.length > users.length ? `\n…и ещё ${cards.length - users.length}` : '';
    return {
      text: `👥 <b>Пользователи в Telegram:</b> ${cards.length}${tail}\n\nНажмите на юзера, чтобы открыть карточку:`,
      keyboard: { inline_keyboard: rows },
    };
  }

  private accessListPayload(cards: TgCard[], wantGranted: boolean) {
    const target = cards.filter((c) => !c.protected && c.tgAccess === wantGranted);
    if (!target.length) return null;

    const rows = target.slice(0, 8).map((c) => [
      { text: this.fit(c.name || '?', 28), callback_data: this.cb(`tg:${wantGranted ? 'rl' : 'gl'}:${c.id}`) },
    ]);
    rows.push([{ text: '🛡 Меню', callback_data: this.cb('tg:menu') }]);

    return {
      text: wantGranted
        ? 'Нажмите на пользователя, чтобы <b>забрать</b> доступ:'
        : 'Нажмите на пользователя, чтобы <b>выдать</b> доступ:',
      keyboard: { inline_keyboard: rows },
    };
  }

  private userCardPayload(c: TgCard) {
    const accessBtn = c.protected
      ? []
      : [
          {
            text: c.tgAccess ? '🔒 Забрать доступ' : '🔓 Выдать доступ',
            callback_data: this.cb(`tg:card:${c.id}`),
          },
        ];
    const keyboard = {
      inline_keyboard: [
        accessBtn,
        [
          { text: '🔙 К списку', callback_data: this.cb('tg:list') },
          { text: '🛡 Меню', callback_data: this.cb('tg:menu') },
        ],
      ].filter((row) => row.length),
    };
    return { text: this.cardText(c), keyboard };
  }

  private async render(
    chatId: number | string,
    messageId: number | undefined,
    payload: { text: string; keyboard: { inline_keyboard: unknown[] } } | null,
    ackId?: string,
  ) {
    if (!payload) {
      if (ackId) await this.bot.answer(ackId, 'Ок');
      return;
    }
    if (messageId) {
      await this.bot.edit(chatId, messageId, payload.text, payload.keyboard);
    } else {
      await this.bot.send(chatId, payload.text, payload.keyboard);
    }
    if (ackId) await this.bot.answer(ackId, 'Оk');
  }

  private async renderUserList(chatId: number | string, messageId: number | undefined, ackId?: string) {
    const cards = await this.usersAdmin.tgList();
    if (!cards.length) {
      const emptyText = 'Пока никто не входил через Telegram.';
      if (messageId) await this.bot.edit(chatId, messageId, emptyText);
      else await this.bot.send(chatId, emptyText);
      if (ackId) await this.bot.answer(ackId, 'Пользователей: 0');
      return;
    }
    await this.render(chatId, messageId, this.userListPayload(cards), ackId);
  }

  private async renderUserCard(chatId: number | string, messageId: number | undefined, ackId: string, id: string | undefined) {
    if (!id) {
      await this.bot.answer(ackId, 'Ошибка: id не передан');
      return;
    }
    const cards = await this.usersAdmin.tgList();
    const card = cards.find((c) => c.id === id);
    if (!card) {
      await this.bot.answer(ackId, 'Пользователь не найден');
      return;
    }
    await this.render(chatId, messageId, this.userCardPayload(card), ackId);
  }

  private async renderAccessList(chatId: number | string, messageId: number | undefined, ackId: string, wantGranted: boolean) {
    const cards = await this.usersAdmin.tgList();
    const payload = this.accessListPayload(cards, wantGranted);
    if (!payload) {
      await this.bot.answer(ackId, wantGranted ? 'Всем уже выдан доступ' : 'Нет пользователей с доступом');
      return;
    }
    await this.render(chatId, messageId, payload, ackId);
  }

  private async toggleCard(cq: any, chatId: number | string, messageId: number | undefined, id: string | undefined) {
    if (!id) {
      await this.bot.answer(cq.id, 'Ошибка: id не передан');
      return;
    }
    try {
      const cards = await this.usersAdmin.tgList();
      const card = cards.find((c) => c.id === id);
      if (!card || card.protected) {
        await this.bot.answer(cq.id, 'Действие недоступно');
        return;
      }
      await this.usersAdmin.setTgAccess(id, !card.tgAccess);
      await this.bot.answer(cq.id, card.tgAccess ? '🔒 Доступ отозван' : '✅ Доступ выдан');
      const fresh = await this.usersAdmin.tgList();
      const updated = fresh.find((c) => c.id === id);
      if (messageId && updated) {
        await this.bot.edit(chatId, messageId, this.cardText(updated), this.userCardPayload(updated).keyboard);
      }
    } catch (err) {
      this.logger.warn(`tg toggle: ${(err as Error).message}`);
      await this.bot.answer(cq.id, (err as Error).message.slice(0, 120));
    }
  }

  private async toggleList(cq: any, chatId: number | string, messageId: number | undefined, id: string | undefined, grant: boolean) {
    if (!id) {
      await this.bot.answer(cq.id, 'Ошибка: id не передан');
      return;
    }
    try {
      const cards = await this.usersAdmin.tgList();
      const card = cards.find((c) => c.id === id);
      if (!card || card.protected) {
        await this.bot.answer(cq.id, 'Действие недоступно');
        return;
      }
      await this.usersAdmin.setTgAccess(id, grant);
      await this.bot.answer(cq.id, grant ? '✅ Доступ выдан' : '🔒 Доступ отозван');
      const fresh = await this.usersAdmin.tgList();
      const payload = this.accessListPayload(fresh, !grant);
      if (messageId) {
        if (payload) await this.bot.edit(chatId, messageId, payload.text, payload.keyboard);
        else await this.bot.edit(chatId, messageId, grant ? 'Всем уже выдан доступ' : 'Нет пользователей с доступом');
      }
    } catch (err) {
      this.logger.warn(`tg ${grant ? 'grant' : 'revoke'}: ${(err as Error).message}`);
      await this.bot.answer(cq.id, (err as Error).message.slice(0, 120));
    }
  }

  private userButton(c: TgCard) {
    const state = c.tgAccess ? '✅' : '❌';
    return { text: `${state} ${this.fit(c.name || '?', 18)}`, callback_data: this.cb(`tg:user:${c.id}`) };
  }

  private cardText(c: TgCard) {
    const name = this.esc(c.name || 'Пользователь');
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
    const winRate = c.winRate === null || c.winRate === undefined ? '—' : `${c.winRate}%`;
    return `#${c.rank ?? '—'} <b>${name}</b>${c.protected ? ' 👑' : ''}
${handle} · <code>${c.telegramId ?? '—'}</code>

${state}
${activity}

💰 P&L: <b>${pnl}</b>
📊 Сделок: ${c.count} · 🎯 Win rate: ${winRate}
🏆 Топ-актив: ${this.esc(c.topAsset ?? '—')}
${c.score !== null && c.score !== undefined ? `⭐ Счёт: ${c.score.toLocaleString('ru-RU')}` : ''}`;
  }

  private fit(value: string, max: number) {
    return value.length > max ? value.slice(0, max - 1) + '…' : value;
  }

  private esc(value: string) {
    return String(value).replace(/[&<>"']/g, (ch) => {
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
  }

  private cb(data: string) {
    return this.bot.sign(data);
  }
}

type TgCard = {
  id: string;
  name: string;
  telegramUsername: string | null;
  telegramId: string | null;
  tgAccess: boolean;
  online: boolean;
  lastSeenAt: string | Date | null;
  netPnl: number | null;
  rank: number | null;
  score: number | null;
  winRate: number | null;
  count: number;
  topAsset: string | null;
  protected: boolean;
};