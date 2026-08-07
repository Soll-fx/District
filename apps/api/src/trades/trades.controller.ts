import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TradesService } from './trades.service';
import {
  CreateTradeDto,
  QueryTradesDto,
  UpdateTradeDto,
} from './dto/trade.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  User,
  type CurrentUser,
} from '../common/decorators/current-user.decorator';

@ApiTags('trades')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('trades')
export class TradesController {
  constructor(private readonly trades: TradesService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Агрегированная статистика сделок' })
  stats(@User() user: CurrentUser) {
    return this.trades.stats(user.id);
  }

  @Get('equity')
  @ApiOperation({ summary: 'Кривая капитала за N дней' })
  equity(@User() user: CurrentUser, @Query('days') days?: string) {
    return this.trades.equityCurve(user.id, Number(days) || 30);
  }

  @Post()
  @ApiOperation({ summary: 'Создать сделку' })
  create(@User() user: CurrentUser, @Body() dto: CreateTradeDto) {
    return this.trades.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Список сделок с фильтрами' })
  findAll(@User() user: CurrentUser, @Query() query: QueryTradesDto) {
    return this.trades.findAll(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Сделка по id' })
  findOne(@User() user: CurrentUser, @Param('id') id: string) {
    return this.trades.findOne(user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить сделку' })
  update(
    @User() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateTradeDto,
  ) {
    return this.trades.update(user.id, id, dto);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Восстановить из корзины' })
  restore(@User() user: CurrentUser, @Param('id') id: string) {
    return this.trades.restore(user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить (мягкое удаление)' })
  remove(@User() user: CurrentUser, @Param('id') id: string) {
    return this.trades.softDelete(user.id, id);
  }

  @Delete(':id/purge')
  @ApiOperation({ summary: 'Очистить из корзины' })
  purge(@User() user: CurrentUser, @Param('id') id: string) {
    return this.trades.purge(user.id, id);
  }
}
