import { Global, Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramUpdatesService } from './telegram-updates.service';

@Global()
@Module({
  providers: [TelegramService, TelegramUpdatesService],
  exports: [TelegramService],
})
export class TelegramModule {}
