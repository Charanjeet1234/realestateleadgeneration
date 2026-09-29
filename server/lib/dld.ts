/**
 * Dubai Land Department open-data sync.
 *
 * Pulls residential Ejari rent contracts, sale transactions and registered
 * development projects from DLD's public open-data gateway, stores the columns
 * we aggregate, and recalculates the rent-benchmark table from real contracts.
 *
 * Designed for serverless: every run has a time budget, processes whole days,
 * records progress in SyncState, and resumes where it stopped. Recent days are
 * fetched first so the figures are useful immediately; history backfills over
 * the following runs.
 */
import crypto from 'node:crypto';
import { areaKey } from './dldAreas.js';
import { prisma, type Prisma } from './prisma.js';

const BASE = (process.env.DLD_BASE_URL || 'https://gateway.dubailand.gov.ae/open-data').replace(/\/$/, '');
const PAGE_SIZE = 1000;
const DAY = 86_400_000;

const RENT_BACKFILL_DAYS = 120; // window used for rent ranges
const SALE_BACKFILL_DAYS = 456; // 12 months for price/sqft + the year-ago window for YoY growth
const RENT_KEEP_DAYS = 180;
const SALE_KEEP_DAYS = 460;
const MIN_SAMPLE = 8; // contracts needed before a rent range is shown

type Row = Record<string, unknown>;

// ───────────────────────── helpers ─────────────────────────

const utcDay = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);
const isoDay = (d: Date) => d.toISOString().slice(0, 10);
/** DLD expects MM/DD/YYYY */
const dldDate = (d: Date) =>
  `${String(d.getUTCMonth() + 1).padStart(2, '0')}/${String(d.getUTCDate()).padStart(2, '0')}/${d.getUTCFullYear()}`;

function pick(row: Row, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
  }
  return null;
}

