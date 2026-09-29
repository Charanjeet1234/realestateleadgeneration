-- CreateEnum
CREATE TYPE "ProjectReview" AS ENUM ('NEW', 'LISTED', 'IGNORED');

-- AlterTable
ALTER TABLE "RentBenchmark" ADD COLUMN     "autoUpdate" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "dataUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "dldAliases" TEXT[],
ADD COLUMN     "rentSampleSize" INTEGER;

-- Existing rows: start with an empty list rather than NULL
UPDATE "RentBenchmark" SET "dldAliases" = ARRAY[]::TEXT[] WHERE "dldAliases" IS NULL;

-- CreateTable
CREATE TABLE "DldRent" (
    "id" SERIAL NOT NULL,
    "contractKey" TEXT NOT NULL,
    "registeredOn" DATE NOT NULL,
    "areaKey" TEXT NOT NULL,
    "masterKey" TEXT,
    "rooms" INTEGER,
    "isVilla" BOOLEAN NOT NULL DEFAULT false,
    "annualAmount" INTEGER NOT NULL,
    "sizeSqm" DOUBLE PRECISION,

    CONSTRAINT "DldRent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DldSale" (
    "id" SERIAL NOT NULL,
    "txnNumber" TEXT NOT NULL,
    "soldOn" DATE NOT NULL,
    "areaKey" TEXT NOT NULL,
    "masterKey" TEXT,
    "project" TEXT,
    "isOffplan" BOOLEAN NOT NULL DEFAULT false,
    "rooms" INTEGER,
    "isVilla" BOOLEAN NOT NULL DEFAULT false,
    "value" DOUBLE PRECISION NOT NULL,
    "sizeSqm" DOUBLE PRECISION,

    CONSTRAINT "DldSale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DldProject" (
    "id" TEXT NOT NULL,
    "dldKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "developer" TEXT,
    "area" TEXT,
    "status" TEXT,
    "startDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "percentComplete" DOUBLE PRECISION,
    "units" INTEGER,
    "raw" JSONB NOT NULL,
    "review" "ProjectReview" NOT NULL DEFAULT 'NEW',
    "propertyId" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DldProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncState" (
    "id" TEXT NOT NULL,
    "cursorDate" DATE,
    "lastRunAt" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "lastError" TEXT,
    "lastCount" INTEGER NOT NULL DEFAULT 0,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "info" JSONB,

    CONSTRAINT "SyncState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DldRent_contractKey_key" ON "DldRent"("contractKey");

-- CreateIndex
CREATE INDEX "DldRent_registeredOn_idx" ON "DldRent"("registeredOn");

-- CreateIndex
CREATE INDEX "DldRent_masterKey_registeredOn_idx" ON "DldRent"("masterKey", "registeredOn");

-- CreateIndex
CREATE INDEX "DldRent_areaKey_registeredOn_idx" ON "DldRent"("areaKey", "registeredOn");

-- CreateIndex
CREATE UNIQUE INDEX "DldSale_txnNumber_key" ON "DldSale"("txnNumber");

-- CreateIndex
CREATE INDEX "DldSale_soldOn_idx" ON "DldSale"("soldOn");

-- CreateIndex
CREATE INDEX "DldSale_masterKey_soldOn_idx" ON "DldSale"("masterKey", "soldOn");

-- CreateIndex
CREATE INDEX "DldSale_areaKey_soldOn_idx" ON "DldSale"("areaKey", "soldOn");

-- CreateIndex
CREATE UNIQUE INDEX "DldProject_dldKey_key" ON "DldProject"("dldKey");

-- CreateIndex
CREATE INDEX "DldProject_review_firstSeenAt_idx" ON "DldProject"("review", "firstSeenAt");

-- AddForeignKey
ALTER TABLE "DldProject" ADD CONSTRAINT "DldProject_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
