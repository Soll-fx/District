import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateJournalEntryDto,
  JournalAttachmentDto,
  UpdateJournalEntryDto,
} from './dto/journal.dto';

@Injectable()
export class JournalService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.journalEntry.findMany({
      include: { attachments: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreateJournalEntryDto) {
    return this.prisma.journalEntry.create({
      data: {
        title: dto.title ?? '',
        content: dto.content,
        createdById: userId,
        attachments: { create: dto.attachments?.map(this.toData) ?? [] },
      },
      include: { attachments: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async update(id: string, dto: UpdateJournalEntryDto) {
    const existing = await this.prisma.journalEntry.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Заметка не найдена');

    if (dto.attachments) {
      const old = await this.prisma.journalAttachment.findMany({
        where: { entryId: id },
      });
      await this.prisma.journalAttachment.deleteMany({ where: { entryId: id } });
      for (const a of old) await removeLocalFile(a.url);
      await this.prisma.journalAttachment.createMany({
        data: dto.attachments.map((a) => ({ entryId: id, ...this.toData(a) })),
      });
    }

    return this.prisma.journalEntry.update({
      where: { id },
      data: {
        title: dto.title === undefined ? undefined : dto.title,
        content: dto.content === undefined ? undefined : dto.content,
      },
      include: { attachments: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.journalEntry.findUnique({
      where: { id },
      include: { attachments: true },
    });
    if (!existing) throw new NotFoundException('Заметка не найдена');
    await this.prisma.journalEntry.delete({ where: { id } });
    for (const a of existing.attachments) await removeLocalFile(a.url);
    return { ok: true };
  }

  uploadFile(file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Файл не загружен');
    return {
      url: `/uploads/journal/${file.filename}`,
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  private toData(a: JournalAttachmentDto) {
    return {
      url: a.url,
      fileName: a.fileName,
      mimeType: a.mimeType ?? null,
      size: a.size ?? null,
    };
  }
}

async function removeLocalFile(url: string) {
  if (!url.startsWith('/uploads/')) return;
  try {
    await unlink(join(process.cwd(), url));
  } catch {
    /* файла уже нет — игнорируем */
  }
}