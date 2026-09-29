import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users,
  Phone,
  MessageSquare,
  Search,
  RefreshCw,
  Download,
  Star,
  AlertTriangle,
  Clock,
  Inbox,
  Timer,
  ChevronLeft,
  ChevronRight,
  KeyRound,
} from 'lucide-react';
import {
  api,
  qs,
  LEAD_STATUSES,
  statusMeta,
  TRANSACTION_LABELS,
  type LeadStats,
  type LeadStatus,
  type LeadSummary,
  type TeamMember,
} from '../lib/api';
import { useAuth } from '../lib/context';
import { LeadDetailDrawer } from './LeadDetailDrawer';
import { Button, ErrorNote, Field, Modal, formatDateTime, inputCls, timeAgo, waLink } from './ui';

const toolbarSelect =
  'px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-50 focus:outline-none focus:border-amber-400';

type StatusFilter = LeadStatus | 'OPEN' | 'ALL';

interface Filters {
  status: StatusFilter;
  assignedTo: string;
  q: string;
  vip: boolean;
  overdue: boolean;
  sort: 'newest' | 'oldest' | 'followup' | 'updated';
  page: number;
}

const DEFAULT_FILTERS: Filters = { status: 'OPEN', assignedTo: 'ALL', q: '', vip: false, overdue: false, sort: 'newest', page: 1 };

function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

interface Props {
  initialLeadId?: string | null;
  onStatsChange?: (stats: LeadStats) => void;
}

