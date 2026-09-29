/**
 * Run the DLD market-data sync from your computer, without Vercel's 60-second limit.
 * Useful for loading the full history in one go:
 *
 *   DATABASE_URL="<your Neon connection string>" npm run dld:sync
 */
import 'dotenv/config';
import { runDldSync } from '../server/lib/dld.js';
import { prisma } from '../server/lib/prisma.js';

const minutes = Number(process.argv[2] || 10);

runDldSync({ budgetMs: minutes * 60_000 })
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
