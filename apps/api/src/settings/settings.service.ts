import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { generateOtpCode, generateBackupCodes, sha256hex } from '../common/2fa';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async updateProfile(
    userId: string,
    dto: {
      name?: string;
      email?: string;
      locale?: 'ru' | 'en';
      timezone?: string;
      avatarUrl?: string | null;
      instagram?: string | null;
      telegram?: string | null;
      youtube?: string | null;
      tradingview?: string | null;
    },
  ) {
    if (dto.email) {
      const clash = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (clash && clash.id !== userId) throw new Error('Email уже занят');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        email: dto.email,
        locale: dto.locale,
        timezone: dto.timezone,
        avatarUrl: dto.avatarUrl === undefined ? undefined : dto.avatarUrl,
        instagram:
          dto.instagram === undefined ? undefined : dto.instagram || null,
        telegram: dto.telegram === undefined ? undefined : dto.telegram || null,
        youtube: dto.youtube === undefined ? undefined : dto.youtube || null,
        tradingview:
          dto.tradingview === undefined ? undefined : dto.tradingview || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        locale: true,
        timezone: true,
        instagram: true,
        telegram: true,
        youtube: true,
        tradingview: true,
      },
    });
  }

  async sendTwoFactorCode(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new UnauthorizedException();

    const code = generateOtpCode();
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorCodeHash: sha256hex(code),
        twoFactorCodeExpiry: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
    const { devCode } = this.mail.sendOtp(user.email, code);
    return { sent: true, devCode };
  }

  async enableTwoFactor(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new UnauthorizedException();
    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA уже включена');
    }
    this.assertCode(user, code);

    const backupCodes = generateBackupCodes(8);
    const hashes = await Promise.all(
      backupCodes.map((c) => bcrypt.hash(c, 10)),
    );
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorCodeHash: null,
        twoFactorCodeExpiry: null,
        twoFactorBackupCodes: JSON.stringify(hashes),
      },
    });
    return { enabled: true, backupCodes };
  }

  async disableTwoFactor(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new UnauthorizedException();
    if (!user.twoFactorEnabled) {
      throw new BadRequestException('2FA не включена');
    }
    this.assertCode(user, code);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorCodeHash: null,
        twoFactorCodeExpiry: null,
        twoFactorBackupCodes: null,
      },
    });
    return { enabled: false };
  }

  private assertCode(
    user: {
      twoFactorCodeHash: string | null;
      twoFactorCodeExpiry: Date | null;
    },
    code: string,
  ) {
    if (
      !user.twoFactorCodeHash ||
      !user.twoFactorCodeExpiry ||
      new Date() > user.twoFactorCodeExpiry ||
      sha256hex(code) !== user.twoFactorCodeHash
    ) {
      throw new BadRequestException('Неверный или истёкший код');
    }
  }

  async integrations(userId: string) {
    const providers = ['TradingView', 'MT5', 'Telegram'];
    const existing = await this.prisma.integration.findMany({
      where: { userId },
    });
    const map = new Map(existing.map((i) => [i.provider, i]));
    return providers.map(
      (p) =>
        map.get(p) ?? { id: null, provider: p, connected: false, meta: null },
    );
  }

  async setIntegration(userId: string, provider: string, connected: boolean) {
    const existing = await this.prisma.integration.findFirst({
      where: { userId, provider },
    });
    if (existing) {
      return this.prisma.integration.update({
        where: { id: existing.id },
        data: { connected },
      });
    }
    return this.prisma.integration.create({
      data: { userId, provider, connected },
    });
  }
}
