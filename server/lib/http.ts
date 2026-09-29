import type { NextFunction, Request, Response } from 'express';
import { z, ZodError } from 'zod';

/** Throw inside route handlers to return a clean JSON error. */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Wraps async handlers so thrown errors reach the error middleware. */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res, next).catch(next);

export function parse<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  return schema.parse(data);
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    const first = err.issues[0];
    const field = first?.path.join('.');
    return res.status(400).json({
      error: field ? `${field}: ${first.message}` : first?.message || 'Invalid request',
      issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  // Prisma "record not found"
  if (typeof err === 'object' && err && 'code' in err && (err as { code: string }).code === 'P2025') {
    return res.status(404).json({ error: 'Not found' });
  }
  if (typeof err === 'object' && err && 'code' in err && (err as { code: string }).code === 'P2002') {
    return res.status(409).json({ error: 'A record with that value already exists.' });
  }
  if (typeof err === 'object' && err && 'type' in err && (err as { type: string }).type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON body' });
  }
  console.error('Unhandled API error:', err);
  return res.status(500).json({ error: 'Something went wrong. Please try again.' });
}

// ───────── shared field schemas ─────────

const trimmed = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

// International phone: digits with optional +, spaces, dashes, brackets. 7–15 digits.
export const phoneSchema = z
  .string()
  .trim()
  .max(32)
  .refine((v) => /^\+?[\d\s\-().]+$/.test(v) && v.replace(/\D/g, '').length >= 7 && v.replace(/\D/g, '').length <= 15, {
    message: 'Enter a valid phone / WhatsApp number',
  });

export const transactionTypes = ['buy_offplan', 'buy_ready', 'rent_annual', 'rent_shortterm'] as const;
export const leadStatuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'VIEWING_SCHEDULED', 'NEGOTIATION', 'WON', 'LOST'] as const;

export const leadInputSchema = z.object({
  name: trimmed(120).min(2, 'Enter your full name'),
  phone: phoneSchema,
  email: z.string().trim().toLowerCase().max(200).pipe(z.email('Enter a valid email address')),
  preferredLocation: optionalText(160),
  budget: optionalText(80),
  transactionType: z.enum(transactionTypes).optional().default('buy_offplan'),
  unitType: optionalText(80),
  message: optionalText(2000),
  leadSource: optionalText(120),
  propertyId: optionalText(64),
  propertyTitle: optionalText(200),
  marketingConsent: z.boolean().optional().default(false),
  // attribution (captured client-side on first visit)
  utmSource: optionalText(120),
  utmMedium: optionalText(120),
  utmCampaign: optionalText(160),
  referrer: optionalText(500),
  landingPage: optionalText(500),
  // honeypot — real users never fill this
  website: z.string().optional(),
});

export type LeadInput = z.infer<typeof leadInputSchema>;

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export { z };
