import { randomBytes } from 'crypto';
import { mkdirSync } from 'fs';
import { extname, join } from 'path';
import { diskStorage } from 'multer';

export const UPLOADS_DIR = join(process.cwd(), 'uploads');
export const STREAMS_UPLOADS_DIR = join(UPLOADS_DIR, 'streams');

export const streamUploadOptions = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      mkdirSync(STREAMS_UPLOADS_DIR, { recursive: true });
      cb(null, STREAMS_UPLOADS_DIR);
    },
    filename: (_req, file, cb) => {
      const ext = extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}_${randomBytes(6).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 1024 * 1024 * 1024 },
};
