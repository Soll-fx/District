import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InboxService } from './inbox.service';
import { InboxController } from './inbox.controller';
import { InboxGateway } from './inbox.gateway';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? 'dev-secret-change-me',
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  providers: [InboxService, InboxGateway],
  controllers: [InboxController],
  exports: [InboxService, InboxGateway],
})
export class InboxModule {}
