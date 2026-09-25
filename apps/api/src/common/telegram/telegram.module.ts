import { Global, Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramUpdatesService } from './telegram-updates.service';
import { TelegramWebhookController } from './telegram-webhook.controller';
import { InboxModule } from '../../inbox/inbox.module';
import { UsersAdminModule } from '../../users-admin/users-admin.module';

@Global()
@Module({
  imports: [InboxModule, UsersAdminModule],
  controllers: [TelegramWebhookController],
  providers: [TelegramService, TelegramUpdatesService],
  exports: [TelegramService],
})
export class TelegramModule {}
