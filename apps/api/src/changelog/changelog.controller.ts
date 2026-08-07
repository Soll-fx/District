import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChangelogService } from './changelog.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('changelog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('changelog')
export class ChangelogController {
  constructor(private readonly changelog: ChangelogService) {}

  @Get()
  @ApiOperation({ summary: 'Список изменений' })
  list() {
    return this.changelog.list();
  }
}
