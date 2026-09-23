import { randomBytes } from 'crypto';
import { mkdirSync } from 'fs';
import { extname, join } from 'path';
import { diskStorage } from 'multer';
import { UPLOADS_DIR } from '../streams/upload.config';

export const JOURNAL_UPLOADS_DIR = join(UPLOADS_DIR, 'journal');

export const journalUploadOptions = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      mkdirSync(JOURNAL_UPLOADS_DIR, { recursive: true });
      cb(null, JOURNAL_UPLOADS_DIR);
    },
    filename: (_req, file, cb) => {
      const ext = extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}_${randomBytes(6).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 1024 * 1024 * 64 },
};