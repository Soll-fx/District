import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { GeopoliticsService } from './geopolitics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('geopolitics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('geopolitics')
export class GeopoliticsController {
  constructor(private readonly geopolitics: GeopoliticsService) {}

  @Get()
  @ApiOperation({ summary: 'Лента геополитики (MarketTwits)' })
  @ApiQuery({ name: 'lang', required: false, enum: ['ru', 'en'] })
  list(@Query('lang') lang?: string) {
    return this.geopolitics.list(lang);
  }
}
