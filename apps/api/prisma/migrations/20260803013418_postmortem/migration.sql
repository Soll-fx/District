-- CreateTable
CREATE TABLE "PostMortem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tradeId" TEXT,
    "asset" TEXT NOT NULL,
    "direction" "Direction" NOT NULL,
    "pnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rMultiplier" DOUBLE PRECISION,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostMortem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostMortem_userId_idx" ON "PostMortem"("userId");

-- CreateIndex
CREATE INDEX "PostMortem_tradeId_idx" ON "PostMortem"("tradeId");

-- AddForeignKey
ALTER TABLE "PostMortem" ADD CONSTRAINT "PostMortem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostMortem" ADD CONSTRAINT "PostMortem_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE SET NULL ON UPDATE CASCADE;