function num(v: unknown): number | null {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

function parseRooms(v: string | null): number | null {
  if (!v) return null;
  const s = v.toLowerCase();
  if (s.includes('studio')) return 0;
  const m = s.match(/(\d+)/);
  return m ? Math.min(parseInt(m[1], 10), 4) : null;
}

/** Accepts ISO, /Date(ms)/, DD-MM-YYYY and MM/DD/YYYY (DD/MM when the first part > 12). */
export function parseDldDate(v: string | null): Date | null {
  if (!v) return null;
  const ms = v.match(/\/Date\((\d+)/);
  if (ms) return new Date(Number(ms[1]));
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const dash = v.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (dash) return new Date(Date.UTC(+dash[3], +dash[2] - 1, +dash[1]));
  const slash = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slash) {
    const [a, b, y] = [+slash[1], +slash[2], +slash[3]];
    return a > 12 ? new Date(Date.UTC(y, b - 1, a)) : new Date(Date.UTC(y, a - 1, b));
  }
  return null;
}

const hashRow = (row: Row) => crypto.createHash('sha1').update(JSON.stringify(row)).digest('hex');
const isVillaRow = (row: Row) => /villa|townhouse/i.test(pick(row, 'PROP_SUB_TYPE_EN', 'PROP_SB_TYPE_EN', 'PROP_TYPE_EN') ?? '');
const isResidential = (row: Row) => {
  const usage = pick(row, 'USAGE_EN');
  return !usage || /resid/i.test(usage);
};

function percentile(sorted: number[], p: number) {
  if (!sorted.length) return NaN;
  const i = (sorted.length - 1) * p;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}
const median = (xs: number[]) => percentile([...xs].sort((a, b) => a - b), 0.5);
const aed = (n: number) => `AED ${(Math.round(n / 1000) * 1000).toLocaleString('en-US')}`;

class OutOfTime extends Error {}

// ───────────────────────── DLD client ─────────────────────────

export async function dldPost(
  command: string,
  body: Record<string, string>,
  deadline = Date.now() + 60_000,
): Promise<{ rows: Row[]; total: number }> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    // Never let a request run past the run's deadline (Vercel kills the function at its limit)
    const remaining = Math.floor(deadline - Date.now() - 2_000);
    if (remaining < 3_000) throw lastError instanceof Error ? lastError : new OutOfTime();
    try {
      const res = await fetch(`${BASE}/${command}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; PropEngineUAE/1.0; +https://propengine.ae)',
          Referer: 'https://dubailand.gov.ae/en/open-data/real-estate-data/',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(Math.min(25_000, remaining)),
      });
      if (!res.ok) throw new Error(`DLD ${command} answered HTTP ${res.status}`);
      const json = (await res.json()) as { response?: { result?: unknown; total?: unknown }; result?: unknown };
      const result = json?.response?.result ?? json?.result;
      if (!Array.isArray(result)) {
        throw new Error(`DLD ${command} returned an unexpected shape (keys: ${Object.keys(json ?? {}).join(', ') || 'none'})`);
      }
      const rows = result as Row[];
      const total = num(rows[0]?.TOTAL) ?? num(json?.response?.total) ?? rows.length;
      return { rows, total };
    } catch (err) {
      lastError = err;
      if (attempt < 3 && deadline - Date.now() > 8_000) await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function fetchAll(command: string, body: Record<string, string>, deadline: number): Promise<Row[]> {
  const all: Row[] = [];
  for (let skip = 0; ; skip += PAGE_SIZE) {
    if (Date.now() > deadline) throw new OutOfTime();
    const { rows, total } = await dldPost(command, { ...body, P_TAKE: String(PAGE_SIZE), P_SKIP: String(skip), P_SORT: '' }, deadline);
    all.push(...rows);
    if (rows.length < PAGE_SIZE || all.length >= total) break;
  }
  return all;
}

// ───────────────────────── mapping ─────────────────────────

function mapRent(row: Row, day: Date): Prisma.DldRentCreateManyInput | null {
  if (!isResidential(row)) return null;
  const annual = num(row.ANNUAL_AMOUNT) ?? num(row.CONTRACT_AMOUNT);
  if (!annual || annual < 5_000 || annual > 20_000_000) return null;
  const contract = pick(row, 'CONTRACT_NUMBER', 'CONTRACT_NO');
  const version = pick(row, 'VERSION_NUMBER', 'VERSION_EN') ?? '';
  const area = areaKey(pick(row, 'AREA_EN', 'AREA_NAME_EN'));
  if (!area) return null;
  return {
    contractKey: contract ? `${contract}-${version}` : hashRow(row),
    registeredOn: day, // we query one registration day at a time, so no date parsing needed
    areaKey: area,
    masterKey: areaKey(pick(row, 'MASTER_PROJECT_EN')) || null,
    rooms: parseRooms(pick(row, 'ROOMS', 'ROOMS_EN')),
    isVilla: isVillaRow(row),
    annualAmount: Math.round(annual),
    sizeSqm: num(row.ACTUAL_AREA),
  };
}

function mapSale(row: Row, day: Date): Prisma.DldSaleCreateManyInput | null {
  if (!isResidential(row)) return null;
  const procedure = pick(row, 'PROCEDURE_EN') ?? '';
  if (procedure && !/sell|sale/i.test(procedure)) return null; // skip mortgages, gifts, etc.
  const value = num(row.TRANS_VALUE);
  if (!value || value < 100_000) return null;
  const area = areaKey(pick(row, 'AREA_EN', 'AREA_NAME_EN'));
  if (!area) return null;
  const offplan = pick(row, 'IS_OFFPLAN', 'IS_OFFPLAN_EN') ?? '';
  return {
    txnNumber: pick(row, 'TRANSACTION_NUMBER', 'TRANSACTION_ID') ?? hashRow(row),
    soldOn: day,
    areaKey: area,
    masterKey: areaKey(pick(row, 'MASTER_PROJECT_EN')) || null,
    project: pick(row, 'PROJECT_EN'),
    isOffplan: /off|^1$|^true$/i.test(offplan) || /pre.?reg/i.test(procedure),
    rooms: parseRooms(pick(row, 'ROOMS_EN', 'ROOMS')),
    isVilla: isVillaRow(row),
    value,
    sizeSqm: num(row.ACTUAL_AREA) ?? num(row.PROCEDURE_AREA),
  };
}

// ───────────────────────── sync state ─────────────────────────

async function getState(id: string) {
  return prisma.syncState.upsert({ where: { id }, create: { id }, update: {} });
}

interface DailyJob {
  id: 'rents' | 'sales';
  command: string;
  backfillDays: number;
  body: (day: Date) => Record<string, string>;
  save: (rows: Row[], day: Date) => Promise<number>;
}

const JOBS: DailyJob[] = [
  {
    id: 'rents',
    command: 'rents',
    backfillDays: RENT_BACKFILL_DAYS,
    body: (d) => ({
      P_FROM_DATE: dldDate(d),
      P_TO_DATE: dldDate(d),
      P_DATE_TYPE: '1',
      P_IS_FREE_HOLD: '',
      P_VERSION: '',
      P_AREA_ID: '',
      P_USAGE_ID: '',
      P_PROP_TYPE_ID: '',
    }),
    save: async (rows, day) => {
      const data = rows.map((r) => mapRent(r, day)).filter((x): x is Prisma.DldRentCreateManyInput => x !== null);
      let n = 0;
      for (let i = 0; i < data.length; i += 1000) {
        n += (await prisma.dldRent.createMany({ data: data.slice(i, i + 1000), skipDuplicates: true })).count;
      }
      return n;
    },
  },
  {
    id: 'sales',
    command: 'transactions',
    backfillDays: SALE_BACKFILL_DAYS,
    body: (d) => ({
      P_FROM_DATE: dldDate(d),
      P_TO_DATE: dldDate(d),
      P_GROUP_ID: '1',
      P_IS_OFFPLAN: '',
      P_IS_FREE_HOLD: '',
      P_AREA_ID: '',
      P_USAGE_ID: '',
      P_PROP_TYPE_ID: '',
    }),
    save: async (rows, day) => {
      const data = rows.map((r) => mapSale(r, day)).filter((x): x is Prisma.DldSaleCreateManyInput => x !== null);
      let n = 0;
      for (let i = 0; i < data.length; i += 1000) {
        n += (await prisma.dldSale.createMany({ data: data.slice(i, i + 1000), skipDuplicates: true })).count;
      }
      return n;
    },
  },
];

/**
 * 1. Catch up forward from the newest day done to yesterday (re-checking the last day,
 *    since DLD can publish late).
 * 2. Then backfill backwards until the history window is complete.
 */
async function runDailyJob(job: DailyJob, deadline: number) {
  const state = await getState(job.id);
  const info = (state.info ?? {}) as { oldestDone?: string; sampleKeys?: string[] };
  const yesterday = utcDay(addDays(new Date(), -1));
  const target = addDays(yesterday, -(job.backfillDays - 1));

  const queue: Date[] = [];
  if (state.cursorDate) {
    for (let d = addDays(utcDay(state.cursorDate), -1); d <= yesterday; d = addDays(d, 1)) queue.push(d);
  } else {
    queue.push(yesterday);
  }

  let inserted = 0;
  let newest = state.cursorDate ? utcDay(state.cursorDate) : null;
  let oldest = info.oldestDone ? new Date(info.oldestDone) : null;
  let sampleKeys = info.sampleKeys;
  let error: string | null = null;

  const doDay = async (day: Date) => {
    const rows = await fetchAll(job.command, job.body(day), deadline);
    if (rows[0]) sampleKeys = Object.keys(rows[0]).slice(0, 40);
    inserted += await job.save(rows, day);
    if (!newest || day > newest) newest = day;
    if (!oldest || day < oldest) oldest = day;
    // Save progress after every day so an interrupted run never loses work
    await prisma.syncState.update({
      where: { id: job.id },
      data: {
        cursorDate: newest,
        info: { ...info, oldestDone: isoDay(oldest), historyDays: job.backfillDays, sampleKeys },
      },
    });
  };

  try {
    for (const day of queue) {
      if (Date.now() > deadline) throw new OutOfTime();
      await doDay(day);
    }
    while (oldest && oldest > target) {
      if (Date.now() > deadline) throw new OutOfTime();
      await doDay(addDays(oldest, -1));
    }
  } catch (err) {
    if (!(err instanceof OutOfTime)) error = err instanceof Error ? err.message : String(err);
  }

  const complete = Boolean(oldest && oldest <= target);
  const total = job.id === 'rents' ? await prisma.dldRent.count() : await prisma.dldSale.count();
  await prisma.syncState.update({
    where: { id: job.id },
    data: {
      cursorDate: newest,
      lastRunAt: new Date(),
      ...(error ? { lastError: error } : { lastSuccessAt: new Date(), lastError: null }),
      lastCount: inserted,
      totalRows: total,
      info: {
        oldestDone: oldest ? isoDay(oldest) : undefined,
        historyComplete: complete,
        historyDays: job.backfillDays,
        sampleKeys,
      },
    },
  });
  return { inserted, error, historyComplete: complete, newest: newest ? isoDay(newest) : null, oldest: oldest ? isoDay(oldest) : null };
}

// ───────────────────────── projects ─────────────────────────

async function syncProjects(deadline: number) {
  const state = await getState('projects');
  const today = utcDay(new Date());
  // First run looks back two years to seed the inbox; later runs only re-check recent registrations.
  const from = addDays(today, state.lastSuccessAt ? -60 : -730);
  let created = 0;
  let updated = 0;
  let error: string | null = null;
  let sampleKeys: string[] | undefined;

  try {
    const seen = new Map<string, Row>();
    // date_type: 1 = start date, 3 = adoption (registration) date
    for (const dateType of ['1', '3']) {
      if (Date.now() > deadline) throw new OutOfTime();
      const rows = await fetchAll(
        'projects',
        {
          P_FROM_DATE: dldDate(from),
          P_TO_DATE: dldDate(today),
          P_DATE_TYPE: dateType,
          P_PRJ_TYPE_ID: '',
          P_PRJ_STATUS: '',
          P_ZONE_ID: '',
          P_AREA_ID: '',
        },
        deadline,
      );
      if (rows[0]) sampleKeys = Object.keys(rows[0]).slice(0, 40);
      for (const r of rows) {
        const name = pick(r, 'PROJECT_EN', 'PROJECT_NAME_EN', 'PROJECT_NAME', 'PROJECT_NAME_E');
        if (!name) continue;
        const developer = pick(r, 'DEVELOPER_EN', 'DEVELOPER_NAME_EN', 'DEVELOPER_NAME', 'MASTER_DEVELOPER_EN');
        const key = pick(r, 'PROJECT_ID', 'PROJECT_NUMBER') ?? `${areaKey(name)}|${areaKey(developer)}`;
        seen.set(key, r);
      }
    }

    const now = new Date();
    for (const [dldKey, r] of seen) {
      const name = pick(r, 'PROJECT_EN', 'PROJECT_NAME_EN', 'PROJECT_NAME', 'PROJECT_NAME_E')!;
      const status = pick(r, 'PROJECT_STATUS', 'PROJECT_STATUS_EN', 'STATUS_EN', 'STATUS');
      const completionDate = parseDldDate(pick(r, 'PROJECT_END_DATE', 'END_DATE', 'COMPLETION_DATE'));
      const fields = {
        name,
        developer: pick(r, 'DEVELOPER_EN', 'DEVELOPER_NAME_EN', 'DEVELOPER_NAME', 'MASTER_DEVELOPER_EN'),
        area: pick(r, 'AREA_EN', 'AREA_NAME_EN', 'AREA_NAME'),
        status,
        startDate: parseDldDate(pick(r, 'PROJECT_START_DATE', 'START_DATE')),
        completionDate,
        percentComplete: num(pick(r, 'PERCENT_COMPLETED', 'PERCENTAGE_COMPLETED', 'COMPLETION_PERCENTAGE', 'PERCENT_COMPLETE')),
        units: (() => {
          const u = num(pick(r, 'NO_OF_UNITS', 'UNITS', 'NUMBER_OF_UNITS', 'CNT_UNIT'));
          return u === null ? null : Math.round(u);
        })(),
        raw: r as Prisma.InputJsonValue,
        lastSeenAt: now,
      };
      const existing = await prisma.dldProject.findUnique({ where: { dldKey }, select: { id: true } });
      if (existing) {
        await prisma.dldProject.update({ where: { dldKey }, data: fields });
        updated++;
      } else {
        // Only upcoming, live projects need a human decision; the rest are filed as ignored.
        const upcoming =
          !/finish|complete|cancel|friez|freez/i.test(status ?? '') && (!completionDate || completionDate > now);
        await prisma.dldProject.create({ data: { dldKey, ...fields, review: upcoming ? 'NEW' : 'IGNORED' } });
        created++;
      }
    }
  } catch (err) {
    if (!(err instanceof OutOfTime)) error = err instanceof Error ? err.message : String(err);
    else error = 'Stopped early to stay within the time limit; will continue next run.';
  }

  await prisma.syncState.update({
    where: { id: 'projects' },
    data: {
      lastRunAt: new Date(),
      ...(error ? { lastError: error } : { lastSuccessAt: new Date(), lastError: null }),
      lastCount: created,
      totalRows: await prisma.dldProject.count(),
      info: { updated, sampleKeys },
    },
  });
  return { created, updated, error };
}

// ───────────────────────── benchmarks ─────────────────────────

function areaWhere(keys: string[]) {
  return {
    OR: [
      { masterKey: { in: keys } },
      { areaKey: { in: keys } },
      ...keys.map((k) => ({ masterKey: { startsWith: `${k} ` } })),
    ],
  };
}

export async function recomputeBenchmarks() {
  const benchmarks = await prisma.rentBenchmark.findMany({ where: { autoUpdate: true, emirate: 'Dubai' } });
  const today = utcDay(new Date());
  const rentSince = addDays(today, -RENT_BACKFILL_DAYS);
  let updatedCount = 0;

  for (const b of benchmarks) {
    const keys = [...new Set(b.dldAliases.map(areaKey).filter(Boolean))];
    if (!keys.length) continue;

    const rents = await prisma.dldRent.findMany({
      where: { registeredOn: { gte: rentSince }, ...areaWhere(keys) },
      select: { rooms: true, isVilla: true, annualAmount: true, sizeSqm: true },
    });
    if (rents.length < 20) continue;

    const range = (xs: number[]) => {
      if (xs.length < MIN_SAMPLE) return null;
      const s = [...xs].sort((a, c) => a - c);
      return `${aed(percentile(s, 0.25))} – ${aed(percentile(s, 0.75)).replace('AED ', '')}`;
    };
    const apartments = rents.filter((r) => !r.isVilla);
    const byRooms = (pred: (n: number) => boolean) =>
      apartments.filter((r) => r.rooms !== null && pred(r.rooms)).map((r) => r.annualAmount);

    const data: Prisma.RentBenchmarkUpdateInput = {
      dataUpdatedAt: new Date(),
      rentSampleSize: rents.length,
    };
    const studio = range(byRooms((n) => n === 0));
    const one = range(byRooms((n) => n === 1));
    const two = range(byRooms((n) => n === 2));
    const three = range(byRooms((n) => n >= 3));
    const villa = range(rents.filter((r) => r.isVilla).map((r) => r.annualAmount));
    if (studio) data.studioRentAED = studio;
    if (one) data.oneBedRentAED = one;
    if (two) data.twoBedRentAED = two;
    if (three) data.threeBedRentAED = three;
    if (villa) data.villaRentAED = villa;

    // Price per sqft and gross yield from sales in the last 12 months
    const sales = await prisma.dldSale.findMany({
      where: { soldOn: { gte: addDays(today, -365) }, sizeSqm: { gt: 15 }, ...areaWhere(keys) },
      select: { value: true, sizeSqm: true, soldOn: true },
    });
    const pricePerSqm = sales.map((s) => s.value / s.sizeSqm!);
    if (pricePerSqm.length >= 20) {
      const medPsm = median(pricePerSqm);
      data.avgPriceSqftAED = Math.round(medPsm / 10.7639);
      const rentPerSqm = rents.filter((r) => r.sizeSqm && r.sizeSqm > 15).map((r) => r.annualAmount / r.sizeSqm!);
      if (rentPerSqm.length >= 20) {
        data.avgYield = `${((median(rentPerSqm) / medPsm) * 100).toFixed(1)}% gross`;
      }
    }

    // Year-on-year price growth: last 90 days vs the same 90 days a year earlier
    const [recent, yearAgo] = await Promise.all([
      prisma.dldSale.findMany({
        where: { soldOn: { gte: addDays(today, -90) }, sizeSqm: { gt: 15 }, ...areaWhere(keys) },
        select: { value: true, sizeSqm: true },
      }),
      prisma.dldSale.findMany({
        where: { soldOn: { gte: addDays(today, -455), lt: addDays(today, -365) }, sizeSqm: { gt: 15 }, ...areaWhere(keys) },
        select: { value: true, sizeSqm: true },
      }),
    ]);
    if (recent.length >= 20 && yearAgo.length >= 20) {
      const g = median(recent.map((s) => s.value / s.sizeSqm!)) / median(yearAgo.map((s) => s.value / s.sizeSqm!)) - 1;
      data.growthYoY = `${g >= 0 ? '+' : ''}${(g * 100).toFixed(1)}%`;
    }

    await prisma.rentBenchmark.update({ where: { id: b.id }, data });
    updatedCount++;
  }

  await prisma.syncState.upsert({
    where: { id: 'benchmarks' },
    create: { id: 'benchmarks', lastRunAt: new Date(), lastSuccessAt: new Date(), lastCount: updatedCount },
    update: { lastRunAt: new Date(), lastSuccessAt: new Date(), lastCount: updatedCount, lastError: null },
  });
  return { updated: updatedCount };
}

// ───────────────────────── orchestration ─────────────────────────

async function acquireLock(): Promise<boolean> {
  await prisma.syncState.upsert({ where: { id: 'lock' }, create: { id: 'lock' }, update: {} });
  const staleBefore = new Date(Date.now() - 2 * 60_000); // a run can never exceed the 60s function limit
  const { count } = await prisma.syncState.updateMany({
    where: { id: 'lock', OR: [{ lastRunAt: null }, { lastRunAt: { lt: staleBefore } }] },
    data: { lastRunAt: new Date() },
  });
  return count === 1;
}

async function releaseLock() {
  await prisma.syncState.update({ where: { id: 'lock' }, data: { lastRunAt: null } });
}

export async function runDldSync({ budgetMs = 38_000 }: { budgetMs?: number } = {}) {
  if (!(await acquireLock())) return { skipped: true, reason: 'A sync is already running.' };
  const started = Date.now();
  const deadline = started + budgetMs;
  try {
    // Projects first (small, and the part admins act on), then rents and sales share the remaining time.
    const projects = await syncProjects(started + Math.min(15_000, budgetMs / 3));
    const rents = await runDailyJob(JOBS[0], started + (deadline - started) * 0.65);
    const sales = await runDailyJob(JOBS[1], deadline);
    const benchmarks = await recomputeBenchmarks();

    // Keep storage bounded
    const today = utcDay(new Date());
    await prisma.dldRent.deleteMany({ where: { registeredOn: { lt: addDays(today, -RENT_KEEP_DAYS) } } });
    await prisma.dldSale.deleteMany({ where: { soldOn: { lt: addDays(today, -SALE_KEEP_DAYS) } } });

    return { skipped: false, seconds: Math.round((Date.now() - started) / 1000), projects, rents, sales, benchmarks };
  } finally {
    await releaseLock();
  }
}
