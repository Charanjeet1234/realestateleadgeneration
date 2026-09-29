-- AlterTable
ALTER TABLE "DldRent" ADD COLUMN     "areaName" TEXT,
ADD COLUMN     "masterName" TEXT,
ADD COLUMN     "projectKey" TEXT,
ADD COLUMN     "projectName" TEXT;

-- Existing rows have no building names: clear them and restart the rent sync so it
-- reloads the full history with building-level detail.
DELETE FROM "DldRent";
DELETE FROM "SyncState" WHERE "id" = 'rents';

-- CreateTable
CREATE TABLE "RentStat" (
    "id" SERIAL NOT NULL,
    "level" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "areaKey" TEXT NOT NULL,
    "areaName" TEXT,
    "masterName" TEXT,
    "bucket" TEXT NOT NULL,
    "contracts" INTEGER NOT NULL,
    "p25" DOUBLE PRECISION NOT NULL,
    "median" DOUBLE PRECISION NOT NULL,
    "p75" DOUBLE PRECISION NOT NULL,
    "medianSqm" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RentStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RentStat_level_areaKey_idx" ON "RentStat"("level", "areaKey");

-- CreateIndex
CREATE UNIQUE INDEX "RentStat_level_areaKey_key_bucket_key" ON "RentStat"("level", "areaKey", "key", "bucket");
