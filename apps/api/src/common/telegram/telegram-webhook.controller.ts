import { Body, Controller, Headers, HttpCode, Post, UnauthorizedException } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { TelegramService } from './telegram.service';
import { TelegramUpdatesService } from './telegram-updates.service';

@ApiExcludeController()
@Controller('telegram/webhook')
export class TelegramWebhookController {
  constructor(
    private readonly telegram: TelegramService,
    private readonly updates: TelegramUpdatesService,
  ) {}

  @Post()
  @HttpCode(200)
  handle(
    @Headers('x-telegram-bot-api-secret-token') secret: string | undefined,
    @Body() body: any,
  ) {
    if (!this.telegram.enabled || !secret || secret !== this.telegram.hookSecret) {
      throw new UnauthorizedException();
    }
    void this.updates.handleUpdate(body);
    return { ok: true };
  }
}