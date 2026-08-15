import { Injectable, NotFoundException } from '@nestjs/common';
import { TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../common/telegram/telegram.service';

@Injectable()
export class InboxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
  ) {}

  async list(userId: string) {
    return this.prisma.ticket.findMany({
      where: { userId, deletedAt: null },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async create(
    userId: string,
    subject: string,
    category: string,
    text: string,
    imageUrl?: string | null,
  ) {
    const ticket = await this.prisma.ticket.create({
      data: {
        userId,
        subject,
        category,
        messages: { create: { authorId: userId, text, imageUrl: imageUrl || null } },
      },
      include: { messages: true },
    });

    await this.notifyNewTicket(userId, ticket.id, ticket.subject, ticket.category, text, imageUrl);
    return ticket;
  }

  async detail(userId: string, id: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, userId, deletedAt: null },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!ticket) throw new NotFoundException('Тикет не найден');
    return ticket;
  }

  async addMessage(
    userId: string,
    id: string,
    text: string,
    imageUrl?: string | null,
  ) {
    const ticket = await this.detail(userId, id);
    const message = await this.prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        authorId: userId,
        text,
        imageUrl: imageUrl || null,
      },
    });

    await this.prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: TicketStatus.OPEN },
    });

    await this.notifyMessage(userId, ticket.id, ticket.subject, text, imageUrl);
    return message;
  }

  async setStatus(userId: string, id: string, status: TicketStatus) {
    await this.detail(userId, id);
    return this.prisma.ticket.update({ where: { id }, data: { status } });
  }

  async softDelete(userId: string, id: string) {
    await this.detail(userId, id);
    await this.prisma.ticket.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { deleted: true };
  }

  private async authorLabel(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });
    return user?.name?.trim() || user?.email || userId;
  }

  private async notifyNewTicket(
    userId: string,
    ticketId: string,
    subject: string,
    category: string,
    text: string,
    imageUrl?: string | null,
  ) {
    if (!this.telegram.enabled) return;
    const author = this.telegram.escapeHtml(await this.authorLabel(userId));
    const safeSubject = this.telegram.escapeHtml(subject);
    const safeCategory = this.telegram.escapeHtml(category);
    const safeText = this.telegram.escapeHtml(text || '—');
    const caption =
      `<b>🆕 Новый тикет</b>\n` +
      `<b>Пользователь:</b> ${author}\n` +
      `<b>Тема:</b> ${safeSubject}\n` +
      `<b>Категория:</b> ${safeCategory}\n` +
      `<b>Сообщение:</b> ${safeText}\n\n` +
      `${this.telegram.ticketRef(ticketId)}\n💬 Ответьте на это сообщение — ответ уйдёт пользователю`;
    if (imageUrl) {
      await this.telegram.sendPhoto(imageUrl, caption, ticketId);
    } else {
      await this.telegram.sendMessage(caption, ticketId);
    }
  }

  private async notifyMessage(
    userId: string,
    ticketId: string,
    subject: string,
    text: string,
    imageUrl?: string | null,
  ) {
    if (!this.telegram.enabled) return;
    const author = this.telegram.escapeHtml(await this.authorLabel(userId));
    const safeSubject = this.telegram.escapeHtml(subject);
    const safeText = this.telegram.escapeHtml(text || '—');
    const caption =
      `<b>💬 Новое сообщение</b> в тикете «${safeSubject}»\n` +
      `<b>От:</b> ${author}\n` +
      `<b>Текст:</b> ${safeText}\n\n` +
      `${this.telegram.ticketRef(ticketId)}\n💬 Ответьте на это сообщение — ответ уйдёт пользователю`;
    if (imageUrl) {
      await this.telegram.sendPhoto(imageUrl, caption, ticketId);
    } else {
      await this.telegram.sendMessage(caption, ticketId);
    }
  }
}
