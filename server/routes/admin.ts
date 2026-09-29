import { Router } from 'express';
import { hashPassword, requireAdmin } from '../lib/auth.js';
import { asyncHandler, HttpError, parse, z } from '../lib/http.js';
import { prisma, Prisma } from '../lib/prisma.js';

export const adminRouter = Router();
adminRouter.use(requireAdmin);

const text = (max: number) => z.string().trim().min(1).max(max);
const optText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (v ? v : null));
const strList = (maxItems: number, maxLen: number) => z.array(z.string().trim().min(1).max(maxLen)).max(maxItems);

// ───────── Properties ─────────

const paymentPlanSchema = z
  .object({
    summary: text(120),
    downPayment: text(120),
    duringConstruction: text(160),
    onHandover: text(120),
    postHandover: optText(160),
  })
  .nullable()
  .optional();

const rentalFactorsSchema = z
  .object({
    chequesAccepted: text(40),
    estimatedServiceCharge: text(80),
    securityDeposit: text(80),
    minTerm: text(80),
  })
  .nullable()
  .optional();

const propertySchema = z.object({
  title: text(160),
  tagline: text(240),
  developer: text(120),
  developerTier: text(60),
  emirate: z.enum(['Dubai', 'Abu Dhabi']),
  community: text(120),
  category: z.enum(['Off-Plan', 'Ready Apartments', 'Ready Villas', 'Annual Rent', 'Short-Term Holiday']),
  unitTypes: strList(10, 40).min(1, 'Pick at least one unit type'),
  priceAED: z.number({ message: 'Enter the starting price in AED' }).int().positive('Enter the starting price in AED'),
  priceUSD: z.number().int().positive().optional(),
  priceRangeFormatted: text(80),
  rentalBenchmarkAED: optText(80),
  handoverDate: optText(40),
  paymentPlan: paymentPlanSchema,
  rentalFactors: rentalFactorsSchema,
  projectedROI: z.number().min(0).max(50),
  capitalGrowthForecast: text(200),
  goldenVisaEligible: z.boolean().default(false),
  imageUrl: z.url().max(1000),
  featured: z.boolean().default(false),
  dldCosts: z.object({
    registrationFeeAED: z.number().min(0),
    adminFeeAED: z.number().min(0),
    agencyFeeAED: z.number().min(0),
    oqoodOrDeedAED: z.number().min(0),
  }),
  highlights: strList(12, 200).default([]),
  floorPlanCount: z.number().int().min(0).max(100).default(0),
  published: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

const AED_PER_USD = 3.6725;
const toJson = <T>(v: T | null | undefined) => (v == null ? undefined : (v as object));

function propertyData(p: z.infer<typeof propertySchema>) {
  return {
    ...p,
    priceUSD: p.priceUSD ?? Math.round(p.priceAED / AED_PER_USD),
    paymentPlan: toJson(p.paymentPlan),
    rentalFactors: toJson(p.rentalFactors),
  };
}

adminRouter.get(
  '/properties',
  asyncHandler(async (_req, res) => {
    const properties = await prisma.property.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: { _count: { select: { leads: true } } },
    });
    res.json({ properties });
  }),
);

adminRouter.post(
  '/properties',
  asyncHandler(async (req, res) => {
    const property = await prisma.property.create({ data: propertyData(parse(propertySchema, req.body)) });
    res.status(201).json({ property });
  }),
);

adminRouter.put(
  '/properties/:id',
  asyncHandler(async (req, res) => {
    const input = parse(propertySchema, req.body);
    const data = propertyData(input);
    const property = await prisma.property.update({
      where: { id: req.params.id },
      data: {
        ...data,
        // explicit null clears JSON columns
        paymentPlan: input.paymentPlan === null ? Prisma.DbNull : data.paymentPlan,
        rentalFactors: input.rentalFactors === null ? Prisma.DbNull : data.rentalFactors,
      },
    });
    res.json({ property });
  }),
);

adminRouter.patch(
  '/properties/:id',
  asyncHandler(async (req, res) => {
    // Quick toggles from the listings table
    const body = parse(z.object({ published: z.boolean(), featured: z.boolean(), sortOrder: z.number().int() }).partial(), req.body);
    const property = await prisma.property.update({ where: { id: req.params.id }, data: body });
    res.json({ property });
  }),
);

adminRouter.delete(
  '/properties/:id',
  asyncHandler(async (req, res) => {
    // Leads keep their propertyTitle; the FK is set to null.
    await prisma.property.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  }),
);

// ───────── Developers ─────────

