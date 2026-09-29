import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle2, Search, FilePlus2, EyeOff, RotateCcw, ExternalLink } from 'lucide-react';
import { api, qs } from '../../lib/api';
import { Button, ErrorNote, inputCls, timeAgo } from '../ui';

interface SyncState {
  id: string;
  cursorDate: string | null;
  lastRunAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  lastCount: number;
  totalRows: number;
  info: { oldestDone?: string; historyComplete?: boolean; historyDays?: number; updated?: number } | null;
}

interface MarketStatus {
  configured: { cronSecret: boolean };
  states: Partial<Record<'rents' | 'sales' | 'projects' | 'benchmarks', SyncState>>;
  projects: Partial<Record<'NEW' | 'LISTED' | 'IGNORED', number>>;
  rents: { count: number; from: string | null; to: string | null };
  sales: { count: number; from: string | null; to: string | null };
}

interface DldProject {
  id: string;
  name: string;
  developer: string | null;
  area: string | null;
  status: string | null;
  startDate: string | null;
  completionDate: string | null;
  percentComplete: number | null;
  units: number | null;
  review: 'NEW' | 'LISTED' | 'IGNORED';
  firstSeenAt: string;
  property: { id: string; title: string; published: boolean } | null;
}

const titleCase = (s: string | null) =>
  s
    ? s
        .toLowerCase()
        .replace(/\b([a-z])/g, (m) => m.toUpperCase())
        .replace(/\b(Ii|Iii|Iv|Vi|Llc|Fzco|Fze)\b/g, (m) => m.toUpperCase())
    : '—';
