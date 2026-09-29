import { Router } from 'express';
import { asyncHandler, HttpError, parse, z } from '../lib/http.js';
import { prisma } from '../lib/prisma.js';

/**
 * Public rent prices from DLD Ejari contracts (last 120 days), precomputed in RentStat.
 * Prices are annual rents in AED. Buckets: "0" studio, "1"–"3", "4" (4+) apartments;
 * "v3", "v4", "v5" villas/townhouses (≤3, 4, 5+ bedrooms).
 */
export const rentPricesRouter = Router();

type Bucket = { n: number; median: number; p25: number; p75: number; sqm: number | null };
type Row = {
  key: string;
  name: string;
  areaKey: string;
  areaName: string | null;
  masterName: string | null;
  bucket: string;
  contracts: number;
  p25: number;
  median: number;
  p75: number;
  medianSqm: number | null;
  updatedAt: Date;
};

const round = (n: number) => Math.round(n / 500) * 500;

function group(rows: Row[], by: (r: Row) => string) {
  const map = new Map<
    string,
    { key: string; name: string; areaKey: string; areaName: string | null; masterName: string | null; contracts: number; buckets: Record<string, Bucket> }
  >();
  for (const r of rows) {
    const id = by(r);
    let g = map.get(id);
    if (!g) {
      g = { key: r.key, name: r.name, areaKey: r.areaKey, areaName: r.areaName, masterName: r.masterName, contracts: 0, buckets: {} };
      map.set(id, g);
    }
    g.contracts += r.contracts;
    g.buckets[r.bucket] = {
      n: r.contracts,
      median: round(r.median),
      p25: round(r.p25),
      p75: round(r.p75),
      sqm: r.medianSqm ? Math.round(r.medianSqm) : null,
    };
  }
  return [...map.values()].sort((a, b) => b.contracts - a.contracts);
}

const cache = (res: import('express').Response) => res.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

rentPricesRouter.get(
  '/areas',
  asyncHandler(async (_req, res) => {
    const [rows, buildingCounts, meta] = await Promise.all([
      prisma.rentStat.findMany({ where: { level: 'area' } }),
      prisma.rentStat.groupBy({ by: ['areaKey', 'key'], where: { level: 'building' } }),
      prisma.syncState.findUnique({ where: { id: 'rents' }, select: { cursorDate: true } }),
    ]);
    const perArea = new Map<string, number>();
    for (const b of buildingCounts) perArea.set(b.areaKey, (perArea.get(b.areaKey) ?? 0) + 1);
    const areas = group(rows as Row[], (r) => r.areaKey).map((a) => ({ ...a, buildings: perArea.get(a.areaKey) ?? 0 }));
    cache(res);
    res.json({
      areas,
      windowDays: 120,
      updatedAt: rows[0]?.updatedAt ?? null,
      latestContractDate: meta?.cursorDate ?? null,
    });
  }),
);

rentPricesRouter.get(
  '/areas/:areaKey',
  asyncHandler(async (req, res) => {
    const areaKey = String(req.params.areaKey).slice(0, 120);
    const [areaRows, buildingRows] = await Promise.all([
      prisma.rentStat.findMany({ where: { level: 'area', areaKey } }),
      prisma.rentStat.findMany({ where: { level: 'building', areaKey } }),
    ]);
    if (!areaRows.length && !buildingRows.length) throw new HttpError(404, 'No rent data for this area yet.');
    cache(res);
    res.json({
      area: group(areaRows as Row[], (r) => r.areaKey)[0] ?? null,
      buildings: group(buildingRows as Row[], (r) => r.key),
    });
  }),
);

rentPricesRouter.get(
  '/search',
  asyncHandler(async (req, res) => {
    const { q } = parse(z.object({ q: z.string().trim().min(2).max(80) }), req.query);
    const rows = await prisma.rentStat.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { areaName: { contains: q, mode: 'insensitive' } },
          { masterName: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 600,
    });
    const areas = group(rows.filter((r) => r.level === 'area') as Row[], (r) => r.areaKey).slice(0, 8);
    const buildings = group(rows.filter((r) => r.level === 'building') as Row[], (r) => `${r.areaKey}|${r.key}`).slice(0, 30);
    cache(res);
    res.json({ areas, buildings });
  }),
);
