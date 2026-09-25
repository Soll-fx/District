import { Module } from '@nestjs/common';
import { UsersAdminModule } from '../../users-admin/users-admin.module';
import { TelegramAppBotService } from './telegram-app-bot.service';
import { TelegramAppBotUpdatesService } from './telegram-app-bot-updates.service';
import { TelegramAppBotController } from './telegram-app-bot.controller';

@Module({
  imports: [UsersAdminModule],
  controllers: [TelegramAppBotController],
  providers: [TelegramAppBotService, TelegramAppBotUpdatesService],
  exports: [TelegramAppBotService],
})
export class TelegramAppBotModule {}