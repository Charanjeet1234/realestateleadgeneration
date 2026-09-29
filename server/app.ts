import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { loadUser } from './lib/auth.js';
import { config } from './lib/config.js';
import { errorHandler } from './lib/http.js';
import { prisma } from './lib/prisma.js';
import { adminRouter } from './routes/admin.js';
import { authRouter } from './routes/auth.js';
import { crmRouter } from './routes/crm.js';
import { publicRouter } from './routes/public.js';

export function createApp() {
  const app = express();

  // Vercel / reverse proxies: trust X-Forwarded-For so req.ip is the client
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use('/api', helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'same-origin' } }));
  app.use('/api', express.json({ limit: '100kb' }));
  app.use('/api', cookieParser());

  // CSRF defence for cookie-authenticated writes: the session cookie is SameSite=Strict,
  // and we additionally reject cross-site browser requests to mutating endpoints.
  app.use('/api', (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const site = req.get('sec-fetch-site');
    if (site && site !== 'same-origin' && site !== 'none') {
      return res.status(403).json({ error: 'Cross-site request blocked' });
    }
    next();
  });

  app.use('/api', loadUser);

  app.get('/api/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ ok: true, db: 'up', ai: Boolean(config.gemini.apiKey) });
    } catch {
      res.status(503).json({ ok: false, db: 'down' });
    }
  });

  app.use('/api/auth', authRouter);
  app.use('/api/admin', adminRouter);
  // Public router first: it owns POST /api/leads (capture). Everything it doesn't
  // match (GET /api/leads, /api/stats …) falls through to the broker-only CRM router.
  app.use('/api', publicRouter);
  app.use('/api', crmRouter);

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));
  app.use('/api', errorHandler);

  return app;
}

export default createApp();
