-- GeopoliticsPost: посты MarketTwits (Telegram) для виджета «Геополитика»
CREATE TABLE "GeopoliticsPost" (
    "id" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "tags" TEXT[] NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'MarketTwits',
    "impact" TEXT NOT NULL,
    "live" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeopoliticsPost_pkey" PRIMARY KEY ("id")
);
