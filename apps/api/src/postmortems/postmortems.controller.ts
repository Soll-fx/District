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
import { PostMortemsService, type PostMortemFilters } from './postmortems.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  User,
  type CurrentUser,
} from '../common/decorators/current-user.decorator';

@ApiTags('postmortems')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('postmortems')
export class PostMortemsController {
  constructor(private readonly postmortems: PostMortemsService) {}

  @Get()
  @ApiOperation({ summary: 'Список разборов' })
  list(
    @User() user: CurrentUser,
    @Query('result') result?: string,
    @Query('asset') asset?: string,
    @Query('q') q?: string,
    @Query('tradeId') tradeId?: string,
  ) {
    const filters: PostMortemFilters = { result, asset, q, tradeId };
    return this.postmortems.list(user.id, filters);
  }

  @Post()
  @ApiOperation({ summary: 'Создать/обновить разбор для сделки' })
  create(
    @User() user: CurrentUser,
    @Body() dto: { tradeId: string; content: string },
  ) {
    return this.postmortems.create(user.id, dto.tradeId, dto.content);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить разбор' })
  update(
    @User() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: { content: string },
  ) {
    return this.postmortems.update(user.id, id, dto.content);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить разбор' })
  remove(@User() user: CurrentUser, @Param('id') id: string) {
    return this.postmortems.remove(user.id, id);
  }
}
