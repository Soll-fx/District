-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastSeenAt" TIMESTAMP(3),
ADD COLUMN     "tgAccess" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tgAccessGrantedAt" TIMESTAMP(3),
ADD COLUMN     "tgAccessRevokedAt" TIMESTAMP(3);

UPDATE "User" SET "tgAccess" = true WHERE "telegramId" IS NOT NULL;
