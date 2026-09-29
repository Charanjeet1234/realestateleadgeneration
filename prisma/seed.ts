/**
 * Seeds listings, developers and rent benchmarks from src/data/marketData.ts,
 * and creates the first admin account from ADMIN_EMAIL / ADMIN_PASSWORD.
 *
 * Safe to re-run: records are upserted, and existing admins are left alone.
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
  // Properties — keep the original ids (prop-1 …) so existing links keep working
  for (const [i, p] of PROPERTIES_DATABASE.entries()) {
    const data = {
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
    };
    await prisma.property.upsert({ where: { id: p.id }, create: { id: p.id, ...data }, update: data });
  }

  for (const [i, d] of DEVELOPERS_DATABASE.entries()) {
    const data = { ...d, signatureMasterpieces: [...d.signatureMasterpieces], sortOrder: i };
    await prisma.developer.upsert({ where: { name: d.name }, create: data, update: data });
  }

  for (const [i, b] of LIVE_RENTAL_BENCHMARKS.entries()) {
    const data = { ...b, villaRentAED: b.villaRentAED ?? null, sortOrder: i };
    await prisma.rentBenchmark.upsert({ where: { community: b.community }, create: data, update: data });
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
  } else {
    console.warn('ADMIN_EMAIL / ADMIN_PASSWORD not set — no admin account created.');
  }

  console.log(
    `Seeded ${PROPERTIES_DATABASE.length} properties, ${DEVELOPERS_DATABASE.length} developers, ${LIVE_RENTAL_BENCHMARKS.length} benchmarks.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
