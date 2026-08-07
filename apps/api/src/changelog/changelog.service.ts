import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChangelogService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.changelogEntry.findMany({ orderBy: { date: 'desc' } });
  }
}