const quarter = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `Q${Math.floor(d.getUTCMonth() / 3) + 1} ${d.getUTCFullYear()}`;
};
const day = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const MarketAdmin: React.FC<{ onOpenListings: () => void; onDataChanged: () => void }> = ({ onOpenListings, onDataChanged }) => {
  const [status, setStatus] = useState<MarketStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncNote, setSyncNote] = useState<string | null>(null);

  const [review, setReview] = useState<'NEW' | 'LISTED' | 'IGNORED'>('NEW');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [projects, setProjects] = useState<DldProject[]>([]);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  const loadStatus = useCallback(() => api.get<MarketStatus>('/admin/market/status').then(setStatus).catch((e) => setError(e.message)), []);
  const loadProjects = useCallback(
    () =>
      api
        .get<{ projects: DldProject[]; total: number; pages: number }>(`/admin/market/projects${qs({ review, q, page })}`)
        .then((d) => {
          setProjects(d.projects);
          setTotal(d.total);
          setPages(d.pages);
        })
        .catch((e) => setError(e.message)),
    [review, q, page],
  );

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);
  useEffect(() => {
    const t = setTimeout(loadProjects, 250);
    return () => clearTimeout(t);
  }, [loadProjects]);

  const runSync = async () => {
    setSyncing(true);
    setSyncNote(null);
    setError(null);
    try {
      const r = await api.post<{
        skipped: boolean;
        reason?: string;
        seconds?: number;
        rents?: { inserted: number; error: string | null; historyComplete: boolean };
        sales?: { inserted: number; error: string | null; historyComplete: boolean };
        projects?: { created: number; error: string | null };
      }>('/admin/market/sync');
      if (r.skipped) setSyncNote(r.reason ?? 'Skipped');
      else {
        const errs = [r.rents?.error, r.sales?.error, r.projects?.error].filter(Boolean);
        const behind = !r.rents?.historyComplete || !r.sales?.historyComplete;
        setSyncNote(
          errs.length
            ? `Finished with problems: ${errs.join(' · ')}`
            : `Added ${r.rents?.inserted.toLocaleString()} rent contracts, ${r.sales?.inserted.toLocaleString()} sales and ${r.projects?.created} projects in ${r.seconds}s.${
                behind ? ' History is still loading: run again, or it will continue tonight.' : ''
              }`,
        );
      }
      await Promise.all([loadStatus(), loadProjects()]);
      onDataChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const act = async (p: DldProject, action: 'list' | 'ignore' | 'restore') => {
    setError(null);
    setNotice(null);
    try {
      if (action === 'list') {
        const r = await api.post<{ property: { title: string } }>(`/admin/market/projects/${p.id}/create-listing`);
        setNotice(`Draft listing "${r.property.title}" created. Add the price, photos and payment plan, then publish it.`);
      } else {
        await api.patch(`/admin/market/projects/${p.id}`, { review: action === 'ignore' ? 'IGNORED' : 'NEW' });
      }
      await Promise.all([loadProjects(), loadStatus()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    }
  };

  const card = (label: string, s: SyncState | undefined, rows: string, range: string) => {
    const days = s?.info?.historyDays;
    const oldest = s?.info?.oldestDone;
    const loaded = oldest && s?.cursorDate ? Math.round((new Date(s.cursorDate).getTime() - new Date(oldest).getTime()) / 86_400_000) + 1 : 0;
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <h4 className="font-serif text-lg text-slate-50">{label}</h4>
          {s?.lastError ? (
            <AlertTriangle className="w-4 h-4 text-rose-400" aria-label="Error" />
          ) : s?.lastSuccessAt ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-label="Healthy" />
          ) : null}
        </div>
        <p className="mt-2 text-2xl text-slate-50">{rows}</p>
        <p className="text-sm text-slate-400">{range}</p>
        {days ? (
          <div className="mt-3">
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, (loaded / days) * 100)}%` }} />
            </div>
            <p className="mt-1 text-[12px] text-slate-400">
              {s?.info?.historyComplete ? `Full ${days}-day history loaded` : `History: ${loaded} of ${days} days loaded`}
            </p>
          </div>
        ) : null}
        <p className="mt-3 text-[12px] text-slate-500">
          {s?.lastSuccessAt ? `Last successful sync ${timeAgo(s.lastSuccessAt)}` : 'Not synced yet'}
        </p>
        {s?.lastError && <p className="mt-2 text-[12px] text-rose-300 break-words">{s.lastError}</p>}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
          Every night the site pulls new Ejari rent contracts, sale transactions and registered projects from the Dubai Land
          Department&rsquo;s open data. Rent benchmarks for Dubai recalculate automatically; new projects wait below for you to
          review.
        </p>
        <Button variant="primary" onClick={runSync} disabled={syncing}>
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing (up to a minute)…' : 'Run sync now'}
        </Button>
      </div>

      <ErrorNote message={error} />
      {status && !status.configured.cronSecret && (
        <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-sm text-slate-200">
          Nightly sync is off until you add a <strong>CRON_SECRET</strong> environment variable in Vercel (any long random
          text). &ldquo;Run sync now&rdquo; still works.
        </div>
      )}
      {syncNote && <div className="p-3 rounded-xl border border-slate-700 bg-slate-900 text-sm text-slate-300">{syncNote}</div>}

      {status && (
        <div className="grid md:grid-cols-3 gap-4">
          {card(
            'Rent contracts',
            status.states.rents,
            status.rents.count.toLocaleString(),
            status.rents.from ? `${day(status.rents.from)} – ${day(status.rents.to)}` : 'No data yet',
          )}
          {card(
            'Sale transactions',
            status.states.sales,
            status.sales.count.toLocaleString(),
            status.sales.from ? `${day(status.sales.from)} – ${day(status.sales.to)}` : 'No data yet',
          )}
          {card(
            'Registered projects',
            status.states.projects,
            `${(status.projects.NEW ?? 0).toLocaleString()} to review`,
            `${(status.projects.LISTED ?? 0).toLocaleString()} listed, ${(status.projects.IGNORED ?? 0).toLocaleString()} ignored`,
          )}
        </div>
      )}

      {/* New projects inbox */}
      <div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3">
          <h3 className="font-serif text-2xl text-slate-50">New projects</h3>
          <div className="flex flex-wrap gap-2">
            {(['NEW', 'LISTED', 'IGNORED'] as const).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setReview(r);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-sm border ${
                  review === r ? 'bg-slate-50 text-slate-950 border-slate-50' : 'border-slate-700 text-slate-400 hover:text-slate-50'
                }`}
              >
                {r === 'NEW' ? 'To review' : r === 'LISTED' ? 'Listed' : 'Ignored'}
                {status?.projects[r] ? ` (${status.projects[r]})` : ''}
              </button>
            ))}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Project, developer or area"
                className={`${inputCls} pl-9 w-64`}
              />
            </div>
          </div>
        </div>

        {notice && (
          <div className="mb-3 p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-sm text-slate-200 flex flex-wrap items-center gap-3">
            {notice}
            <button onClick={onOpenListings} className="underline underline-offset-4 inline-flex items-center gap-1">
              Open listings <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[860px]">
            <thead className="text-left text-[12px] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-normal">Project</th>
                <th className="py-3 px-3 font-normal">Area</th>
                <th className="py-3 px-3 font-normal">Completion</th>
                <th className="py-3 px-3 font-normal">Built</th>
                <th className="py-3 px-3 font-normal">Units</th>
                <th className="py-3 px-3 font-normal">Found</th>
                <th className="py-3 px-4 font-normal text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {review === 'NEW'
                      ? status?.states.projects?.lastSuccessAt
                        ? 'No new projects to review.'
                        : 'Run the first sync to load projects registered with DLD.'
                      : 'Nothing here.'}
                  </td>
                </tr>
              ) : (
                projects.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 px-4">
                      <div className="text-slate-50">{titleCase(p.name)}</div>
                      <div className="text-[12px] text-slate-400">
                        {titleCase(p.developer)}
                        {p.status ? `, ${p.status.toLowerCase()}` : ''}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{titleCase(p.area)}</td>
                    <td className="py-3 px-3 text-slate-300">{quarter(p.completionDate)}</td>
                    <td className="py-3 px-3 text-slate-300">{p.percentComplete === null ? '—' : `${Math.round(p.percentComplete)}%`}</td>
                    <td className="py-3 px-3 text-slate-300">{p.units?.toLocaleString() ?? '—'}</td>
                    <td className="py-3 px-3 text-slate-400">{timeAgo(p.firstSeenAt)}</td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-1.5">
                        {p.review === 'NEW' && (
                          <>
                            <Button variant="primary" className="px-2.5 py-1.5" onClick={() => act(p, 'list')}>
                              <FilePlus2 className="w-3.5 h-3.5" /> Create draft listing
                            </Button>
                            <Button className="px-2.5 py-1.5" onClick={() => act(p, 'ignore')} title="Ignore">
                              <EyeOff className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                        {p.review === 'IGNORED' && (
                          <Button className="px-2.5 py-1.5" onClick={() => act(p, 'restore')}>
                            <RotateCcw className="w-3.5 h-3.5" /> Move to review
                          </Button>
                        )}
                        {p.review === 'LISTED' && p.property && (
                          <button onClick={onOpenListings} className="text-[13px] text-amber-400 underline underline-offset-4">
                            {p.property.published ? 'Published' : 'Draft'}: {p.property.title}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-between mt-3 text-sm text-slate-400">
            <span>{total} projects</span>
            <div className="flex gap-2">
              <Button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
        <p className="mt-3 text-[12px] text-slate-500">
          Draft listings stay hidden until you publish them. Advertising an off-plan project in Dubai requires a valid Trakheesi
          permit.
        </p>
      </div>
    </div>
  );
};
