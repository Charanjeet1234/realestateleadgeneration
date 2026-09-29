import { Router, type Request } from 'express';
import { requireAdmin, requireAuth } from '../lib/auth.js';
import { asyncHandler, HttpError, leadStatuses, paginationSchema, parse, phoneSchema, transactionTypes, z } from '../lib/http.js';
import { normalizePhone } from '../lib/leads.js';
import { prisma, type Prisma } from '../lib/prisma.js';

export const crmRouter = Router();
crmRouter.use(requireAuth);

const CLOSED: ('WON' | 'LOST')[] = ['WON', 'LOST'];

const leadFilterSchema = z.object({
  status: z.enum([...leadStatuses, 'OPEN']).optional(),
  assignedTo: z.string().max(64).optional(), // 'me' | 'unassigned' | userId
  q: z.string().trim().max(100).optional(),
  source: z.string().max(120).optional(),
  vip: z.enum(['true', 'false']).optional(),
  overdue: z.enum(['true']).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  sort: z.enum(['newest', 'oldest', 'followup', 'updated']).default('newest'),
});

/** Agents only ever see leads assigned to them; admins see everything. */
function scopeWhere(req: Request): Prisma.LeadWhereInput {
  return req.user!.role === 'ADMIN' ? {} : { assignedToId: req.user!.id };
}

function buildWhere(req: Request, f: z.infer<typeof leadFilterSchema>): Prisma.LeadWhereInput {
  const and: Prisma.LeadWhereInput[] = [scopeWhere(req)];
  if (f.status === 'OPEN') and.push({ status: { notIn: CLOSED } });
  else if (f.status) and.push({ status: f.status });
  if (f.assignedTo === 'me') and.push({ assignedToId: req.user!.id });
  else if (f.assignedTo === 'unassigned') and.push({ assignedToId: null });
  else if (f.assignedTo) and.push({ assignedToId: f.assignedTo });
  if (f.source) and.push({ source: f.source });
  if (f.vip) and.push({ isVip: f.vip === 'true' });
  if (f.overdue) and.push({ nextFollowUpAt: { lt: new Date() }, status: { notIn: CLOSED } });
  if (f.from || f.to) and.push({ createdAt: { gte: f.from, lte: f.to } });
  if (f.q) {
    const digits = f.q.replace(/\D/g, '');
    and.push({
      OR: [
        { name: { contains: f.q, mode: 'insensitive' } },
        { email: { contains: f.q, mode: 'insensitive' } },
        { preferredLocation: { contains: f.q, mode: 'insensitive' } },
        { propertyTitle: { contains: f.q, mode: 'insensitive' } },
        ...(digits.length >= 4 ? [{ phone: { contains: digits } }] : []),
      ],
    });
  }
  return { AND: and };
}

const orderBy = (sort: string): Prisma.LeadOrderByWithRelationInput[] =>
  ({
    newest: [{ createdAt: 'desc' }],
    oldest: [{ createdAt: 'asc' }],
    updated: [{ updatedAt: 'desc' }],
    followup: [{ nextFollowUpAt: { sort: 'asc', nulls: 'last' } }, { createdAt: 'desc' }],
  })[sort] as Prisma.LeadOrderByWithRelationInput[];

const leadListSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  preferredLocation: true,
  budget: true,
  transactionType: true,
  unitType: true,
  message: true,
  source: true,
  propertyTitle: true,
  propertyId: true,
  status: true,
  isVip: true,
  nextFollowUpAt: true,
  firstContactAt: true,
  createdAt: true,
  updatedAt: true,
  assignedTo: { select: { id: true, name: true } },
} satisfies Prisma.LeadSelect;

// ───────── List / detail ─────────

crmRouter.get(
  '/leads',
  asyncHandler(async (req, res) => {
    const filters = parse(leadFilterSchema, req.query);
    const { page, pageSize } = parse(paginationSchema, req.query);
    const where = buildWhere(req, filters);
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: orderBy(filters.sort),
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: leadListSelect,
      }),
      prisma.lead.count({ where }),
    ]);
    res.json({ leads, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) });
  }),
);

