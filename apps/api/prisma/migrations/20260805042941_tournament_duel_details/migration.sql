-- AlterEnum
ALTER TYPE "TournamentMatchStatus" ADD VALUE 'LIVE';

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "format" TEXT NOT NULL DEFAULT 'single_elimination_16',
ADD COLUMN     "rules" JSONB;

-- AlterTable
ALTER TABLE "TournamentMatch" ADD COLUMN     "endTime" TIMESTAMP(3),
ADD COLUMN     "startTime" TIMESTAMP(3),
ADD COLUMN     "streamUrl" TEXT;
