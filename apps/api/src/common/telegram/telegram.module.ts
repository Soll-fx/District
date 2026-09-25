import { Global, Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramUpdatesService } from './telegram-updates.service';
import { InboxModule } from '../../inbox/inbox.module';
import { UsersAdminModule } from '../../users-admin/users-admin.module';

@Global()
@Module({
  imports: [InboxModule, UsersAdminModule],
  providers: [TelegramService, TelegramUpdatesService],
  exports: [TelegramService],
})
export class TelegramModule {}
