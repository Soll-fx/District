import { createHash } from 'crypto';

export function sha256hex(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export type DeviceInfo = {
  browser: string;
  os: string;
  deviceName: string;
};

export function parseDevice(userAgent: string): DeviceInfo {
  const ua = userAgent || '';
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\/|Opera/.test(ua)
      ? 'Opera'
      : /Firefox\//.test(ua)
        ? 'Firefox'
        : /Chrome\/|CriOS\//.test(ua)
          ? 'Chrome'
          : /Safari\//.test(ua)
            ? 'Safari'
            : 'Неизвестно';
  const os = /Windows NT/.test(ua)
    ? 'Windows'
    : /Mac OS X/.test(ua)
      ? 'macOS'
      : /Android/.test(ua)
        ? 'Android'
        : /iPhone|iPad|iPod/.test(ua)
          ? 'iOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : 'Неизвестно';
  const mobile = /Android|iPhone|iPad|iPod|Mobile/.test(ua);
  const deviceName = `${browser} · ${os}${mobile ? ' · Smartphone' : ''}`;
  return { browser, os, deviceName };
}

export function requestIp(
  req: { ip?: string; headers?: { 'x-forwarded-for'?: string | string[] } },
): string | null {
  const fwd = req.headers?.['x-forwarded-for'];
  if (Array.isArray(fwd)) return fwd[0] ?? null;
  if (typeof fwd === 'string') return fwd.split(',')[0].trim() || null;
  return req.ip ?? null;
}
