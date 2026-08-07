import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { EmailLoginDto } from './dto/email-login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { VerifyTwoFactorDto } from './dto/verify-two-factor.dto';
import { sha256hex, parseDevice, requestIp, type DeviceInfo } from '../common/device';
import { generateOtpCode } from '../common/2fa';
import { MailService } from '../mail/mail.service';

export type LoginMeta = {
  userAgent?: string;
  ip?: string;
  req?: { ip?: string; headers?: { 'x-forwarded-for'?: string | string[] } };
};

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const CODE_TTL_MS = 10 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto, meta: LoginMeta = {}) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) {
      throw new UnauthorizedException(
        'Пользователь с таким email уже существует',
      );
    }

    let promoId: string | null = null;
    if (dto.promoCode) {
      const promo = await this.prisma.promoCode.findUnique({
        where: { code: dto.promoCode.trim().toUpperCase() },
      });
      if (!promo || !promo.isActive) {
        throw new UnauthorizedException('Промокод недействителен');
      }
      promoId = promo.id;
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const name = dto.name ?? (dto.email.split('@')[0] || 'User');
    const code = generateOtpCode();
    const { devCode } = this.mail.sendOtp(dto.email, code);

    const token = this.jwt.sign(
      {
        sub: dto.email,
        type: 'register',
        email: dto.email,
        name,
        passwordHash,
        promoId,
        codeHash: sha256hex(code),
      },
      { expiresIn: '10m' },
    );

    return { requiresTwoFactor: true, twoFactorToken: token, devCode };
  }

  async confirmRegistration(
    dto: VerifyTwoFactorDto,
    meta: LoginMeta = {},
  ) {
    let payload: Record<string, any>;
    try {
      payload = this.jwt.verify(dto.twoFactorToken);
    } catch {
      throw new UnauthorizedException(
        'Код истёк, повторите регистрацию',
      );
    }
    if (payload.type !== 'register' || !payload.codeHash) {
      throw new UnauthorizedException();
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: payload.email },
    });
    if (existing) {
      throw new UnauthorizedException(
        'Пользователь с таким email уже существует',
      );
    }

    if (sha256hex(dto.code) !== payload.codeHash) {
      throw new UnauthorizedException('Неверный код');
    }

    const user = await this.prisma.user.create({
      data: {
        email: payload.email,
        passwordHash: payload.passwordHash,
        name: payload.name,
      },
    });

    if (payload.promoId) {
      await this.prisma.promoRedemption.upsert({
        where: {
          promoId_userId: { promoId: payload.promoId, userId: user.id },
        },
        create: { promoId: payload.promoId, userId: user.id },
        update: {},
      });
    }

    return this.createSession(user, meta);
  }

  async emailLogin(dto: EmailLoginDto, meta: LoginMeta = {}) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Пользователь с таким email не найден');
    }

    const code = generateOtpCode();
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorCodeHash: sha256hex(code),
        twoFactorCodeExpiry: new Date(Date.now() + CODE_TTL_MS),
      },
    });
    const { devCode } = this.mail.sendOtp(user.email, code);
    const token = this.jwt.sign(
      { sub: user.id, type: 'email-login' },
      { expiresIn: '5m' },
    );
    return { requiresTwoFactor: true, twoFactorToken: token, devCode };
  }

  async login(dto: LoginDto, meta: LoginMeta = {}) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    if (user.twoFactorEnabled) {
      return this.issueTwoFactorChallenge(user);
    }

    return this.createSession(user, meta);
  }

  private async issueTwoFactorChallenge(
    user: { id: string; email: string },
  ) {
    const code = generateOtpCode();
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorCodeHash: sha256hex(code),
        twoFactorCodeExpiry: new Date(Date.now() + CODE_TTL_MS),
      },
    });
    const { devCode } = this.mail.sendOtp(user.email, code);
    const twoFactorToken = this.jwt.sign(
      { sub: user.id, type: '2fa' },
      { expiresIn: '5m' },
    );
    return { requiresTwoFactor: true, twoFactorToken, devCode };
  }

  async verifyTwoFactor(dto: VerifyTwoFactorDto, meta: LoginMeta = {}) {
    let payload: { sub: string; type?: string };
    try {
      payload = this.jwt.verify<{ sub: string; type?: string }>(
        dto.twoFactorToken,
      );
    } catch {
      throw new UnauthorizedException('Код истёк, повторите вход');
    }
    if (payload.type !== '2fa' && payload.type !== 'email-login') {
      throw new UnauthorizedException();
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) throw new UnauthorizedException();

    if (
      user.twoFactorCodeHash &&
      user.twoFactorCodeExpiry &&
      new Date() < user.twoFactorCodeExpiry &&
      sha256hex(dto.code) === user.twoFactorCodeHash
    ) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { twoFactorCodeHash: null, twoFactorCodeExpiry: null },
      });
      return this.createSession(user, meta);
    }

    if (user.twoFactorBackupCodes) {
      const hashes = JSON.parse(user.twoFactorBackupCodes) as string[];
      for (let i = 0; i < hashes.length; i++) {
        if (await bcrypt.compare(dto.code, hashes[i])) {
          hashes.splice(i, 1);
          await this.prisma.user.update({
            where: { id: user.id },
            data: {
              twoFactorBackupCodes: hashes.length
                ? JSON.stringify(hashes)
                : null,
            },
          });
          return this.createSession(user, meta);
        }
      }
    }

    throw new UnauthorizedException('Неверный код');
  }

  private async createSession(
    user: { id: string; email: string; name: string; avatarUrl: string | null; role: string; locale: string; timezone: string },
    meta: LoginMeta,
  ) {
    const device: DeviceInfo = parseDevice(meta.userAgent ?? '');
    const sessionToken = randomBytes(24).toString('hex');
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: sha256hex(sessionToken),
        deviceName: device.deviceName,
        browser: device.browser,
        os: device.os,
        ip: meta.req ? requestIp(meta.req) : (meta.ip ?? null),
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      },
    });

    const token = this.jwt.sign({
      sub: user.id,
      email: user.email,
      sid: sessionToken,
    });
    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        locale: user.locale,
        timezone: user.timezone,
      },
    };
  }

  async listSessions(userId: string, currentSid?: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastActiveAt: 'desc' },
      select: {
        id: true,
        deviceName: true,
        browser: true,
        os: true,
        ip: true,
        createdAt: true,
        lastActiveAt: true,
      },
    });
    return sessions.map((s) => ({ ...s, current: s.id === currentSid }));
  }

  async revokeSession(userId: string, sessionId: string) {
    await this.prisma.session.updateMany({
      where: { id: sessionId, userId },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  async revokeOthers(userId: string, currentSid?: string) {
    await this.prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
        ...(currentSid ? { NOT: { id: currentSid } } : {}),
      },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new UnauthorizedException();

    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Неверный текущий пароль');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    return { success: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        twoFactorEnabled: true,
        locale: true,
        timezone: true,
        instagram: true,
        telegram: true,
        youtube: true,
        tradingview: true,
        createdAt: true,
      },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
