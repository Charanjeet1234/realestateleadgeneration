import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { extractContact, generateChatReply } from '../lib/ai.js';
import { asyncHandler, HttpError, leadInputSchema, parse, phoneSchema, z } from '../lib/http.js';
import { captureLead } from '../lib/leads.js';
import { prisma, type Prisma } from '../lib/prisma.js';

export const publicRouter = Router();

const meta = (req: import('express').Request) => ({ ip: req.ip, userAgent: req.get('user-agent') });

// Best-effort per-instance limiter. Lead intake additionally has a DB-backed per-IP cap.
const leadLimiter = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false });
const chatLimiter = rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false });

// ───────── Listings (public, published only) ─────────

const propertyQuery = z.object({
  category: z.string().optional(),
  emirate: z.string().optional(),
  community: z.string().optional(),
  developer: z.string().optional(),
  unitType: z.string().optional(),
  maxPriceAED: z.coerce.number().positive().optional(),
  goldenVisa: z.enum(['true', 'false']).optional(),
  featured: z.enum(['true', 'false']).optional(),
  q: z.string().trim().max(100).optional(),
});

publicRouter.get(
  '/properties',
  asyncHandler(async (req, res) => {
    const q = parse(propertyQuery, req.query);
    const where: Prisma.PropertyWhereInput = { published: true };
    if (q.category && q.category !== 'ALL') where.category = q.category;
    if (q.emirate && q.emirate !== 'ALL') where.emirate = q.emirate;
    if (q.community && q.community !== 'ALL') where.community = q.community;
    if (q.developer && q.developer !== 'ALL') where.developer = q.developer;
    if (q.unitType && q.unitType !== 'ALL') where.unitTypes = { has: q.unitType };
    if (q.maxPriceAED) where.priceAED = { lte: q.maxPriceAED };
    if (q.goldenVisa) where.goldenVisaEligible = q.goldenVisa === 'true';
    if (q.featured) where.featured = q.featured === 'true';
    if (q.q) {
      where.OR = [
        { title: { contains: q.q, mode: 'insensitive' } },
        { tagline: { contains: q.q, mode: 'insensitive' } },
        { developer: { contains: q.q, mode: 'insensitive' } },
        { community: { contains: q.q, mode: 'insensitive' } },
      ];
    }
    const properties = await prisma.property.findMany({
      where,
      orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
      omit: { published: true, sortOrder: true },
    });
    res.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    res.json({ properties, total: properties.length });
  }),
);

publicRouter.get(
  '/properties/:id',
  asyncHandler(async (req, res) => {
    const property = await prisma.property.findFirst({
      where: { id: req.params.id, published: true },
      omit: { published: true, sortOrder: true },
    });
    if (!property) throw new HttpError(404, 'Property not found');
    res.json({ property });
  }),
);

publicRouter.get(
  '/developers',
  asyncHandler(async (_req, res) => {
    const developers = await prisma.developer.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
    res.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.json({ developers });
  }),
);

publicRouter.get(
  '/benchmarks',
  asyncHandler(async (_req, res) => {
    const benchmarks = await prisma.rentBenchmark.findMany({ orderBy: [{ sortOrder: 'asc' }, { community: 'asc' }] });
    res.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.json({ benchmarks });
  }),
);

// ───────── Lead capture ─────────

publicRouter.post(
  '/leads',
  leadLimiter,
  asyncHandler(async (req, res) => {
    const input = parse(leadInputSchema, req.body);
    const { lead, repeat } = await captureLead(input, meta(req));
    // Only a reference goes back to the browser — never other leads' data.
    res.status(201).json({
      success: true,
      leadId: lead?.id ?? null,
      repeat,
      message: 'Thank you — a senior specialist will contact you shortly.',
    });
  }),
);

// Kept for backwards compatibility with the original brochure gate.
const brochureSchema = z.object({
  propertyId: z.string().max(64).optional(),
  propertyTitle: z.string().max(200).optional(),
  name: z.string().trim().min(2).max(120),
  phone: phoneSchema,
  email: z.string().trim().toLowerCase().pipe(z.email()),
  marketingConsent: z.boolean().optional(),
  website: z.string().optional(),
});

publicRouter.post(
  '/brochure-request',
  leadLimiter,
  asyncHandler(async (req, res) => {
    const b = parse(brochureSchema, req.body);
    const input = parse(leadInputSchema, {
      ...b,
      leadSource: 'Brochure & Floor Plan Gate',
      transactionType: 'buy_offplan',
      message: `Requested brochure & floor plans${b.propertyTitle ? ` for ${b.propertyTitle}` : ''}`,
    });
    const { lead } = await captureLead(input, meta(req));
    res.json({
      success: true,
      leadId: lead?.id ?? null,
      message: `Thank you. The brochure and floor plans${b.propertyTitle ? ` for "${b.propertyTitle}"` : ''} will be sent to you shortly.`,
    });
  }),
);

// ───────── AI sales assistant ─────────

const chatSchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(4000) }))
    .min(1)
    .max(40),
  userContext: z.record(z.string(), z.unknown()).optional(),
});

publicRouter.post(
  '/chat',
  chatLimiter,
  asyncHandler(async (req, res) => {
    const { messages, userContext } = parse(chatSchema, req.body);
    const recent = messages.slice(-16);
    const response = await generateChatReply(recent, userContext);

    // If the visitor typed a phone number and/or email into the chat, capture them as a lead.
    let leadCaptured = false;
    const last = messages[messages.length - 1];
    if (last.role === 'user') {
      const { email, phone } = extractContact(last.content);
      if (email && phone) {
        const transcript = recent
          .filter((m) => m.role === 'user')
          .map((m) => `• ${m.content.slice(0, 300)}`)
          .join('\n');
        try {
          const input = parse(leadInputSchema, {
            name: 'AI Chat Visitor',
            phone,
            email,
            leadSource: 'AI Sales Assistant (chat)',
            message: `Contact shared in AI chat. Visitor messages:\n${transcript}`.slice(0, 2000),
          });
          await captureLead(input, meta(req));
          leadCaptured = true;
        } catch (err) {
          // Invalid contact or throttled — still return the AI reply.
          if (!(err instanceof HttpError)) console.warn('Chat lead auto-capture skipped:', err);
        }
      }
    }

    res.json({ response, leadCaptured });
  }),
);
