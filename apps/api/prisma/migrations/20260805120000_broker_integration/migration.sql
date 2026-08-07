-- Broker integration for MT4/MT5 demo (MetaApi)
CREATE TYPE "TradeSource" AS ENUM ('JOURNAL', 'BROKER');

ALTER TABLE "Trade" ADD COLUMN "source" "TradeSource" NOT NULL DEFAULT 'JOURNAL',
  ADD COLUMN "externalId" TEXT,
  ADD COLUMN "commission" DOUBLE PRECISION,
  ADD COLUMN "swap" DOUBLE PRECISION;

CREATE UNIQUE INDEX "Trade_externalId_key" ON "Trade"("externalId");

ALTER TABLE "Account" ADD COLUMN "serverName" TEXT,
  ADD COLUMN "lastSyncedAt" TIMESTAMP(3);

ALTER TABLE "Tournament" ADD COLUMN "requireBroker" BOOLEAN NOT NULL DEFAULT false;
