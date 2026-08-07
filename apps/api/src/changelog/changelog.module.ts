import { Module } from '@nestjs/common';
import { ChangelogService } from './changelog.service';
import { ChangelogController } from './changelog.controller';

@Module({
  providers: [ChangelogService],
  controllers: [ChangelogController],
  exports: [ChangelogService],
})
export class ChangelogModule {}
