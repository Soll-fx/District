import { Module } from '@nestjs/common';
import { InternalController } from './internal.controller';
import { NewsModule } from '../news/news.module';
import { GeopoliticsModule } from '../geopolitics/geopolitics.module';

@Module({
  imports: [NewsModule, GeopoliticsModule],
  controllers: [InternalController],
})
export class InternalModule {}
