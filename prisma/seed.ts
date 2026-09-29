/**
 * Seeds starter data and the first admin account.
 *
 * Runs automatically on every Vercel build (see "vercel-build"), so it is
 * deliberately non-destructive:
 *  - listings / developers / benchmarks are inserted only when that table is EMPTY,
 *    so edits and deletions made in the admin panel are never overwritten;
 *  - the admin account (ADMIN_EMAIL / ADMIN_PASSWORD) is created only if no user
 *    with that email exists — changing the password later is safe.
 *
 *   npm run db:seed
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../server/lib/prisma.js';
import {
  PROPERTIES_DATABASE,
  DEVELOPERS_DATABASE,
  LIVE_RENTAL_BENCHMARKS,
} from '../src/data/marketData.js';

async function main() {
  if ((await prisma.property.count()) === 0) {
    await prisma.property.createMany({
      data: PROPERTIES_DATABASE.map((p, i) => ({
        id: p.id, // keep original ids (prop-1 …)
        title: p.title,
        tagline: p.tagline,
        developer: p.developer,
        developerTier: p.developerTier,
        emirate: p.emirate,
        community: p.community,
        category: p.category,
        unitTypes: [...p.unitTypes],
        priceAED: p.priceAED,
        priceUSD: p.priceUSD,
        priceRangeFormatted: p.priceRangeFormatted,
        rentalBenchmarkAED: p.rentalBenchmarkAED ?? null,
        handoverDate: p.handoverDate ?? null,
        paymentPlan: p.paymentPlan ?? undefined,
        rentalFactors: p.rentalFactors ?? undefined,
        projectedROI: p.projectedROI,
        capitalGrowthForecast: p.capitalGrowthForecast,
        goldenVisaEligible: p.goldenVisaEligible,
        imageUrl: p.imageUrl,
        featured: p.featured,
        dldCosts: p.dldCosts,
        highlights: p.highlights,
        floorPlanCount: p.floorPlanCount,
        sortOrder: i,
      })),
    });
    console.log(`Seeded ${PROPERTIES_DATABASE.length} properties.`);
  }

  if ((await prisma.developer.count()) === 0) {
    await prisma.developer.createMany({
      data: DEVELOPERS_DATABASE.map((d, i) => ({ ...d, signatureMasterpieces: [...d.signatureMasterpieces], sortOrder: i })),
    });
    console.log(`Seeded ${DEVELOPERS_DATABASE.length} developers.`);
  }

  if ((await prisma.rentBenchmark.count()) === 0) {
    await prisma.rentBenchmark.createMany({
      data: LIVE_RENTAL_BENCHMARKS.map((b, i) => ({ ...b, villaRentAED: b.villaRentAED ?? null, sortOrder: i })),
    });
    console.log(`Seeded ${LIVE_RENTAL_BENCHMARKS.length} rent benchmarks.`);
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!existing) {
      await prisma.user.create({
        data: {
          email: adminEmail,
          name: process.env.ADMIN_NAME || 'Agency Admin',
          role: 'ADMIN',
          passwordHash: await bcrypt.hash(adminPassword, 12),
        },
      });
      console.log(`Created admin account ${adminEmail}`);
    }
  } else if ((await prisma.user.count()) === 0) {
    console.warn('No users yet and ADMIN_EMAIL / ADMIN_PASSWORD not set — nobody can sign in to the CRM.');
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
