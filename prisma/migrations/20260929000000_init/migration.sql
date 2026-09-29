-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'AGENT');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('buy_offplan', 'buy_ready', 'rent_annual', 'rent_shortterm');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'VIEWING_SCHEDULED', 'NEGOTIATION', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('SYSTEM', 'NOTE', 'STATUS_CHANGE', 'ASSIGNMENT', 'CALL', 'WHATSAPP', 'EMAIL', 'REPEAT_INQUIRY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'AGENT',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastAssignedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "preferredLocation" TEXT,
    "budget" TEXT,
    "transactionType" "TransactionType" NOT NULL DEFAULT 'buy_offplan',
    "unitType" TEXT,
    "message" TEXT,
    "source" TEXT NOT NULL DEFAULT 'Website',
    "propertyTitle" TEXT,
    "propertyId" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "isVip" BOOLEAN NOT NULL DEFAULT false,
    "assignedToId" TEXT,
    "nextFollowUpAt" TIMESTAMP(3),
    "firstContactAt" TIMESTAMP(3),
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "referrer" TEXT,
    "landingPage" TEXT,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadActivity" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "userId" TEXT,
    "type" "ActivityType" NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "developer" TEXT NOT NULL,
    "developerTier" TEXT NOT NULL,
    "emirate" TEXT NOT NULL,
    "community" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unitTypes" TEXT[],
    "priceAED" INTEGER NOT NULL,
    "priceUSD" INTEGER NOT NULL,
    "priceRangeFormatted" TEXT NOT NULL,
    "rentalBenchmarkAED" TEXT,
    "handoverDate" TEXT,
    "paymentPlan" JSONB,
    "rentalFactors" JSONB,
    "projectedROI" DOUBLE PRECISION NOT NULL,
    "capitalGrowthForecast" TEXT NOT NULL,
    "goldenVisaEligible" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "dldCosts" JSONB NOT NULL,
    "highlights" TEXT[],
    "floorPlanCount" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Developer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emirate" TEXT NOT NULL,
    "establishedYear" INTEGER NOT NULL,
    "completedProjects" INTEGER NOT NULL,
    "activeProjects" INTEGER NOT NULL,
    "signatureMasterpieces" TEXT[],
    "reputationSummary" TEXT NOT NULL,
    "standardPaymentPlan" TEXT NOT NULL,
    "onTimeDeliveryRate" TEXT NOT NULL,
    "logoInitial" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Developer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentBenchmark" (
    "id" TEXT NOT NULL,
    "community" TEXT NOT NULL,
    "emirate" TEXT NOT NULL,
    "avgPriceSqftAED" INTEGER NOT NULL,
    "studioRentAED" TEXT NOT NULL,
    "oneBedRentAED" TEXT NOT NULL,
    "twoBedRentAED" TEXT NOT NULL,
    "threeBedRentAED" TEXT NOT NULL,
    "villaRentAED" TEXT,
    "avgYield" TEXT NOT NULL,
    "chequeNorm" TEXT NOT NULL,
    "serviceChargePerSqft" TEXT NOT NULL,
    "topDeveloper" TEXT NOT NULL,
    "growthYoY" TEXT NOT NULL,
    "rentalTrend" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentBenchmark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_assignedToId_idx" ON "Lead"("assignedToId");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- CreateIndex
CREATE INDEX "Lead_email_idx" ON "Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_phone_idx" ON "Lead"("phone");

-- CreateIndex
CREATE INDEX "Lead_ipHash_createdAt_idx" ON "Lead"("ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "LeadActivity_leadId_createdAt_idx" ON "LeadActivity"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "Property_published_emirate_category_idx" ON "Property"("published", "emirate", "category");

-- CreateIndex
CREATE UNIQUE INDEX "Developer_name_key" ON "Developer"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RentBenchmark_community_key" ON "RentBenchmark"("community");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
