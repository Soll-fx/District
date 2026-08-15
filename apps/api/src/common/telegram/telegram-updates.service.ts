import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TicketStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramService } from './telegram.service';

@Injectable()
export class TelegramUpdatesService implements OnModuleInit {
  private readonly logger = new Logger(TelegramUpdatesService.name);
  private offset = 0;
  private running = false;

  constructor(
    private readonly config: ConfigService,
    private readonly telegram: TelegramService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    if (!this.telegram.enabled) return;
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

    const ticketId = this.telegram.parseResolvedData(cq.data);
    if (!ticketId) {
      await this.telegram.answerCallback(cq.id, 'Неизвестная кнопка');
      return;
    }

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
    const adminChatId = this.telegram.adminChatId;
    if (!adminChatId || String(msg.chat?.id) !== String(adminChatId)) return;

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

    const isPhoto = Boolean(reply.photo?.length);
    const oldText = isPhoto ? (reply.caption ?? '') : (reply.text ?? '');
    const note = `\n💬 Вы ответили: «${this.telegram.escapeHtml(msg.text.slice(0, 120))}»`;
    await this.telegram.editMessage(reply.chat.id, reply.message_id, oldText + note, isPhoto);
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }
}
