import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EducationService {
  constructor(private readonly prisma: PrismaService) {}

  courses() {
    return this.prisma.course.findMany({ orderBy: { order: 'asc' } });
  }
}
