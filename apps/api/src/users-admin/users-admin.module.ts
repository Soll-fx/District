import { Module } from '@nestjs/common';
import { TradesModule } from '../trades/trades.module';
import { UsersAdminController } from './users-admin.controller';
import { UsersAdminService } from './users-admin.service';

@Module({
  imports: [TradesModule],
  controllers: [UsersAdminController],
  providers: [UsersAdminService],
})
export class UsersAdminModule {}
