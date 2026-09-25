import {
  Body,
  Controller,
  Headers,
  HttpException,
  Post,
  HttpCode,
} from '@nestjs/common';
import { TelegramAppBotService } from './telegram-app-bot.service';
import { TelegramAppBotUpdatesService } from './telegram-app-bot-updates.service';

@Controller('telegram-app')
export class TelegramAppBotController {
  constructor(
    private readonly bot: TelegramAppBotService,
    private readonly updates: TelegramAppBotUpdatesService,
  ) {}

  @Post('webhook')
  @HttpCode(200)
  async webhook(@Headers() headers: Record<string, string>, @Body() update: any) {
    if (!this.bot.enabled) throw new HttpException('disabled', 404);
    const secret = headers['x-telegram-bot-api-secret-token'];
    if (secret !== this.bot.webhookSecret) throw new HttpException('forbidden', 401);
    if (update) await this.updates.handleUpdate(update);
    return { ok: true };
  }
}