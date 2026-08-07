import { Module } from '@nestjs/common';
import { PostMortemsService } from './postmortems.service';
import { PostMortemsController } from './postmortems.controller';

@Module({
  providers: [PostMortemsService],
  controllers: [PostMortemsController],
  exports: [PostMortemsService],
})
export class PostMortemsModule {}
