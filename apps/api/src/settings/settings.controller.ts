import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  User,
  type CurrentUser,
} from '../common/decorators/current-user.decorator';
import { TwoFactorCodeDto } from './dto/two-factor-code.dto';

@ApiTags('settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Patch('profile')
  @ApiOperation({ summary: 'Обновить профиль' })
  updateProfile(
    @User() user: CurrentUser,
    @Body()
    dto: {
      name?: string;
      email?: string;
      locale?: 'ru' | 'en';
      timezone?: string;
      avatarUrl?: string | null;
      instagram?: string | null;
      telegram?: string | null;
      youtube?: string | null;
      tradingview?: string | null;
    },
  ) {
    return this.settings.updateProfile(user.id, dto);
  }

  @Post('2fa/send-code')
  @ApiOperation({ summary: 'Отправить код 2FA на email' })
  sendTwoFactorCode(@User() user: CurrentUser) {
    return this.settings.sendTwoFactorCode(user.id);
  }

  @Post('2fa/enable')
  @ApiOperation({ summary: 'Включить 2FA' })
  enableTwoFactor(@User() user: CurrentUser, @Body() dto: TwoFactorCodeDto) {
    return this.settings.enableTwoFactor(user.id, dto.code);
  }

  @Post('2fa/disable')
  @ApiOperation({ summary: 'Отключить 2FA' })
  disableTwoFactor(@User() user: CurrentUser, @Body() dto: TwoFactorCodeDto) {
    return this.settings.disableTwoFactor(user.id, dto.code);
  }

  @Get('integrations')
  @ApiOperation({ summary: 'Интеграции' })
  integrations(@User() user: CurrentUser) {
    return this.settings.integrations(user.id);
  }

  @Post('integrations')
  @ApiOperation({ summary: 'Подключить/отключить интеграцию' })
  setIntegration(
    @User() user: CurrentUser,
    @Body() dto: { provider: string; connected: boolean },
  ) {
    return this.settings.setIntegration(user.id, dto.provider, dto.connected);
  }
}
