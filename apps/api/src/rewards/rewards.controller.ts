import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RewardsService } from './rewards.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  User,
  type CurrentUser,
} from '../common/decorators/current-user.decorator';

@ApiTags('rewards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewards: RewardsService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Метрики профиля (показано/доступно)' })
  metrics(@User() user: CurrentUser) {
    return this.rewards.metrics(user.id);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Рейтинг всех пользователей (все метрики + дисциплина)' })
  leaderboard(@User() user: CurrentUser) {
    return this.rewards.leaderboard(user.id);
  }

  @Patch('metrics/:key')
  @ApiOperation({ summary: 'Показать/скрыть метрику' })
  toggle(@User() user: CurrentUser, @Param('key') key: string) {
    return this.rewards.toggleMetric(user.id, key);
  }

  @Get('achievements')
  @ApiOperation({ summary: 'Достижения пользователя' })
  achievements(@User() user: CurrentUser) {
    return this.rewards.achievements(user.id);
  }

  @Get('feed')
  @ApiOperation({ summary: 'Социальная лента достижений' })
  feed(@User() user: CurrentUser) {
    return this.rewards.feed(user.id);
  }

  @Post('achievements/:id/reactions')
  @ApiOperation({ summary: 'Поставить/убрать реакцию-эмодзи' })
  react(
    @User() user: CurrentUser,
    @Param('id') id: string,
    @Body('emoji') emoji: string,
  ) {
    return this.rewards.react(user.id, id, emoji);
  }
}
