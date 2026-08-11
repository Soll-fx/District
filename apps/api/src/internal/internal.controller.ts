import { Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NewsService } from '../news/news.service';
import { GeopoliticsService } from '../geopolitics/geopolitics.service';
import { SyncKeyGuard } from '../common/guards/sync-key.guard';

@ApiTags('internal')
@Controller('internal')
export class InternalController {
  constructor(
    private readonly news: NewsService,
    private readonly geopolitics: GeopoliticsService,
  ) {}

  @Post('sync/news')
  @HttpCode(200)
  @UseGuards(SyncKeyGuard)
  @ApiOperation({ summary: 'Принудительный синк новостей (внешний cron)' })
  syncNews() {
    return this.news.sync();
  }

  @Post('sync/geopolitics')
  @HttpCode(200)
  @UseGuards(SyncKeyGuard)
  @ApiOperation({ summary: 'Принудительный синк геополитики (внешний cron)' })
  syncGeopolitics() {
    return this.geopolitics.sync();
  }
}
