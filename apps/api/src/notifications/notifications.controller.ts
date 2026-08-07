import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import {
  SubscribePushDto,
  UpdateNotificationPrefsDto,
} from './dto/notifications.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  User,
  type CurrentUser,
} from '../common/decorators/current-user.decorator';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('vapid-public-key')
  @ApiOperation({ summary: 'Публичный ключ VAPID (без авторизации)' })
  vapidPublicKey() {
    return { publicKey: this.notifications.getVapidPublicKey() };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('preferences')
  @ApiOperation({ summary: 'Настройки уведомлений пользователя' })
  preferences(@User() user: CurrentUser) {
    return this.notifications.getPreferences(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('preferences')
  @ApiOperation({ summary: 'Сохранить настройки уведомлений' })
  setPreferences(
    @User() user: CurrentUser,
    @Body() dto: UpdateNotificationPrefsDto,
  ) {
    return this.notifications.setPreferences(user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('subscribe')
  @ApiOperation({ summary: 'Сохранить push-подписку браузера' })
  subscribe(@User() user: CurrentUser, @Body() dto: SubscribePushDto) {
    return this.notifications.subscribe(user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('subscribe')
  @ApiOperation({ summary: 'Удалить push-подписку' })
  unsubscribe(
    @User() user: CurrentUser,
    @Body('endpoint') endpoint: string,
  ) {
    return this.notifications.unsubscribe(user.id, endpoint);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('test')
  @ApiOperation({ summary: 'Отправить тестовое уведомление' })
  test(@User() user: CurrentUser) {
    return this.notifications.sendTest(user.id);
  }
}
