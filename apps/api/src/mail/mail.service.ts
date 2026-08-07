import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  sendOtp(to: string, code: string): { devCode?: string } {
    console.log(`[2FA] Код для ${to}: ${code}`);
    const isProd = process.env.NODE_ENV === 'production';
    return isProd ? {} : { devCode: code };
  }
}
