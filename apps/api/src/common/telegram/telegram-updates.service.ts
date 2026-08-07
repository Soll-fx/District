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
    if (!cq?.data || !cq.id) return;

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

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }
}
