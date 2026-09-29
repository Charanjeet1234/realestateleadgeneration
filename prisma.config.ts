import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Migrations need a direct (non-pooled) connection. On Neon/Supabase set
    // DIRECT_URL (or Vercel-Neon's DATABASE_URL_UNPOOLED) to the direct string.
    // Not required for `prisma generate` (runs on npm install), so don't throw when unset.
    url: process.env.DIRECT_URL || process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || '',
  },
});
