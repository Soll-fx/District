import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IdeaStatus } from '@prisma/client';
import { IdeasService } from './ideas.service';
import { CreateIdeaDto, UpdateIdeaDto, QueryIdeasDto } from './dto/idea.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  User,
  type CurrentUser,
} from '../common/decorators/current-user.decorator';

@ApiTags('ideas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ideas')
export class IdeasController {
  constructor(private readonly ideas: IdeasService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Статистика идей' })
  stats(@User() user: CurrentUser) {
    return this.ideas.stats(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать идею' })
  create(@User() user: CurrentUser, @Body() dto: CreateIdeaDto) {
    return this.ideas.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Список идей по статусу' })
  findAll(@User() user: CurrentUser, @Query() query: QueryIdeasDto) {
    return this.ideas.findAll(user.id, query);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Сменить статус идеи' })
  updateStatus(
    @User() user: CurrentUser,
    @Param('id') id: string,
    @Body('status') status: IdeaStatus,
  ) {
    return this.ideas.updateStatus(user.id, id, status);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Редактировать идею' })
  update(
    @User() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateIdeaDto,
  ) {
    return this.ideas.update(user.id, id, dto);
  }

  @Post(':id/convert')
  @ApiOperation({ summary: 'Конвертировать идею в сделку' })
  convert(
    @User() user: CurrentUser,
    @Param('id') id: string,
    @Body('pnl') pnl?: number,
  ) {
    return this.ideas.convertToTrade(user.id, id, pnl);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Восстановить из корзины' })
  restore(@User() user: CurrentUser, @Param('id') id: string) {
    return this.ideas.restore(user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить идею (мягкое)' })
  remove(@User() user: CurrentUser, @Param('id') id: string) {
    return this.ideas.softDelete(user.id, id);
  }
}
