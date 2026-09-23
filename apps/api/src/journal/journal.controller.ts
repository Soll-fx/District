import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JournalService } from './journal.service';
import { CreateJournalEntryDto, UpdateJournalEntryDto } from './dto/journal.dto';
import { journalUploadOptions } from './upload.config';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import {
  User,
  type CurrentUser,
} from '../common/decorators/current-user.decorator';

@ApiTags('journal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/journal')
export class JournalController {
  constructor(private readonly journal: JournalService) {}

  @Get()
  @ApiOperation({ summary: 'Список заметок дневника' })
  findAll() {
    return this.journal.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Создать заметку' })
  create(@User() user: CurrentUser, @Body() dto: CreateJournalEntryDto) {
    return this.journal.create(user.id, dto);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Загрузить вложение (админ)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file', journalUploadOptions))
  upload(@UploadedFile() file?: Express.Multer.File) {
    return this.journal.uploadFile(file);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Изменить заметку' })
  update(@Param('id') id: string, @Body() dto: UpdateJournalEntryDto) {
    return this.journal.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить заметку' })
  remove(@Param('id') id: string) {
    return this.journal.remove(id);
  }
}