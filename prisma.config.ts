import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Migrations need a direct (non-pooled) connection. On Neon/Supabase set
    // DIRECT_URL (or Vercel-Neon's DATABASE_URL_UNPOOLED) to the direct string.
    url: process.env.DIRECT_URL || process.env.DATABASE_URL_UNPOOLED || env('DATABASE_URL'),
  },
});
