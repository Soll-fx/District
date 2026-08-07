import { Module } from '@nestjs/common';
import { BrokerController } from './broker.controller';
import { BrokerService } from './broker.service';
import { BrokerSyncWorker } from './broker-sync.worker';

@Module({
  controllers: [BrokerController],
  providers: [BrokerService, BrokerSyncWorker],
  exports: [BrokerService],
})
export class BrokerModule {}
