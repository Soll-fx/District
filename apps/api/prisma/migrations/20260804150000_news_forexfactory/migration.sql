ALTER TABLE "NewsItem" ADD COLUMN "source" TEXT;
ALTER TABLE "NewsItem" ADD COLUMN "extId" TEXT;
CREATE UNIQUE INDEX "NewsItem_extId_key" ON "NewsItem"("extId");
