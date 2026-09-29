import type { CommunityBenchmark, DeveloperInfo, Property } from '../data/marketData';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const res = await fetch(`/api${path}`, {
    credentials: 'same-origin',
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const text = await res.text();
  const data = text ? (() => { try { return JSON.parse(text); } catch { return null; } })() : null;
  if (!res.ok) {
    throw new ApiError(res.status, data?.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, json?: unknown) => request<T>(path, { method: 'POST', json: json ?? {} }),
  put: <T>(path: string, json: unknown) => request<T>(path, { method: 'PUT', json }),
  patch: <T>(path: string, json: unknown) => request<T>(path, { method: 'PATCH', json }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export const qs = (params: Record<string, string | number | boolean | undefined | null>) => {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '' && v !== 'ALL') s.set(k, String(v));
  }
  const str = s.toString();
  return str ? `?${str}` : '';
};

// ───────── Shared types ─────────

export type Role = 'ADMIN' | 'AGENT';
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'VIEWING_SCHEDULED' | 'NEGOTIATION' | 'WON' | 'LOST';
export const LEAD_STATUSES: { value: LeadStatus; label: string; tone: string }[] = [
  { value: 'NEW', label: 'New', tone: 'bg-amber-500/15 text-amber-300 border-amber-500/40' },
  { value: 'CONTACTED', label: 'Contacted', tone: 'bg-sky-500/15 text-sky-300 border-sky-500/40' },
  { value: 'QUALIFIED', label: 'Qualified', tone: 'bg-violet-500/15 text-violet-300 border-violet-500/40' },
  { value: 'VIEWING_SCHEDULED', label: 'Viewing', tone: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40' },
  { value: 'NEGOTIATION', label: 'Negotiation', tone: 'bg-orange-500/15 text-orange-300 border-orange-500/40' },
  { value: 'WON', label: 'Won', tone: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' },
  { value: 'LOST', label: 'Lost', tone: 'bg-slate-700/40 text-slate-400 border-slate-600' },
];
export const statusMeta = (s: LeadStatus) => LEAD_STATUSES.find((x) => x.value === s)!;

export const TRANSACTION_LABELS: Record<string, string> = {
  buy_offplan: 'Buy · Off-Plan',
  buy_ready: 'Buy · Ready',
  rent_annual: 'Rent · Annual',
  rent_shortterm: 'Rent · Short-Term',
};

export interface LeadSummary {
  id: string;
  name: string;
  phone: string;
  email: string;
  preferredLocation: string | null;
  budget: string | null;
  transactionType: string;
  unitType: string | null;
  message: string | null;
  source: string;
  propertyTitle: string | null;
  propertyId: string | null;
  status: LeadStatus;
  isVip: boolean;
  nextFollowUpAt: string | null;
  firstContactAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo: { id: string; name: string } | null;
}

export interface LeadActivity {
  id: string;
  type: 'SYSTEM' | 'NOTE' | 'STATUS_CHANGE' | 'ASSIGNMENT' | 'CALL' | 'WHATSAPP' | 'EMAIL' | 'REPEAT_INQUIRY';
  body: string;
  createdAt: string;
  user: { id: string; name: string } | null;
}

export interface LeadDetail extends LeadSummary {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  referrer: string | null;
  landingPage: string | null;
  marketingConsent: boolean;
  userAgent: string | null;
  property: { id: string; title: string; community: string; priceRangeFormatted: string } | null;
  activities: LeadActivity[];
}

export interface LeadStats {
  total: number;
  today: number;
  open: number;
  unassigned: number;
  overdue: number;
  vipOpen: number;
  statusCounts: Record<LeadStatus, number>;
  conversionRate: number | null;
  medianResponseMinutes: number | null;
  bySource: { source: string; count: number }[];
  daily: { date: string; count: number }[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: Role;
}

export interface AdminUser extends TeamMember {
  email: string;
  phone: string | null;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  _count: { assignedLeads: number };
}

// DB rows carry an id and timestamps on top of the original static shapes
export type DeveloperRecord = DeveloperInfo & { id: string; sortOrder?: number };
export type BenchmarkRecord = CommunityBenchmark & {
  id: string;
  sortOrder?: number;
  dldAliases?: string[];
  autoUpdate?: boolean;
  dataUpdatedAt?: string | null;
  rentSampleSize?: number | null;
};
export type AdminProperty = Property & {
  published: boolean;
  sortOrder: number;
  _count: { leads: number };
};
