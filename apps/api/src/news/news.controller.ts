import { Controller, Get, HttpCode, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { NewsService } from './news.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

@ApiTags('news')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('news')
export class NewsController {
  constructor(private readonly news: NewsService) {}

  @Get()
  @ApiOperation({ summary: 'Экономический календарь' })
  @ApiQuery({
    name: 'impact',
    required: false,
    enum: ['high', 'medium', 'low'],
  })
  list(@Query('impact') impact?: string) {
    return this.news.list(impact);
  }

  @Post('sync')
  @HttpCode(200)
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Принудительная синхронизация ForexFactory' })
  sync() {
    return this.news.sync();
  }
}