export const BrokerLeadsInbox: React.FC<Props> = ({ initialLeadId, onStatsChange }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [search, setSearch] = useState('');
  const q = useDebounced(search);
  const [leads, setLeads] = useState<LeadSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openLeadId, setOpenLeadId] = useState<string | null>(initialLeadId ?? null);
  const [pwOpen, setPwOpen] = useState(false);

  const query = useMemo(
    () =>
      qs({
        status: filters.status === 'ALL' ? undefined : filters.status,
        assignedTo: filters.assignedTo,
        q,
        vip: filters.vip ? 'true' : undefined,
        overdue: filters.overdue ? 'true' : undefined,
        sort: filters.sort,
        page: filters.page,
        pageSize: 25,
      }),
    [filters, q],
  );

  const loadStats = useCallback(async () => {
    try {
      const s = await api.get<LeadStats>('/stats');
      setStats(s);
      onStatsChange?.(s);
    } catch {
      /* stats are non-critical */
    }
  }, [onStatsChange]);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await api.get<{ leads: LeadSummary[]; total: number; pages: number }>(`/leads${query}`);
      setLeads(d.leads);
      setTotal(d.total);
      setPages(d.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load leads');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    loadStats();
    api.get<{ users: TeamMember[] }>('/team').then((d) => setTeam(d.users)).catch(() => {});
  }, [loadStats]);

  // Auto-refresh every 60s so new leads show up without a manual reload
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadLeads();
        loadStats();
      }
    }, 60_000);
    return () => clearInterval(t);
  }, [loadLeads, loadStats]);

  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, page: 1, ...patch }));

  const quickUpdate = async (lead: LeadSummary, body: Record<string, unknown>) => {
    try {
      const d = await api.patch<{ lead: LeadSummary }>(`/leads/${lead.id}`, body);
      setLeads((ls) => ls.map((l) => (l.id === lead.id ? d.lead : l)));
      loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const exportUrl = `/api/leads/export.csv${qs({
    status: filters.status === 'ALL' ? undefined : filters.status,
    assignedTo: filters.assignedTo,
    q,
    vip: filters.vip ? 'true' : undefined,
    overdue: filters.overdue ? 'true' : undefined,
    sort: filters.sort,
  })}`;

  const now = Date.now();

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            {isAdmin ? 'Agency pipeline · all leads' : `My pipeline · ${user?.name}`}
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-medium text-slate-50 tracking-tight">Lead inbox</h2>
          <p className="text-sm text-slate-400 mt-1">
            Every inquiry from the site, brochure gates and AI assistant. Target: first contact within 15 minutes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setPwOpen(true)}>
            <KeyRound className="w-3.5 h-3.5" /> Password
          </Button>
          <a href={exportUrl} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </a>
          <Button
            onClick={() => {
              loadLeads();
              loadStats();
            }}
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <StatTile icon={<Inbox className="w-4 h-4 text-slate-400" />} label="Open leads" value={stats.open} />
          <StatTile icon={<Clock className="w-4 h-4 text-amber-400" />} label="New today" value={stats.today} accent="text-amber-300" />
          <StatTile
            icon={<AlertTriangle className="w-4 h-4 text-rose-400" />}
            label="Overdue follow-ups"
            value={stats.overdue}
            accent={stats.overdue ? 'text-rose-300' : undefined}
            onClick={() => set({ overdue: true, status: 'OPEN' })}
          />
          <StatTile
            icon={<Star className="w-4 h-4 text-amber-400" />}
            label="Open VIP"
            value={stats.vipOpen}
            onClick={() => set({ vip: true, status: 'OPEN' })}
          />
          {isAdmin ? (
            <StatTile
              icon={<Users className="w-4 h-4 text-violet-400" />}
              label="Unassigned"
              value={stats.unassigned}
              accent={stats.unassigned ? 'text-violet-300' : undefined}
              onClick={() => set({ assignedTo: 'unassigned', status: 'OPEN' })}
            />
          ) : (
            <StatTile
              icon={<Users className="w-4 h-4 text-emerald-400" />}
              label="Won (all time)"
              value={stats.statusCounts.WON}
            />
          )}
          <StatTile
            icon={<Timer className="w-4 h-4 text-sky-400" />}
            label="Median first response"
            value={stats.medianResponseMinutes === null ? '—' : formatMinutes(stats.medianResponseMinutes)}
            hint="last 30 days"
          />
        </div>
      )}

      {/* Pipeline tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 text-xs no-scrollbar">
        {(
          [
            ['OPEN', 'Open', stats ? stats.open : undefined],
            ...LEAD_STATUSES.map((s) => [s.value, s.label, stats?.statusCounts[s.value]] as const),
            ['ALL', 'All', stats?.total],
          ] as [StatusFilter, string, number | undefined][]
        ).map(([value, label, count]) => (
          <button
            key={value}
            onClick={() => set({ status: value })}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg border font-semibold transition-colors ${
              filters.status === value
                ? 'bg-amber-500 text-onyx border-amber-500'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-50'
            }`}
          >
            {label}
            {count !== undefined && <span className="ml-1.5 opacity-70">{count}</span>}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            placeholder="Search name, email, phone, property or community…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setFilters((f) => ({ ...f, page: 1 }));
            }}
            className={`${inputCls} pl-9 py-2.5`}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <select value={filters.assignedTo} onChange={(e) => set({ assignedTo: e.target.value })} className={toolbarSelect}>
              <option value="ALL">Everyone</option>
              <option value="me">Assigned to me</option>
              <option value="unassigned">Unassigned</option>
              {team.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          )}
          <select value={filters.sort} onChange={(e) => set({ sort: e.target.value as Filters['sort'] })} className={toolbarSelect}>
            <option value="newest">Newest first</option>
            <option value="followup">Follow-up due</option>
            <option value="updated">Recently updated</option>
            <option value="oldest">Oldest first</option>
          </select>
          <ToggleChip active={filters.vip} onClick={() => set({ vip: !filters.vip })}>
            <Star className="w-3.5 h-3.5" /> VIP
          </ToggleChip>
          <ToggleChip active={filters.overdue} onClick={() => set({ overdue: !filters.overdue })}>
            <AlertTriangle className="w-3.5 h-3.5" /> Overdue
          </ToggleChip>
          {(filters.vip || filters.overdue || filters.assignedTo !== 'ALL' || search) && (
            <Button
              onClick={() => {
                setSearch('');
                setFilters({ ...DEFAULT_FILTERS, status: filters.status });
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      <ErrorNote message={error} />

      {/* Table */}
      <div className="mt-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[960px]">
          <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Client</th>
              <th className="py-3 px-3">Contact</th>
              <th className="py-3 px-3">Looking for</th>
              <th className="py-3 px-3">Source</th>
              <th className="py-3 px-3">Status</th>
              {isAdmin && <th className="py-3 px-3">Agent</th>}
              <th className="py-3 px-3">Follow-up</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-200">
            {!loading && leads.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="py-14 text-center text-slate-400">
                  No leads match these filters.
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const overdue = lead.nextFollowUpAt && new Date(lead.nextFollowUpAt).getTime() < now && !['WON', 'LOST'].includes(lead.status);
                const waitingMins = lead.status === 'NEW' ? Math.floor((now - new Date(lead.createdAt).getTime()) / 60000) : 0;
                return (
                  <tr key={lead.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <button onClick={() => setOpenLeadId(lead.id)} className="flex items-center gap-2.5 text-left group">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400 shrink-0">
                          {lead.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-50 text-sm group-hover:text-amber-300 flex items-center gap-1">
                            {lead.name}
                            {lead.isVip && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                          </span>
                          <span className={`text-[10px] ${waitingMins > 15 ? 'text-rose-300 font-semibold' : 'text-slate-500'}`}>
                            {timeAgo(lead.createdAt)}
                            {waitingMins > 15 && ' · awaiting contact'}
                          </span>
                        </div>
                      </button>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px]">
                      <div className="text-slate-200">{lead.phone}</div>
                      <div className="text-slate-500 truncate max-w-[180px]">{lead.email}</div>
                    </td>
                    <td className="py-3 px-3 max-w-[220px]">
                      <div className="text-slate-50 truncate">{lead.propertyTitle || lead.preferredLocation || '—'}</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {[TRANSACTION_LABELS[lead.transactionType], lead.budget].filter(Boolean).join(' · ')}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] px-2 py-0.5 bg-slate-900 rounded-md border border-slate-800 text-slate-300 whitespace-nowrap">
                        {lead.source}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={lead.status}
                        onChange={(e) =>
                          e.target.value === 'LOST' ? setOpenLeadId(lead.id) : quickUpdate(lead, { status: e.target.value })
                        }
                        className={`text-[11px] font-bold rounded-full border px-2 py-0.5 bg-transparent focus:outline-none ${statusMeta(lead.status).tone}`}
                        aria-label="Status"
                      >
                        {LEAD_STATUSES.map((s) => (
                          <option key={s.value} value={s.value} className="bg-slate-900 text-slate-200">
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-3">
                        <select
                          value={lead.assignedTo?.id ?? ''}
                          onChange={(e) => quickUpdate(lead, { assignedToId: e.target.value || null })}
                          className={`text-[11px] bg-slate-900 border rounded-md px-1.5 py-1 focus:outline-none max-w-[130px] ${
                            lead.assignedTo ? 'border-slate-700 text-slate-200' : 'border-violet-500/50 text-violet-300'
                          }`}
                          aria-label="Assigned agent"
                        >
                          <option value="">Unassigned</option>
                          {team.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </td>
                    )}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {lead.nextFollowUpAt ? (
                        <span className={overdue ? 'text-rose-300 font-semibold' : 'text-slate-300'}>
                          {overdue && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                          {formatDateTime(lead.nextFollowUpAt)}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={waLink(lead.phone, `Hello ${lead.name.split(' ')[0]}, this is ${user?.name} from PropEngine UAE regarding your inquiry.`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40"
                          title="WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                        <a href={`tel:${lead.phone}`} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700" title="Call">
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <Button onClick={() => setOpenLeadId(lead.id)} className="px-2.5 py-1.5">
                          Open
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
        <span>
          {total} lead{total === 1 ? '' : 's'}
        </span>
        {pages > 1 && (
          <div className="flex items-center gap-2">
            <Button disabled={filters.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span>
              Page {filters.page} of {pages}
            </span>
            <Button disabled={filters.page >= pages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Lead sources */}
      {stats && stats.bySource.length > 0 && (
        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-slate-50 mb-3">Top lead sources · last 30 days</h3>
          <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-xs">
            {stats.bySource.map((s) => (
              <li key={s.source} className="flex items-center justify-between border-b border-slate-800/70 pb-1.5">
                <span className="text-slate-300 truncate">{s.source}</span>
                <span className="font-mono font-bold text-slate-50">{s.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <LeadDetailDrawer
        leadId={openLeadId}
        team={team}
        onClose={() => setOpenLeadId(null)}
        onChanged={(updated) => {
          if (updated) setLeads((ls) => ls.map((l) => (l.id === updated.id ? updated : l)));
          else loadLeads();
          loadStats();
        }}
        onDeleted={(id) => {
          setOpenLeadId(null);
          setLeads((ls) => ls.filter((l) => l.id !== id));
          loadStats();
        }}
      />

      <ChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
    </div>
  );
};

function formatMinutes(m: number) {
  if (m < 60) return `${m}m`;
  if (m < 60 * 24) return `${Math.round(m / 60)}h`;
  return `${Math.round(m / 1440)}d`;
}

function StatTile({
  icon,
  label,
  value,
  accent,
  hint,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accent?: string;
  hint?: string;
  onClick?: () => void;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`text-left bg-slate-900 border border-slate-800 rounded-2xl p-3.5 ${onClick ? 'hover:border-amber-500/40 transition-colors' : ''}`}
    >
      <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
        {icon}
        {label}
      </span>
      <span className={`block text-2xl font-semibold font-serif mt-1 ${accent ?? 'text-slate-50'}`}>{value}</span>
      {hint && <span className="block text-[10px] text-slate-500">{hint}</span>}
    </Tag>
  );
}

function ToggleChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
        active ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-50'
      }`}
    >
      {children}
    </button>
  );
}

function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setCurrent('');
      setNext('');
      setError(null);
      setDone(false);
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post('/auth/change-password', { currentPassword: current, newPassword: next });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Change password">
      {done ? (
        <div className="space-y-3 text-xs text-slate-300">
          <p>Password updated. Other devices have been signed out.</p>
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <ErrorNote message={error} />
          <Field label="Current password">
            <input type="password" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputCls} />
          </Field>
          <Field label="New password" hint="At least 10 characters">
            <input type="password" required minLength={10} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={inputCls} />
          </Field>
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? 'Saving…' : 'Update password'}
          </Button>
        </form>
      )}
    </Modal>
  );
}
