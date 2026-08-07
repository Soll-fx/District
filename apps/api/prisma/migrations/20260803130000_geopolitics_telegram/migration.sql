-- AlterTable
ALTER TABLE "GeopoliticsPost" ADD COLUMN     "telegramId" TEXT;
CREATE UNIQUE INDEX "GeopoliticsPost_telegramId_key" ON "GeopoliticsPost"("telegramId");
