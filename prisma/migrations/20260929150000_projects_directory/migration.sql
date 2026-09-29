-- AlterTable
ALTER TABLE "DldSale" ADD COLUMN     "projectKey" TEXT;

-- Backfill: same normalisation as areaKey() in server/lib/dldAreas.ts
UPDATE "DldSale" SET "projectKey" = NULLIF(trim(regexp_replace(lower("project"), '[^a-z0-9]+', ' ', 'g')), '') WHERE "project" IS NOT NULL;

-- AlterTable
ALTER TABLE "DldProject" ADD COLUMN     "nameKey" TEXT;
UPDATE "DldProject" SET "nameKey" = trim(regexp_replace(lower("name"), '[^a-z0-9]+', ' ', 'g'));
ALTER TABLE "DldProject" ALTER COLUMN "nameKey" SET NOT NULL;
ALTER TABLE "DldProject" ADD COLUMN     "phase" TEXT NOT NULL DEFAULT 'OFFPLAN';

-- Reload the full project register (the first version only looked back two years)
UPDATE "SyncState" SET "info" = NULL WHERE "id" = 'projects';

-- CreateTable
CREATE TABLE "ProjectStat" (
    "id" SERIAL NOT NULL,
    "projectKey" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "saleCount" INTEGER NOT NULL DEFAULT 0,
    "saleP25" DOUBLE PRECISION,
    "saleMedian" DOUBLE PRECISION,
    "saleP75" DOUBLE PRECISION,
    "psfMedian" DOUBLE PRECISION,
    "rentCount" INTEGER NOT NULL DEFAULT 0,
    "rentMedian" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DldSale_projectKey_soldOn_idx" ON "DldSale"("projectKey", "soldOn");

-- CreateIndex
CREATE INDEX "DldProject_nameKey_idx" ON "DldProject"("nameKey");

-- CreateIndex
CREATE INDEX "DldProject_phase_idx" ON "DldProject"("phase");

-- CreateIndex
CREATE INDEX "DldProject_developer_idx" ON "DldProject"("developer");

-- CreateIndex
CREATE INDEX "DldProject_area_idx" ON "DldProject"("area");

-- CreateIndex
CREATE INDEX "ProjectStat_bucket_saleMedian_idx" ON "ProjectStat"("bucket", "saleMedian");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectStat_projectKey_bucket_key" ON "ProjectStat"("projectKey", "bucket");
