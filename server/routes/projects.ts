import { Router } from 'express';
import { asyncHandler, parse, z } from '../lib/http.js';
import { prisma, type Prisma } from '../lib/prisma.js';

/**
 * Directory of every development project registered with the Dubai Land Department,
 * with market figures per bedroom type from DLD sales (12 months) and Ejari rents (120 days).
 */
export const projectsRouter = Router();

const BED_BUCKETS: Record<string, string[]> = {
  '0': ['0'],
  '1': ['1'],
  '2': ['2'],
  '3': ['3'],
  '4': ['4'],
  villa: ['v3', 'v4', 'v5'],
};

const querySchema = z.object({
  q: z.string().trim().max(80).optional(),
  area: z.string().trim().max(120).optional(),
  developer: z.string().trim().max(160).optional(),
  phase: z.enum(['all', 'offplan', 'ready']).default('all'),
  beds: z.enum(['0', '1', '2', '3', '4', 'villa']).optional(),
  maxPrice: z.coerce.number().positive().optional(),
  completion: z.string().regex(/^\d{4}\+?$/).optional(), // "2027" or "2029+"
  sort: z.enum(['popular', 'completion', 'newest', 'price']).default('popular'),
  includeUnknown: z.enum(['true', 'false']).default('false'), // also show projects with no sales/rents recorded yet
  page: z.coerce.number().int().min(1).default(1),
});

type Stat = {
  saleCount: number;
  saleMedian: number | null;
  saleP25: number | null;
  saleP75: number | null;
  psfMedian: number | null;
  rentCount: number;
  rentMedian: number | null;
};

const round = (n: number | null) => (n === null ? null : Math.round(n / 1000) * 1000);

projectsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const f = parse(querySchema, req.query);
    const pageSize = 24;
    const now = new Date();

    const where: Prisma.DldProjectWhereInput = {
      phase: f.phase === 'offplan' ? 'OFFPLAN' : f.phase === 'ready' ? 'READY' : { not: 'CANCELLED' },
    };
    if (f.area) where.area = { equals: f.area, mode: 'insensitive' };
    if (f.developer) where.developer = { equals: f.developer, mode: 'insensitive' };
    if (f.q) {
      where.OR = [
        { name: { contains: f.q, mode: 'insensitive' } },
        { developer: { contains: f.q, mode: 'insensitive' } },
        { area: { contains: f.q, mode: 'insensitive' } },
      ];
    }
    if (f.completion) {
      const year = parseInt(f.completion, 10);
      where.completionDate = f.completion.endsWith('+')
        ? { gte: new Date(Date.UTC(year, 0, 1)) }
        : { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) };
    }

    // Bedroom / budget filters use real transactions: keep projects where that unit type has sold or rented.
    const buckets = f.beds ? BED_BUCKETS[f.beds] : null;
    let unknownCount = 0;
    if (buckets || f.maxPrice) {
      const statWhere: Prisma.ProjectStatWhereInput = {};
      if (buckets) statWhere.bucket = { in: buckets };
      if (f.maxPrice) statWhere.saleMedian = { lte: f.maxPrice };
      const [keys, allKeys] = await Promise.all([
        prisma.projectStat.findMany({ where: statWhere, select: { projectKey: true }, distinct: ['projectKey'] }),
        prisma.projectStat.findMany({ select: { projectKey: true }, distinct: ['projectKey'] }),
      ]);
      const noData: Prisma.DldProjectWhereInput = { nameKey: { notIn: allKeys.map((k) => k.projectKey) } };
      // Projects with no recorded sales or rents (typically brand-new launches): bedroom mix unknown
      unknownCount = await prisma.dldProject.count({ where: { AND: [where, noData] } });
      const matched: Prisma.DldProjectWhereInput = { nameKey: { in: keys.map((k) => k.projectKey) } };
      if (f.includeUnknown === 'true') where.AND = [{ OR: [matched, noData] }];
      else where.AND = [matched];
    }

    const candidates = await prisma.dldProject.findMany({
      where,
      select: { id: true, nameKey: true, units: true, completionDate: true, startDate: true, firstSeenAt: true },
    });

    const stats = await prisma.projectStat.findMany({
      where: { projectKey: { in: [...new Set(candidates.map((c) => c.nameKey))] } },
    });
    const byKey = new Map<string, Record<string, Stat>>();
    for (const s of stats) {
      const m = byKey.get(s.projectKey) ?? {};
      m[s.bucket] = {
        saleCount: s.saleCount,
        saleMedian: round(s.saleMedian),
        saleP25: round(s.saleP25),
        saleP75: round(s.saleP75),
        psfMedian: s.psfMedian === null ? null : Math.round(s.psfMedian),
        rentCount: s.rentCount,
        rentMedian: round(s.rentMedian),
      };
      byKey.set(s.projectKey, m);
    }

    const activity = (key: string) => Object.values(byKey.get(key) ?? {}).reduce((n, s) => n + s.saleCount + s.rentCount, 0);
    const priceFor = (key: string) => {
      const m = byKey.get(key) ?? {};
      const prices = Object.entries(m)
        .filter(([b]) => !buckets || buckets.includes(b))
        .map(([, s]) => s.saleMedian)
        .filter((p): p is number => p !== null);
      return prices.length ? Math.min(...prices) : null;
    };
    const time = (d: Date | null) => (d ? d.getTime() : null);

    candidates.sort((a, b) => {
      switch (f.sort) {
        case 'completion': {
          // soonest upcoming completion first; past or unknown dates last
          const ta = time(a.completionDate);
          const tb = time(b.completionDate);
          const fa = ta !== null && ta >= now.getTime() ? ta : Infinity;
          const fb = tb !== null && tb >= now.getTime() ? tb : Infinity;
          return fa - fb;
        }
        case 'newest':
          return (time(b.startDate) ?? time(b.firstSeenAt) ?? 0) - (time(a.startDate) ?? time(a.firstSeenAt) ?? 0);
        case 'price': {
          const pa = priceFor(a.nameKey) ?? Infinity;
          const pb = priceFor(b.nameKey) ?? Infinity;
          return pa - pb;
        }
        default:
          return activity(b.nameKey) - activity(a.nameKey) || (b.units ?? 0) - (a.units ?? 0);
      }
    });

    const total = candidates.length;
    const pageIds = candidates.slice((f.page - 1) * pageSize, f.page * pageSize).map((c) => c.id);
    const rows = await prisma.dldProject.findMany({
      where: { id: { in: pageIds } },
      select: {
        id: true,
        name: true,
        nameKey: true,
        developer: true,
        area: true,
        phase: true,
        status: true,
        completionDate: true,
        percentComplete: true,
        units: true,
      },
    });
    const order = new Map(pageIds.map((id, i) => [id, i]));
    rows.sort((a, b) => order.get(a.id)! - order.get(b.id)!);

    res.set('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=86400');
    res.json({
      total,
      unknownCount,
      page: f.page,
      pages: Math.max(1, Math.ceil(total / pageSize)),
      projects: rows.map(({ nameKey, ...p }) => ({ ...p, market: byKey.get(nameKey) ?? {} })),
    });
  }),
);

