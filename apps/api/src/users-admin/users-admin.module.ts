import { Module } from '@nestjs/common';
import { TradesModule } from '../trades/trades.module';
import { RewardsModule } from '../rewards/rewards.module';
import { UsersAdminController } from './users-admin.controller';
import { UsersAdminService } from './users-admin.service';

@Module({
  imports: [TradesModule, RewardsModule],
  controllers: [UsersAdminController],
  providers: [UsersAdminService],
  exports: [UsersAdminService],
})
export class UsersAdminModule {}
