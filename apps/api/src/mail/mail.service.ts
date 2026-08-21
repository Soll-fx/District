import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  private getTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
    const port = Number(SMTP_PORT ?? 587);
    this.transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    return this.transporter;
  }

  async sendOtp(to: string, code: string): Promise<{ devCode?: string }> {
    const apiKey = process.env.BREVO_API_KEY;
    if (apiKey) {
      return this.sendViaBrevo(apiKey, to, code);
    }

    const transporter = this.getTransporter();
    if (!transporter) {
      if (process.env.NODE_ENV === 'production') {
        this.logger.error('Почта не настроена — письмо не отправлено');
        throw new ServiceUnavailableException(
          'Сервис отправки почты временно недоступен',
        );
      }
      this.logger.warn(`[DEV] Код для ${to}: ${code}`);
      return { devCode: code };
    }

    const from = process.env.SMTP_FROM ?? `Sollo <${process.env.SMTP_USER}>`;
    try {
      await transporter.sendMail({
        from,
        to,
        subject: 'Код подтверждения Sollo',
        text: `Ваш код подтверждения: ${code}\n\nКод действует 10 минут. Если вы не запрашивали его — просто проигнорируйте это письмо.`,
        html: this.otpHtml(code),
      });
      this.logger.log(`Код отправлен на ${to}`);
      return {};
    } catch (err) {
      this.logger.error(
        `Ошибка отправки на ${to}: ${err instanceof Error ? err.message : err}`,
      );
      throw new ServiceUnavailableException(
        'Не удалось отправить код, попробуйте ещё раз',
      );
    }
  }

  private async sendViaBrevo(
    apiKey: string,
    to: string,
    code: string,
  ): Promise<{ devCode?: string }> {
    const fromEmail = process.env.BREVO_FROM_EMAIL ?? process.env.SMTP_USER;
    if (!fromEmail) {
      this.logger.error('BREVO_FROM_EMAIL не задан');
      throw new ServiceUnavailableException(
        'Сервис отправки почты временно недоступен',
      );
    }

    let res: Response;
    try {
      res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'content-type': 'application/json',
          accept: 'application/json',
        },
        signal: AbortSignal.timeout(15_000),
        body: JSON.stringify({
          sender: { name: 'Sollo', email: fromEmail },
          to: [{ email: to }],
          subject: 'Код подтверждения Sollo',
          textContent: `Ваш код подтверждения: ${code}\n\nКод действует 10 минут. Если вы не запрашивали его — просто проигнорируйте это письмо.`,
          htmlContent: this.otpHtml(code),
        }),
      });
    } catch (err) {
      this.logger.error(
        `Brevo недоступен: ${err instanceof Error ? err.message : err}`,
      );
      throw new ServiceUnavailableException(
        'Не удалось отправить код, попробуйте ещё раз',
      );
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      this.logger.error(`Brevo ${res.status} для ${to}: ${body.slice(0, 300)}`);
      throw new ServiceUnavailableException(
        'Не удалось отправить код, попробуйте ещё раз',
      );
    }

    this.logger.log(`Код отправлен на ${to} через Brevo`);
    return {};
  }

  private otpHtml(code: string): string {
    return `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:420px;background:#14141c;border:1px solid #26262f;border-radius:16px;padding:40px 32px;text-align:center;">
          <tr><td style="padding-bottom:8px;">
            <span style="font-size:22px;font-weight:700;color:#fafafa;letter-spacing:-0.5px;">Sollo</span>
          </td></tr>
          <tr><td style="padding-bottom:24px;">
            <span style="font-size:14px;color:#9d9da8;">Журнал сделок и аналитика</span>
          </td></tr>
          <tr><td style="padding-bottom:12px;">
            <span style="display:block;font-size:14px;color:#c7c7cf;">Ваш код подтверждения</span>
          </td></tr>
          <tr><td style="padding-bottom:24px;">
            <div style="display:inline-block;background:#1e1e29;border:1px solid #34343f;border-radius:12px;padding:14px 32px;font-size:32px;font-weight:700;letter-spacing:8px;color:#fafafa;">${code}</div>
          </td></tr>
          <tr><td style="padding-bottom:4px;">
            <span style="font-size:13px;color:#9d9da8;">Действует 10 минут</span>
          </td></tr>
          <tr><td>
            <span style="font-size:12px;color:#5f5f6b;">Если вы не запрашивали код — просто проигнорируйте это письмо.</span>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
  }
}
