import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class SyncKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const expected = this.config.get<string>('SYNC_KEY');
    if (!expected) {
      throw new UnauthorizedException('Синхронизация не настроена');
    }
    const provided = request.header('x-sync-key');
    if (!provided || provided !== expected) {
      throw new UnauthorizedException('Недопустимый ключ синхронизации');
    }
    return true;
  }
}
