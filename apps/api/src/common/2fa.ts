import { randomBytes, randomInt } from 'crypto';
import { sha256hex } from './device';

const BACKUP_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateOtpCode(): string {
  return String(randomInt(100000, 1000000));
}

export function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  const bytes = randomBytes(count * 12);
  for (let i = 0; i < count; i++) {
    let code = '';
    for (let j = 0; j < 5; j++) {
      code += BACKUP_CHARS[bytes[i * 12 + j] % BACKUP_CHARS.length];
    }
    code += '-';
    for (let j = 5; j < 10; j++) {
      code += BACKUP_CHARS[bytes[i * 12 + j] % BACKUP_CHARS.length];
    }
    codes.push(code);
  }
  return codes;
}

export { sha256hex };