const developerSchema = z.object({
  name: text(120),
  emirate: z.enum(['Dubai', 'Abu Dhabi']),
  establishedYear: z.number().int().min(1900).max(2100),
  completedProjects: z.number().int().min(0),
  activeProjects: z.number().int().min(0),
  signatureMasterpieces: strList(12, 120).default([]),
  reputationSummary: text(1000),
  standardPaymentPlan: text(200),
  onTimeDeliveryRate: text(40),
  logoInitial: text(4),
  sortOrder: z.number().int().default(0),
});

adminRouter.post(
  '/developers',
  asyncHandler(async (req, res) => {
    const developer = await prisma.developer.create({ data: parse(developerSchema, req.body) });
    res.status(201).json({ developer });
  }),
);
adminRouter.put(
  '/developers/:id',
  asyncHandler(async (req, res) => {
    const developer = await prisma.developer.update({ where: { id: req.params.id }, data: parse(developerSchema, req.body) });
    res.json({ developer });
  }),
);
adminRouter.delete(
  '/developers/:id',
  asyncHandler(async (req, res) => {
    await prisma.developer.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  }),
);

// ───────── Rent benchmarks ─────────

const benchmarkSchema = z.object({
  community: text(120),
  emirate: z.enum(['Dubai', 'Abu Dhabi']),
  avgPriceSqftAED: z.number().int().min(0),
  studioRentAED: text(60),
  oneBedRentAED: text(60),
  twoBedRentAED: text(60),
  threeBedRentAED: text(60),
  villaRentAED: optText(60),
  avgYield: text(40),
  chequeNorm: text(80),
  serviceChargePerSqft: text(60),
  topDeveloper: text(120),
  growthYoY: text(20),
  rentalTrend: z.enum(['Surging', 'High Demand', 'Stable Prime', 'Accelerating']),
  sortOrder: z.number().int().default(0),
  dldAliases: strList(12, 120).default([]),
  autoUpdate: z.boolean().default(true),
});

adminRouter.post(
  '/benchmarks',
  asyncHandler(async (req, res) => {
    const benchmark = await prisma.rentBenchmark.create({ data: parse(benchmarkSchema, req.body) });
    res.status(201).json({ benchmark });
  }),
);
adminRouter.put(
  '/benchmarks/:id',
  asyncHandler(async (req, res) => {
    const benchmark = await prisma.rentBenchmark.update({ where: { id: req.params.id }, data: parse(benchmarkSchema, req.body) });
    res.json({ benchmark });
  }),
);
adminRouter.delete(
  '/benchmarks/:id',
  asyncHandler(async (req, res) => {
    await prisma.rentBenchmark.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  }),
);

// ───────── Team / users ─────────

const userPublic = {
  id: true, email: true, name: true, phone: true, role: true, active: true, lastLoginAt: true, createdAt: true,
  _count: { select: { assignedLeads: true } },
} as const;

adminRouter.get(
  '/users',
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({ orderBy: [{ active: 'desc' }, { name: 'asc' }], select: userPublic });
    res.json({ users });
  }),
);

const newUserSchema = z.object({
  name: text(120),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  phone: optText(32),
  role: z.enum(['ADMIN', 'AGENT']).default('AGENT'),
  password: z.string().min(10, 'Use at least 10 characters').max(200),
});

adminRouter.post(
  '/users',
  asyncHandler(async (req, res) => {
    const { password, ...u } = parse(newUserSchema, req.body);
    const user = await prisma.user.create({
      data: { ...u, passwordHash: await hashPassword(password) },
      select: userPublic,
    });
    res.status(201).json({ user });
  }),
);

const updateUserSchema = z
  .object({
    name: text(120),
    phone: optText(32),
    role: z.enum(['ADMIN', 'AGENT']),
    active: z.boolean(),
    password: z.string().min(10, 'Use at least 10 characters').max(200),
  })
  .partial();

adminRouter.patch(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const { password, ...body } = parse(updateUserSchema, req.body);
    const isSelf = req.params.id === req.user!.id;
    if (isSelf && (body.active === false || body.role === 'AGENT')) {
      throw new HttpError(400, "You can't deactivate or demote your own account.");
    }
    const signOut = password !== undefined || body.active === false || body.role !== undefined;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...body,
        ...(password ? { passwordHash: await hashPassword(password) } : {}),
        ...(signOut && !isSelf ? { tokenVersion: { increment: 1 } } : {}),
      },
      select: userPublic,
    });
    // Deactivated agent → return their open leads to the unassigned pool
    if (body.active === false) {
      await prisma.lead.updateMany({
        where: { assignedToId: user.id, status: { notIn: ['WON', 'LOST'] } },
        data: { assignedToId: null },
      });
    }
    res.json({ user });
  }),
);