// CSV export of the current filter (no pagination, capped)
const csvCell = (v: unknown) => {
  let s = v instanceof Date ? v.toISOString() : v == null ? '' : String(v);
  // Neutralise spreadsheet formula injection, but keep plain phone numbers like +971…
  if (/^[=@\t\r]/.test(s) || (/^[+-]/.test(s) && !/^[+-][\d\s()-]+$/.test(s))) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

crmRouter.get(
  '/leads/export.csv',
  asyncHandler(async (req, res) => {
    const filters = parse(leadFilterSchema, req.query);
    const leads = await prisma.lead.findMany({
      where: buildWhere(req, filters),
      orderBy: orderBy(filters.sort),
      take: 10_000,
      select: { ...leadListSelect, utmSource: true, utmMedium: true, utmCampaign: true, marketingConsent: true },
    });
    const header = [
      'Created', 'Name', 'Phone', 'Email', 'Status', 'VIP', 'Assigned To', 'Interest', 'Location', 'Budget',
      'Unit Type', 'Property', 'Source', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Marketing Consent',
      'Next Follow-up', 'Message',
    ];
    const rows = leads.map((l) => [
      l.createdAt, l.name, l.phone, l.email, l.status, l.isVip ? 'Yes' : 'No', l.assignedTo?.name ?? '',
      l.transactionType, l.preferredLocation, l.budget, l.unitType, l.propertyTitle, l.source, l.utmSource,
      l.utmMedium, l.utmCampaign, l.marketingConsent ? 'Yes' : 'No', l.nextFollowUpAt, l.message,
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send('﻿' + csv); // BOM so Excel reads UTF-8 (Arabic names)
  }),
);

async function findScopedLead(req: Request, id: string) {
  const lead = await prisma.lead.findFirst({ where: { id, ...scopeWhere(req) } });
  if (!lead) throw new HttpError(404, 'Lead not found');
  return lead;
}

crmRouter.get(
  '/leads/:id',
  asyncHandler(async (req, res) => {
    await findScopedLead(req, req.params.id);
    const lead = await prisma.lead.findUniqueOrThrow({
      where: { id: req.params.id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        property: { select: { id: true, title: true, community: true, priceRangeFormatted: true } },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 200,
          include: { user: { select: { id: true, name: true } } },
        },
      },
      omit: { ipHash: true },
    });
    res.json({ lead });
  }),
);

// ───────── Update ─────────

const STATUS_LABELS: Record<string, string> = {
  NEW: 'New', CONTACTED: 'Contacted', QUALIFIED: 'Qualified', VIEWING_SCHEDULED: 'Viewing scheduled',
  NEGOTIATION: 'Negotiation', WON: 'Won', LOST: 'Lost',
};

const leadUpdateSchema = z
  .object({
    status: z.enum(leadStatuses),
    isVip: z.boolean(),
    nextFollowUpAt: z.coerce.date().nullable(),
    assignedToId: z.string().max(64).nullable(),
    name: z.string().trim().min(2).max(120),
    phone: phoneSchema,
    email: z.string().trim().toLowerCase().pipe(z.email()),
    preferredLocation: z.string().trim().max(160).nullable(),
    budget: z.string().trim().max(80).nullable(),
    unitType: z.string().trim().max(80).nullable(),
    transactionType: z.enum(transactionTypes),
    statusNote: z.string().trim().max(2000).optional(), // e.g. reason for LOST
  })
  .partial();

crmRouter.patch(
  '/leads/:id',
  asyncHandler(async (req, res) => {
    const current = await findScopedLead(req, req.params.id);
    const { statusNote, ...body } = parse(leadUpdateSchema, req.body);
    const actor = req.user!;

    if (body.assignedToId !== undefined && actor.role !== 'ADMIN') {
      throw new HttpError(403, 'Only admins can reassign leads.');
    }

    const activities: Prisma.LeadActivityCreateWithoutLeadInput[] = [];
    const data: Prisma.LeadUpdateInput = {};

    if (body.status && body.status !== current.status) {
      data.status = body.status;
      activities.push({
        type: 'STATUS_CHANGE',
        body: `${STATUS_LABELS[current.status]} → ${STATUS_LABELS[body.status]}${statusNote ? `\n${statusNote}` : ''}`,
        user: { connect: { id: actor.id } },
      });
      if (current.status === 'NEW' && !current.firstContactAt) data.firstContactAt = new Date();
      if (CLOSED.includes(body.status as 'WON' | 'LOST')) data.nextFollowUpAt = null;
    }

    if (body.assignedToId !== undefined && body.assignedToId !== current.assignedToId) {
      if (body.assignedToId) {
        const agent = await prisma.user.findFirst({ where: { id: body.assignedToId, active: true } });
        if (!agent) throw new HttpError(400, 'That team member does not exist or is inactive.');
        data.assignedTo = { connect: { id: agent.id } };
        activities.push({ type: 'ASSIGNMENT', body: `Assigned to ${agent.name}`, user: { connect: { id: actor.id } } });
      } else {
        data.assignedTo = { disconnect: true };
        activities.push({ type: 'ASSIGNMENT', body: 'Unassigned', user: { connect: { id: actor.id } } });
      }
    }

    if (body.nextFollowUpAt !== undefined) {
      data.nextFollowUpAt = body.nextFollowUpAt;
      if (body.nextFollowUpAt) {
        activities.push({
          type: 'NOTE',
          body: `Follow-up scheduled for ${body.nextFollowUpAt.toISOString()}`,
          user: { connect: { id: actor.id } },
        });
      }
    }

    if (body.isVip !== undefined) data.isVip = body.isVip;
    if (body.name) data.name = body.name;
    if (body.phone) data.phone = normalizePhone(body.phone);
    if (body.email) data.email = body.email;
    if (body.preferredLocation !== undefined) data.preferredLocation = body.preferredLocation;
    if (body.budget !== undefined) data.budget = body.budget;
    if (body.unitType !== undefined) data.unitType = body.unitType;
    if (body.transactionType) data.transactionType = body.transactionType;

    if (activities.length) data.activities = { create: activities };

    const lead = await prisma.lead.update({ where: { id: current.id }, data, select: leadListSelect });
    res.json({ lead });
  }),
);

// ───────── Activity log ─────────

const activitySchema = z.object({
  type: z.enum(['NOTE', 'CALL', 'WHATSAPP', 'EMAIL']),
  body: z.string().trim().min(1).max(5000),
});

crmRouter.post(
  '/leads/:id/activities',
  asyncHandler(async (req, res) => {
    const lead = await findScopedLead(req, req.params.id);
    const { type, body } = parse(activitySchema, req.body);
    const isContact = type !== 'NOTE';
    const [activity] = await prisma.$transaction([
      prisma.leadActivity.create({
        data: { leadId: lead.id, userId: req.user!.id, type, body },
        include: { user: { select: { id: true, name: true } } },
      }),
      prisma.lead.update({
        where: { id: lead.id },
        data: {
          // Logging a call/WhatsApp/email counts as first contact and moves NEW → CONTACTED
          ...(isContact && !lead.firstContactAt ? { firstContactAt: new Date() } : {}),
          ...(isContact && lead.status === 'NEW' ? { status: 'CONTACTED' as const } : {}),
        },
      }),
    ]);
    res.status(201).json({ activity });
  }),
);

// Right-to-erasure requests (UAE PDPL) — admin only
crmRouter.delete(
  '/leads/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    await prisma.lead.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  }),
);

// ───────── Dashboard stats ─────────

crmRouter.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const scope = scopeWhere(req);
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const since30 = new Date(now.getTime() - 30 * 86400_000);

    const [byStatus, today, open, unassigned, overdue, vipOpen, bySource, recent, responded] = await Promise.all([
      prisma.lead.groupBy({ by: ['status'], where: scope, _count: { _all: true } }),
      prisma.lead.count({ where: { ...scope, createdAt: { gte: startOfToday } } }),
      prisma.lead.count({ where: { ...scope, status: { notIn: CLOSED } } }),
      req.user!.role === 'ADMIN' ? prisma.lead.count({ where: { assignedToId: null, status: { notIn: CLOSED } } }) : 0,
      prisma.lead.count({ where: { ...scope, nextFollowUpAt: { lt: now }, status: { notIn: CLOSED } } }),
      prisma.lead.count({ where: { ...scope, isVip: true, status: { notIn: CLOSED } } }),
      prisma.lead.groupBy({
        by: ['source'],
        where: { ...scope, createdAt: { gte: since30 } },
        _count: { _all: true },
        orderBy: { _count: { source: 'desc' } },
        take: 8,
      }),
      prisma.lead.findMany({ where: { ...scope, createdAt: { gte: since30 } }, select: { createdAt: true } }),
      prisma.lead.findMany({
        where: { ...scope, firstContactAt: { not: null }, createdAt: { gte: since30 } },
        select: { createdAt: true, firstContactAt: true },
      }),
    ]);

    const statusCounts = Object.fromEntries(leadStatuses.map((s) => [s, 0])) as Record<string, number>;
    for (const row of byStatus) statusCounts[row.status] = row._count._all;
    const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);

    const daily: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400_000);
      daily.push({ date: d.toISOString().slice(0, 10), count: 0 });
    }
    const idx = new Map(daily.map((d, i) => [d.date, i]));
    for (const { createdAt } of recent) {
      const i = idx.get(createdAt.toISOString().slice(0, 10));
      if (i !== undefined) daily[i].count++;
    }

    const responseMinutes = responded.map((r) => (r.firstContactAt!.getTime() - r.createdAt.getTime()) / 60000);
    const medianResponseMinutes = responseMinutes.length
      ? responseMinutes.sort((a, b) => a - b)[Math.floor(responseMinutes.length / 2)]
      : null;

    const closed = statusCounts.WON + statusCounts.LOST;
    res.json({
      total,
      today,
      open,
      unassigned,
      overdue,
      vipOpen,
      statusCounts,
      conversionRate: closed ? statusCounts.WON / closed : null,
      medianResponseMinutes: medianResponseMinutes === null ? null : Math.round(medianResponseMinutes),
      bySource: bySource.map((s) => ({ source: s.source, count: s._count._all })),
      daily,
    });
  }),
);

// Team list for assignment dropdowns (any signed-in user)
crmRouter.get(
  '/team',
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    });
    res.json({ users });
  }),
);