projectsRouter.get(
  '/facets',
  asyncHandler(async (_req, res) => {
    const live = { phase: { not: 'CANCELLED' } };
    const [areas, developers, phases, total] = await Promise.all([
      prisma.dldProject.groupBy({ by: ['area'], where: { ...live, area: { not: null } }, _count: { _all: true } }),
      prisma.dldProject.groupBy({ by: ['developer'], where: { ...live, developer: { not: null } }, _count: { _all: true } }),
      prisma.dldProject.groupBy({ by: ['phase'], where: live, _count: { _all: true } }),
      prisma.dldProject.count({ where: live }),
    ]);
    res.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.json({
      total,
      phases: Object.fromEntries(phases.map((p) => [p.phase, p._count._all])),
      areas: areas.map((a) => ({ name: a.area!, count: a._count._all })).sort((a, b) => a.name.localeCompare(b.name)),
      developers: developers.map((d) => ({ name: d.developer!, count: d._count._all })).sort((a, b) => a.name.localeCompare(b.name)),
    });
  }),
);

/** Every developer with projects on the DLD register. */
export const registeredDevelopersRouter = Router();

registeredDevelopersRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.dldProject.groupBy({
      by: ['developer', 'phase'],
      where: { developer: { not: null }, phase: { not: 'CANCELLED' } },
      _count: { _all: true },
      _sum: { units: true },
    });
    const map = new Map<string, { name: string; projects: number; offplan: number; ready: number; units: number }>();
    for (const r of rows) {
      const d = map.get(r.developer!) ?? { name: r.developer!, projects: 0, offplan: 0, ready: 0, units: 0 };
      d.projects += r._count._all;
      if (r.phase === 'OFFPLAN') d.offplan += r._count._all;
      if (r.phase === 'READY') d.ready += r._count._all;
      d.units += r._sum.units ?? 0;
      map.set(r.developer!, d);
    }
    res.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.json({ developers: [...map.values()].sort((a, b) => b.projects - a.projects || a.name.localeCompare(b.name)) });
  }),
);
