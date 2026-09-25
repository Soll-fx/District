import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TicketStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramService } from './telegram.service';
import { InboxGateway } from '../../inbox/inbox.gateway';
import { UsersAdminService } from '../../users-admin/users-admin.service';

const ADMIN_CB_PREFIX = 'tg:';

@Injectable()
export class TelegramUpdatesService implements OnModuleInit {
  private readonly logger = new Logger(TelegramUpdatesService.name);
  private offset = 0;
  private running = false;

  constructor(
    private readonly config: ConfigService,
    private readonly telegram: TelegramService,
    private readonly prisma: PrismaService,
    private readonly inboxGateway: InboxGateway,
    private readonly usersAdmin: UsersAdminService,
  ) {}

  onModuleInit() {
    if (!this.telegram.enabled) return;
    void this.telegram.setCommands();
    this.running = true;
    void this.poll();
  }

  private async poll() {
    while (this.running) {
      try {
        const updates = (await this.telegram.getUpdates(this.offset)) as any[];
        if (updates.length === 0) {
          await this.sleep(500);
          continue;
        }
        for (const update of updates) {
          this.offset = update.update_id + 1;
          await this.handle(update);
        }
      } catch (err) {
        this.logger.warn(`Telegram poll: ${(err as Error).message}`);
        await this.sleep(5000);
      }
    }
  }

  private async handle(update: any) {
    const cq = update.callback_query;
    if (cq?.id) {
      await this.handleCallback(cq);
      return;
    }
    const msg = update.message;
    if (msg?.message_id) {
      await this.handleMessage(msg);
    }
  }

  private async handleCallback(cq: any) {
    if (!cq.data) return;

    const parsed = this.telegram.parseData(cq.data);
    if (!parsed) {
      await this.telegram.answerCallback(cq.id, 'Неизвестная кнопка');
      return;
    }

    if (parsed.startsWith(ADMIN_CB_PREFIX)) {
      await this.handleAdminCallback(cq, parsed);
      return;
    }

    if (!parsed.startsWith('resolve:')) {
      await this.telegram.answerCallback(cq.id, 'Неизвестная кнопка');
      return;
    }
    const ticketId = parsed.slice('resolve:'.length);

    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      await this.telegram.answerCallback(cq.id, 'Тикет не найден');
      return;
    }

