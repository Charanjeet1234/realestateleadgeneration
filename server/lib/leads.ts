import crypto from 'node:crypto';
import { config } from './config.js';
import { HttpError, type LeadInput } from './http.js';
import { notifyNewLead } from './notify.js';
import { prisma, type Lead } from './prisma.js';

export interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

export const hashIp = (ip?: string) =>
  ip ? crypto.createHash('sha256').update(`${config.jwtSecret}:${ip}`).digest('hex').slice(0, 32) : null;

/**
 * Normalise to E.164-ish so the same number typed two ways dedupes.
 * UAE local mobile formats (050…, 0501…) become +971…; unknown formats are kept as digits.
 */
export function normalizePhone(raw: string): string {
  let s = raw.trim().replace(/[^\d+]/g, '');
  if (s.startsWith('00')) s = `+${s.slice(2)}`;
  if (s.startsWith('+')) return `+${s.slice(1).replace(/\D/g, '')}`;
  if (s.startsWith('971')) return `+${s}`;
  if (/^05\d{8}$/.test(s)) return `+971${s.slice(1)}`; // UAE mobile 05X XXX XXXX
  return s;
}

/** Largest AED figure mentioned in a free-text budget ("AED 1.5M – 3.5M", "12,000,000", "5M+"). */
export function parseBudgetAED(budget?: string | null): number | null {
  if (!budget) return null;
  const usd = /usd|\$/i.test(budget);
  const matches = [...budget.replace(/,/g, '').matchAll(/(\d+(?:\.\d+)?)\s*(m|mn|million|k|thousand)?/gi)];
  let max = 0;
  for (const [, num, unit] of matches) {
    let v = parseFloat(num);
    const u = (unit || '').toLowerCase();
    if (u.startsWith('m')) v *= 1_000_000;
    else if (u.startsWith('k') || u.startsWith('t')) v *= 1_000;
    max = Math.max(max, v);
  }
  if (!max) return null;
  return Math.round(usd ? max * 3.6725 : max);
}

async function pickAgent() {
  if (!config.leads.autoAssign) return null;
  return prisma.$transaction(async (tx) => {
    const agent = await tx.user.findFirst({
      where: { active: true, role: 'AGENT' },
      orderBy: [{ lastAssignedAt: { sort: 'asc', nulls: 'first' } }, { createdAt: 'asc' }],
    });
    if (!agent) return null;
    await tx.user.update({ where: { id: agent.id }, data: { lastAssignedAt: new Date() } });
    return agent;
  });
}

export interface CaptureResult {
  lead: Lead | null;
  repeat: boolean;
  spam: boolean;
}

export async function captureLead(input: LeadInput, meta: RequestMeta): Promise<CaptureResult> {
  // Honeypot: bots fill hidden fields. Pretend success so they don't adapt.
  if (input.website && input.website.trim() !== '') {
    return { lead: null, repeat: false, spam: true };
  }

  const ipHash = hashIp(meta.ip);
  if (ipHash) {
    const recent = await prisma.lead.count({
      where: { ipHash, createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } },
    });
    if (recent >= config.leads.maxPerIpPer15Min) {
      throw new HttpError(429, 'Too many submissions. Please wait a few minutes or contact us on WhatsApp.');
    }
  }

  const phone = normalizePhone(input.phone);
  const email = input.email;
  const source = input.leadSource || 'Website';

  let propertyId: string | null = null;
  let propertyTitle = input.propertyTitle;
  if (input.propertyId) {
    const property = await prisma.property.findUnique({ where: { id: input.propertyId }, select: { id: true, title: true } });
    if (property) {
      propertyId = property.id;
      propertyTitle ??= property.title;
    }
  }

  const budgetAED = parseBudgetAED(input.budget);
  const isVip = budgetAED !== null && budgetAED >= config.leads.vipBudgetAED;

  // ── Duplicate? Merge into the open lead instead of creating noise ──
  const since = new Date(Date.now() - config.leads.dedupeHours * 3600 * 1000);
  const existing = await prisma.lead.findFirst({
    where: { createdAt: { gte: since }, OR: [{ email }, { phone }] },
    orderBy: { createdAt: 'desc' },
    include: { assignedTo: { select: { name: true, email: true, phone: true } } },
  });

  if (existing) {
    const details = [
      `Repeat inquiry via ${source}`,
      propertyTitle && `Property: ${propertyTitle}`,
      input.budget && `Budget: ${input.budget}`,
      input.preferredLocation && `Location: ${input.preferredLocation}`,
      input.message && `Message: ${input.message}`,
    ]
      .filter(Boolean)
      .join('\n');

    const lead = await prisma.lead.update({
      where: { id: existing.id },
      data: {
        isVip: existing.isVip || isVip,
        // A lost lead coming back is a new opportunity
        status: existing.status === 'LOST' ? 'NEW' : undefined,
        marketingConsent: existing.marketingConsent || input.marketingConsent,
        activities: { create: { type: 'REPEAT_INQUIRY', body: details } },
      },
    });
    await notifyNewLead({ ...lead, source, propertyTitle: propertyTitle ?? lead.propertyTitle, assignedTo: existing.assignedTo, repeat: true });
    return { lead, repeat: true, spam: false };
  }

  const agent = await pickAgent();

  const lead = await prisma.lead.create({
    data: {
      name: input.name,
      phone,
      email,
      preferredLocation: input.preferredLocation,
      budget: input.budget,
      transactionType: input.transactionType,
      unitType: input.unitType,
      message: input.message,
      source,
      propertyId,
      propertyTitle,
      isVip,
      assignedToId: agent?.id ?? null,
      marketingConsent: input.marketingConsent,
      utmSource: input.utmSource,
      utmMedium: input.utmMedium,
      utmCampaign: input.utmCampaign,
      referrer: input.referrer,
      landingPage: input.landingPage,
      ipHash,
      userAgent: meta.userAgent?.slice(0, 300) ?? null,
      activities: {
        create: [
          { type: 'SYSTEM', body: `Lead captured via ${source}${isVip ? ' — flagged VIP by budget' : ''}` },
          ...(agent ? [{ type: 'ASSIGNMENT' as const, body: `Auto-assigned to ${agent.name}` }] : []),
        ],
      },
    },
  });

  await notifyNewLead({
    ...lead,
    assignedTo: agent ? { name: agent.name, email: agent.email, phone: agent.phone } : null,
  });

  return { lead, repeat: false, spam: false };
}
