-- User.locale: язык интерфейса (RU/EN)
ALTER TABLE "User" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'ru';
