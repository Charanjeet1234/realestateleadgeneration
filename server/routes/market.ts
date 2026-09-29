import { Router } from 'express';
import { requireAdmin } from '../lib/auth.js';
import { runDldStep, runDldSync, testDldConnection } from '../lib/dld.js';
import { asyncHandler, HttpError, parse, z } from '../lib/http.js';
import { prisma, type Prisma } from '../lib/prisma.js';

/** Vercel Cron calls this nightly with `Authorization: Bearer $CRON_SECRET`. */
export const cronRouter = Router();

cronRouter.get(
  '/dld-sync',
  asyncHandler(async (req, res) => {
    const secret = process.env.CRON_SECRET;
    if (!secret) throw new HttpError(503, 'CRON_SECRET is not configured.');
    if (req.get('authorization') !== `Bearer ${secret}`) throw new HttpError(401, 'Unauthorized');
    // 60s function limit: ~38s of fetching leaves room for recalculation and pruning
    const result = await runDldSync({ budgetMs: 38_000 });
    res.json(result);
  }),
);

/** Admin → Market data */
export const marketRouter = Router();
marketRouter.use(requireAdmin);

marketRouter.get(
  '/status',
  asyncHandler(async (_req, res) => {
    const [states, counts, rentRange, saleRange] = await Promise.all([
      prisma.syncState.findMany({ where: { id: { in: ['rents', 'sales', 'projects', 'benchmarks'] } } }),
      prisma.dldProject.groupBy({ by: ['review'], _count: { _all: true } }),
      prisma.dldRent.aggregate({ _min: { registeredOn: true }, _max: { registeredOn: true }, _count: { _all: true } }),
      prisma.dldSale.aggregate({ _min: { soldOn: true }, _max: { soldOn: true }, _count: { _all: true } }),
    ]);
    res.json({
      configured: { cronSecret: Boolean(process.env.CRON_SECRET) },
      states: Object.fromEntries(states.map((s) => [s.id, s])),
      projects: Object.fromEntries(counts.map((c) => [c.review, c._count._all])),
      rents: { count: rentRange._count._all, from: rentRange._min.registeredOn, to: rentRange._max.registeredOn },
      sales: { count: saleRange._count._all, from: saleRange._min.soldOn, to: saleRange._max.soldOn },
    });
  }),
);

marketRouter.get(
  '/test',
  asyncHandler(async (_req, res) => {
    res.json(await testDldConnection());
  }),
);

// Admin "Run sync now" calls one short step at a time (projects → rents → sales → stats).
marketRouter.post(
  '/sync',
  asyncHandler(async (req, res) => {
    const { step } = parse(z.object({ step: z.enum(['projects', 'rents', 'sales', 'stats']).optional() }), req.body ?? {});
    res.json(step ? await runDldStep(step, 20_000) : await runDldSync({ budgetMs: 38_000 }));
  }),
);

const projectQuery = z.object({
  review: z.enum(['NEW', 'LISTED', 'IGNORED']).default('NEW'),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
});

marketRouter.get(
  '/projects',
  asyncHandler(async (req, res) => {
    const { review, q, page } = parse(projectQuery, req.query);
    const where: Prisma.DldProjectWhereInput = {
      review,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { developer: { contains: q, mode: 'insensitive' } },
              { area: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const pageSize = 25;
    const [projects, total] = await Promise.all([
      prisma.dldProject.findMany({
        where,
        orderBy: [{ firstSeenAt: 'desc' }, { completionDate: { sort: 'asc', nulls: 'last' } }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        omit: { raw: true },
        include: { property: { select: { id: true, title: true, published: true } } },
      }),
      prisma.dldProject.count({ where }),
    ]);
    res.json({ projects, total, page, pages: Math.max(1, Math.ceil(total / pageSize)) });
  }),
);

marketRouter.patch(
  '/projects/:id',
  asyncHandler(async (req, res) => {
    const { review } = parse(z.object({ review: z.enum(['NEW', 'IGNORED']) }), req.body);
    const project = await prisma.dldProject.update({ where: { id: req.params.id }, data: { review }, omit: { raw: true } });
    res.json({ project });
  }),
);

const titleCase = (s: string) =>
  s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase()).replace(/\b(Ii|Iii|Iv|Vi|Llc|Fzco|Fze)\b/g, (m) => m.toUpperCase());

function quarterOf(d: Date | null) {
  if (!d) return null;
  return `Q${Math.floor(d.getUTCMonth() / 3) + 1} ${d.getUTCFullYear()}`;
}

/** Turn a DLD project into an unpublished draft listing for the admin to complete. */
marketRouter.post(
  '/projects/:id/create-listing',
  asyncHandler(async (req, res) => {
    const project = await prisma.dldProject.findUniqueOrThrow({ where: { id: req.params.id } });
    if (project.propertyId) throw new HttpError(409, 'A listing was already created for this project.');

    const name = titleCase(project.name);
    const developer = project.developer ? titleCase(project.developer) : 'Developer to confirm';
    const handover = quarterOf(project.completionDate);
    const property = await prisma.property.create({
      data: {
        title: name,
        tagline: `New ${developer} project${project.area ? ` in ${titleCase(project.area)}` : ''}`,
        developer,
        developerTier: 'Prime Master',
        emirate: 'Dubai',
        community: project.area ? titleCase(project.area) : 'Dubai',
        category: 'Off-Plan',
        unitTypes: ['1BR', '2BR'],
        priceAED: 0, // must be set before publishing — the listing editor requires a price
        priceUSD: 0,
        priceRangeFormatted: 'Price on request',
        handoverDate: handover,
        projectedROI: 0,
        capitalGrowthForecast: 'To be confirmed',
        imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
        dldCosts: { registrationFeeAED: 0, adminFeeAED: 0, agencyFeeAED: 0, oqoodOrDeedAED: 0 },
        highlights: [
          ...(project.units ? [`${project.units.toLocaleString('en-US')} units registered with DLD`] : []),
          ...(handover ? [`Expected completion ${handover}`] : []),
        ],
        published: false,
      },
    });
    await prisma.dldProject.update({ where: { id: project.id }, data: { review: 'LISTED', propertyId: property.id } });
    res.status(201).json({ property: { id: property.id, title: property.title } });
  }),
);
