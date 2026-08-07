import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TicketStatus } from '@prisma/client';
import { InboxService } from './inbox.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  User,
  type CurrentUser,
} from '../common/decorators/current-user.decorator';

@ApiTags('inbox')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inbox')
export class InboxController {
  constructor(private readonly inbox: InboxService) {}

  @Get()
  @ApiOperation({ summary: 'Список тикетов' })
  list(@User() user: CurrentUser) {
    return this.inbox.list(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать тикет' })
  create(
    @User() user: CurrentUser,
    @Body() dto: { subject: string; category: string; text: string; imageUrl?: string | null },
  ) {
    return this.inbox.create(
      user.id,
      dto.subject,
      dto.category,
      dto.text,
      dto.imageUrl,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Тикет с перепиской' })
  detail(@User() user: CurrentUser, @Param('id') id: string) {
    return this.inbox.detail(user.id, id);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Отправить сообщение' })
  addMessage(
    @User() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: { text: string; imageUrl?: string | null },
  ) {
    return this.inbox.addMessage(user.id, id, dto.text, dto.imageUrl);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить тикет (мягкое)' })
  remove(@User() user: CurrentUser, @Param('id') id: string) {
    return this.inbox.softDelete(user.id, id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Сменить статус тикета' })
  setStatus(
    @User() user: CurrentUser,
    @Param('id') id: string,
    @Body('status') status: TicketStatus,
  ) {
    return this.inbox.setStatus(user.id, id, status);
  }
}
