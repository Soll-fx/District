import { Module } from '@nestjs/common';
import { PromosService } from './promos.service';
import { PromosController } from './promos.controller';

@Module({
  providers: [PromosService],
  controllers: [PromosController],
})
export class PromosModule {}
