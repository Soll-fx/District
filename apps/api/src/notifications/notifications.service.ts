import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';

export type PushPayload = {
  title: string;
  body: string;
  url: string;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly publicKey: string;
  private readonly privateKey: string;
  private readonly subject: string;
  private readonly enabled: boolean;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.publicKey = config.get<string>('VAPID_PUBLIC_KEY') ?? '';
    this.privateKey = config.get<string>('VAPID_PRIVATE_KEY') ?? '';
    this.subject =
      config.get<string>('VAPID_SUBJECT') ?? 'mailto:notify@example.com';
    this.enabled = Boolean(this.publicKey && this.privateKey);
    if (!this.enabled) {
      this.logger.warn('VAPID keys не заданы — web push отключён');
    }
  }

  getVapidPublicKey() {
    return this.publicKey;
  }

  isEnabled() {
    return this.enabled;
  }

  async getPreferences(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        emailNotif: true,
        pushNotif: true,
        ideaAlerts: true,
        weeklyDigest: true,
        pushSubscriptions: { select: { endpoint: true } },
      },
    });
    return {
      emailNotif: user?.emailNotif ?? true,
      pushNotif: user?.pushNotif ?? true,
      ideaAlerts: user?.ideaAlerts ?? true,
      weeklyDigest: user?.weeklyDigest ?? false,
      subscribed: (user?.pushSubscriptions?.length ?? 0) > 0,
    };
  }

  async setPreferences(
    userId: string,
    dto: {
      emailNotif?: boolean;
      pushNotif?: boolean;
      ideaAlerts?: boolean;
      weeklyDigest?: boolean;
    },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        emailNotif: dto.emailNotif,
        pushNotif: dto.pushNotif,
        ideaAlerts: dto.ideaAlerts,
        weeklyDigest: dto.weeklyDigest,
      },
      select: {
        emailNotif: true,
        pushNotif: true,
        ideaAlerts: true,
        weeklyDigest: true,
      },
    });
  }

  async subscribe(
    userId: string,
    dto: { endpoint: string; p256dh: string; auth: string },
  ) {
    return this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      create: { userId, ...dto },
      update: { userId, p256dh: dto.p256dh, auth: dto.auth },
    });
  }

  async unsubscribe(userId: string, endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
    return { unsubscribed: true };
  }

  async sendToUser(userId: string, payload: PushPayload) {
    if (!this.enabled) return { sent: 0, disabled: true };
    const subs = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });
    if (subs.length === 0) return { sent: 0 };
    let sent = 0;
    const text = JSON.stringify(payload);
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          text,
          {
            vapidDetails: {
              subject: this.subject,
              publicKey: this.publicKey,
              privateKey: this.privateKey,
            },
            TTL: 3600,
          },
        );
        sent++;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await this.prisma.pushSubscription.deleteMany({
            where: { endpoint: sub.endpoint },
          });
        } else {
          this.logger.error(
            `Push send failed: ${statusCode} ${(err as Error)?.message}`,
          );
        }
      }
    }
    return { sent };
  }

  async sendIdeaAlert(userId: string, payload: PushPayload) {
    const prefs = await this.getPreferences(userId);
    if (!prefs.pushNotif || !prefs.ideaAlerts) return { sent: 0, skipped: true };
    return this.sendToUser(userId, payload);
  }

  async sendTest(userId: string) {
    return this.sendToUser(userId, {
      title: 'Тест уведомления',
      body: 'Пуш-уведомления работают!',
      url: '/settings?tab=notifications',
    });
  }
}