    const wasClosed = ticket.status === TicketStatus.CLOSED;
    if (!wasClosed) {
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: { status: TicketStatus.CLOSED },
      });
    }
    this.inboxGateway.pushToUser(ticket.userId);

    await this.telegram.answerCallback(
      cq.id,
      wasClosed ? 'Тикет уже решён' : '✅ Тикет отмечен решённым',
    );

    const msg = cq.message;
    if (msg) {
      const isPhoto = Boolean(msg.photo?.length);
      const oldText = isPhoto ? (msg.caption ?? '') : (msg.text ?? '');
      const subject = this.telegram.escapeHtml(ticket.subject);
      const note = wasClosed ? '' : `\n✅ «${subject}» отмечен решённым`;
      await this.telegram.editMessage(msg.chat.id, msg.message_id, oldText + note, isPhoto);
    }
  }

  private async handleMessage(msg: any) {
    const text = msg?.text ?? '';
    const adminChatId = await this.telegram.adminChat();
    const chatId = String(msg?.chat?.id ?? '');
    const isAdminChat = Boolean(adminChatId) && chatId === String(adminChatId);

    if (text.startsWith('/')) {
      await this.handleCommand(msg);
      return;
    }

    if (!isAdminChat) return;

    const reply = msg.reply_to_message;
    if (!reply) {
      await this.telegram.sendMessage(
        'Чтобы ответить пользователю, ответьте (Reply) на сообщение его тикета.',
      );
      return;
    }

    const ticketId = this.telegram.parseTicketRef(reply.text ?? reply.caption ?? '');
    if (!ticketId) {
      await this.telegram.sendMessage(
        'Не удалось определить тикет. Ответьте на сообщение, где есть 🎫 #id тикета.',
      );
      return;
    }

    if (!msg.text) {
      await this.telegram.sendMessage('Пока поддерживаются только текстовые ответы.');
      return;
    }

    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket || ticket.deletedAt) {
      await this.telegram.sendMessage('Тикет не найден.');
      return;
    }

    const admin = await this.prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) {
      await this.telegram.sendMessage('Нет пользователя с ролью ADMIN для отправки ответа.');
      return;
    }

    await this.prisma.ticketMessage.create({
      data: { ticketId: ticket.id, authorId: admin.id, text: msg.text, imageUrl: null },
    });

    if (ticket.status !== TicketStatus.CLOSED) {
      await this.prisma.ticket.update({
        where: { id: ticket.id },
        data: { status: TicketStatus.WAITING },
      });
    }
    this.inboxGateway.pushToUser(ticket.userId);

    const isPhoto = Boolean(reply.photo?.length);
    const oldText = isPhoto ? (reply.caption ?? '') : (reply.text ?? '');
    const note = `\n💬 Вы ответили: «${this.telegram.escapeHtml(msg.text.slice(0, 120))}»`;
    await this.telegram.editMessage(reply.chat.id, reply.message_id, oldText + note, isPhoto);
  }

  private async handleCommand(msg: any) {
    const fromId = String(msg?.from?.id ?? '');
    const chatId = msg.chat.id;
    const cmd = (msg.text ?? '').trim().toLowerCase().split(/\s+/)[0];

    if (cmd !== '/start' && cmd !== '/admin' && cmd !== '/help') return;

    const adminChatId = await this.telegram.adminChat();
    const isAdminSender = Boolean(adminChatId) && fromId === String(adminChatId);

    if (isAdminSender) {
      await this.sendAdminPanel(chatId);
      return;
    }

    if (cmd === '/start') {
      const user = await this.prisma.user.findUnique({ where: { telegramId: fromId } });
      const allowed = Boolean(
        user && (user.role === 'ADMIN' || user.tgAccess),
      );
      if (allowed) {
        await this.telegram.sendMessageTo(
          chatId,
          '✅ <b>Доступ открыт</b>\n\nВоспользуйтесь кнопкой «Открыть Web App» в меню бота, чтобы запустить приложение.',
        );
      } else {
        await this.telegram.sendMessageTo(
          chatId,
          '🔒 <b>Доступ закрыт</b>\n\nБот доступен только по приглашению. Обратитесь к администратору, чтобы открыть вам доступ.',
        );
      }
      return;
    }

    await this.telegram.sendMessageTo(
      chatId,
      '🔒 <b>Доступ закрыт</b>\n\nБот доступен только по приглашению.',
    );
  }

  private async handleAdminCallback(cq: any, payload: string) {
    const adminChatId = await this.telegram.adminChat();
    if (!adminChatId || String(cq?.from?.id ?? '') !== String(adminChatId)) {
      await this.telegram.answerCallback(cq.id, 'Доступ запрещён');
      return;
    }

    const [, action, id] = payload.split(':');
    const chatId = cq?.message?.chat?.id;
    if (!chatId) {
      await this.telegram.answerCallback(cq.id, 'Ошибка: чат не найден');
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
        await this.telegram.answerCallback(cq.id, 'Неизвестная кнопка');
    }
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
    await this.telegram.sendMessageTo(
      chatId,
      '🛡 <b>Админ-панель бота</b>\n\nУправление доступом к боту и мини-приложению.\n\nСписок пользователей — карточки с прибылью, активностью и рейтингом.',
      keyboard,
    );
  }

  private async sendUserList(chatId: number | string, ackId?: string) {
    const cards = await this.usersAdmin.tgList();
    if (!cards.length) {
      await this.telegram.sendMessageTo(chatId, 'Пока никто не входил через Telegram.');
      if (ackId) await this.telegram.answerCallback(ackId, 'Пользователей: 0');
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
      chunks[chunks.length - 1] += `…и ещё ${cards.length - shown.length} пользователей`;
    }

    for (const chunk of chunks) {
      await this.telegram.sendMessageTo(chatId, chunk);
    }
    if (ackId) await this.telegram.answerCallback(ackId, `Пользователей: ${cards.length}`);
  }

  private async sendAccessList(chatId: number | string, ackId: string, wantGranted: boolean) {
    const cards = await this.usersAdmin.tgList();
    const target = cards.filter((c) => !c.protected && c.tgAccess === wantGranted);

    if (!target.length) {
      await this.telegram.answerCallback(
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

    await this.telegram.sendMessageTo(
      chatId,
      wantGranted
        ? 'Нажмите на пользователя, чтобы <b>забрать</b> доступ:'
        : 'Нажмите на пользователя, чтобы <b>выдать</b> доступ:',
      { inline_keyboard: rows },
    );
    await this.telegram.answerCallback(ackId, 'Оk');
  }

  private async toggleAccess(cq: any, chatId: number | string, id: string | undefined, grant: boolean) {
    if (!id) {
      await this.telegram.answerCallback(cq.id, 'Ошибка: id не передан');
      return;
    }
    try {
      await this.usersAdmin.setTgAccess(id, grant);
      await this.telegram.answerCallback(cq.id, grant ? '✅ Доступ выдан' : '🔒 Доступ отозван');
      await this.sendUserList(chatId);
    } catch (err) {
      this.logger.warn(`tg access ${grant ? 'grant' : 'revoke'}: ${(err as Error).message}`);
      await this.telegram.answerCallback(cq.id, (err as Error).message.slice(0, 120));
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
    const name = this.telegram.escapeHtml(c.name || 'Пользователь');
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
    return this.telegram.signData(data);
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }
}