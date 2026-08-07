-- AlterTable
ALTER TABLE "GeopoliticsPost" ADD COLUMN     "bodyEn" TEXT,
ADD COLUMN     "impactEn" TEXT,
ADD COLUMN     "impactKey" TEXT NOT NULL DEFAULT 'medium',
ADD COLUMN     "regionEn" TEXT,
ADD COLUMN     "tagsEn" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "titleEn" TEXT;
