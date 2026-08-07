import { Module } from '@nestjs/common';
import { GeopoliticsController } from './geopolitics.controller';
import { GeopoliticsService } from './geopolitics.service';

@Module({
  controllers: [GeopoliticsController],
  providers: [GeopoliticsService],
})
export class GeopoliticsModule {}
