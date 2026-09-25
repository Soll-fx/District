import { createHmac } from 'crypto';

const BOT_API = 'https://api.telegram.org';

export type TgPayload = Record<string, unknown>;

export async function apiPost(
  token: string,
  method: string,
  payload: TgPayload,
): Promise<{ ok: boolean; result?: unknown } | null> {
  try {
    const res = await fetch(`${BOT_API}/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return null;
    return data as { ok: boolean; result?: unknown };
  } catch {
    return null;
  }
}

function rawSign(token: string, payload: string): string {
  return createHmac('sha256', token)
    .update(payload)
    .digest('base64url')
    .slice(0, 16);
}

export function signData(token: string, data: string): string {
  return `${data}:${rawSign(token, data)}`;
}

export function parseData(token: string, data: string): string | null {
  if (!data) return null;
  const i = data.lastIndexOf(':');
  if (i <= 0) return null;
  const payload = data.slice(0, i);
  const sig = data.slice(i + 1);
  return rawSign(token, payload) === sig ? payload : null;
}

export function escapeHtml(value: string): string {
  return String(value).replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

export async function setCommands(token: string) {
  await apiPost(token, 'setMyCommands', {
    commands: [
      { command: 'start', description: 'Запустить бота' },
      { command: 'admin', description: 'Админ-панель (только для админа)' },
    ],
  });
}

export async function setBotWebhook(token: string, url: string, secret: string): Promise<boolean> {
  const res = await apiPost(token, 'setWebhook', {
    url,
    secret_token: secret,
    allowed_updates: ['message', 'callback_query'],
  });
  return Boolean(res?.ok);
}

export async function sendBotMessage(
  token: string,
  chatId: number | string,
  text: string,
  replyMarkup?: TgPayload,
) {
  const payload: TgPayload = {
    chat_id: chatId,
    text: text.slice(0, 4000),
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };
  if (replyMarkup) payload.reply_markup = replyMarkup;
  await apiPost(token, 'sendMessage', payload);
}

export async function answerBotCallback(token: string, queryId: string, text: string) {
  await apiPost(token, 'answerCallbackQuery', {
    callback_query_id: queryId,
    text: text.slice(0, 200),
    show_alert: false,
  });
}