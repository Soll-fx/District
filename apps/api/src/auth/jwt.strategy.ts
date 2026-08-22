import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { sha256hex } from '../common/device';

export type JwtPayload = { sub: string; email: string; sid?: string };

const LAST_ACTIVE_THROTTLE_MS = 5 * 60 * 1000;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'dev-secret-change-me',
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sid) return null;

    const tokenHash = sha256hex(payload.sid);
    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
    });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      return null;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, role: true, banned: true },
    });
    if (!user || user.banned) return null;

    if (Date.now() - session.lastActiveAt.getTime() > LAST_ACTIVE_THROTTLE_MS) {
      void this.prisma.session
        .update({ where: { id: session.id }, data: { lastActiveAt: new Date() } })
        .catch(() => {});
    }

    return { id: user.id, email: user.email, role: user.role, sid: session.id };
  }
}
