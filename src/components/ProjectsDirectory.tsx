import React, { useEffect, useMemo, useState } from 'react';
import { Search, MessageSquare, ArrowUpRight, X } from 'lucide-react';
import { api, qs } from '../lib/api';

export interface ProjectFilters {
  q: string;
  area: string;
  developer: string;
  phase: 'all' | 'offplan' | 'ready';
  beds: '' | '0' | '1' | '2' | '3' | '4' | 'villa';
  maxPrice: string;
  completion: string;
  sort: 'popular' | 'completion' | 'newest' | 'price';
  includeUnknown: boolean;
}

export const EMPTY_PROJECT_FILTERS: ProjectFilters = {
  q: '',
  area: '',
  developer: '',
  phase: 'all',
  beds: '',
  maxPrice: '',
  completion: '',
  sort: 'popular',
  includeUnknown: false,
};

type Stat = {
  saleCount: number;
  saleMedian: number | null;
  saleP25: number | null;
  saleP75: number | null;
  psfMedian: number | null;
  rentCount: number;
  rentMedian: number | null;
};

interface Project {
  id: string;
  name: string;
  developer: string | null;
  area: string | null;
  phase: 'OFFPLAN' | 'READY';
  status: string | null;
  completionDate: string | null;
  percentComplete: number | null;
  units: number | null;
  market: Record<string, Stat>;
}

interface Facets {
  total: number;
  phases: Record<string, number>;
  areas: { name: string; count: number }[];
  developers: { name: string; count: number }[];
}

const BUCKET_LABELS: Record<string, string> = {
  '0': 'Studio',
  '1': '1 bed',
  '2': '2 bed',
  '3': '3 bed',
  '4': '4+ bed',
  v3: 'Villa ≤3 bed',
  v4: 'Villa 4 bed',
  v5: 'Villa 5+ bed',
};
const BUCKET_ORDER = ['0', '1', '2', '3', '4', 'v3', 'v4', 'v5'];
const BEDS: [ProjectFilters['beds'], string][] = [
  ['', 'Any'],
  ['0', 'Studio'],
  ['1', '1 bed'],
  ['2', '2 bed'],
  ['3', '3 bed'],
  ['4', '4+ bed'],
  ['villa', 'Villas'],
];
const BUDGETS: [string, string][] = [
  ['', 'Any budget'],
  ['1000000', 'Up to AED 1M'],
  ['2000000', 'Up to AED 2M'],
  ['3000000', 'Up to AED 3M'],
  ['5000000', 'Up to AED 5M'],
  ['10000000', 'Up to AED 10M'],
];

export const titleCase = (s: string | null | undefined) =>
  (s ?? '')
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\b(Ii|Iii|Iv|Vi|Llc|L\.l\.c|Pjsc|Fzco|Fze|Dmcc|Jvc|Jlt)\b/gi, (m) => m.toUpperCase());

const aed = (n: number) =>
  n >= 1_000_000 ? `AED ${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M` : `AED ${Math.round(n / 1000)}k`;

function quarter(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return `Q${Math.floor(d.getUTCMonth() / 3) + 1} ${d.getUTCFullYear()}`;
}

const selectCls =
  'w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-50 focus:outline-none focus:border-amber-400';

interface Props {
  preset: Partial<ProjectFilters> | null;
  onEnquire: (title: string, location: string) => void;
}

export const ProjectsDirectory: React.FC<Props> = ({ preset, onEnquire }) => {
  const [filters, setFilters] = useState<ProjectFilters>({ ...EMPTY_PROJECT_FILTERS, ...(preset ?? {}) });
  const [facets, setFacets] = useState<Facets | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [unknownCount, setUnknownCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(filters.q);

  useEffect(() => {
    if (preset) {
      setFilters({ ...EMPTY_PROJECT_FILTERS, ...preset });
      setSearch(preset.q ?? '');
    }
  }, [preset]);

  useEffect(() => {
    api.get<Facets>('/projects/facets').then(setFacets).catch(() => setFacets(null));
  }, []);

  // Debounce the text search into the filters
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => (f.q === search ? f : { ...f, q: search })), 300);
    return () => clearTimeout(t);
  }, [search]);

  const query = useMemo(
    () =>
      qs({
        q: filters.q,
        area: filters.area,
        developer: filters.developer,
        phase: filters.phase === 'all' ? undefined : filters.phase,
        beds: filters.beds,
        maxPrice: filters.maxPrice,
        completion: filters.completion,
        sort: filters.sort,
        includeUnknown: filters.includeUnknown ? 'true' : undefined,
      }),
    [filters],
  );

  const load = async (nextPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const d = await api.get<{ projects: Project[]; total: number; unknownCount: number; page: number; pages: number }>(
        `/projects${query}${query ? '&' : '?'}page=${nextPage}`,
      );
      setProjects((prev) => (nextPage === 1 ? d.projects : [...prev, ...d.projects]));
      setTotal(d.total);
      setUnknownCount(d.unknownCount);
      setPage(d.page);
      setPages(d.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const set = (patch: Partial<ProjectFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const active = JSON.stringify({ ...filters, sort: 'popular' }) !== JSON.stringify(EMPTY_PROJECT_FILTERS);
  const developerCount = facets?.developers.length ?? 0;
  const thisYear = new Date().getFullYear();

  if (facets && facets.total === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h2 className="text-4xl font-serif text-slate-50">Projects directory</h2>
        <p className="mt-4 text-slate-400">
          The register of Dubai projects loads from the Dubai Land Department after the first data sync. Check back shortly, or ask
          a specialist about any project now.
        </p>
        <button
          onClick={() => onEnquire('Project enquiry', 'Dubai')}
          className="mt-8 px-6 py-3 rounded-full bg-gulf text-champagne text-sm"
        >
          Ask about a project
        </button>
      </div>
    );
  }

  return (
    <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="max-w-3xl">
        <h2 className="text-4xl sm:text-5xl font-serif font-normal tracking-[-0.02em] text-slate-50">Every registered project in Dubai</h2>
        <p className="mt-3 text-slate-400 text-base leading-relaxed">
          {facets
            ? `${facets.total.toLocaleString()} projects from ${developerCount.toLocaleString()} developers on the Dubai Land Department register. `
            : ''}
          Prices and rents are what units in each project actually sold and rented for, by bedroom type.
        </p>
      </div>

      {/* Filters */}
      <div className="mt-8 bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Project, developer or area"
              aria-label="Search projects"
              className={`${selectCls} pl-10`}
            />
          </div>
          <select value={filters.area} onChange={(e) => set({ area: e.target.value })} className={selectCls} aria-label="Area">
            <option value="">All areas</option>
            {facets?.areas.map((a) => (
              <option key={a.name} value={a.name}>
                {titleCase(a.name)} ({a.count})
              </option>
            ))}
          </select>
          <select value={filters.developer} onChange={(e) => set({ developer: e.target.value })} className={selectCls} aria-label="Developer">
            <option value="">All developers</option>
            {facets?.developers.map((d) => (
              <option key={d.name} value={d.name}>
                {titleCase(d.name)} ({d.count})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex p-1 rounded-full bg-slate-950 border border-slate-800 text-sm" role="group" aria-label="Status">
            {(
              [
                ['all', 'All'],
                ['offplan', `Off-plan${facets?.phases.OFFPLAN ? ` (${facets.phases.OFFPLAN})` : ''}`],
                ['ready', `Ready${facets?.phases.READY ? ` (${facets.phases.READY})` : ''}`],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                onClick={() => set({ phase: v })}
                aria-pressed={filters.phase === v}
                className={`px-3.5 py-1.5 rounded-full transition-colors ${
                  filters.phase === v ? 'bg-gulf text-champagne' : 'text-slate-400 hover:text-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Bedrooms">
            {BEDS.map(([v, label]) => (
              <button
                key={v || 'any'}
                onClick={() => set({ beds: v })}
                aria-pressed={filters.beds === v}
                className={`px-3.5 py-1.5 rounded-full border text-sm transition-colors ${
                  filters.beds === v ? 'bg-champagne border-champagne text-onyx' : 'border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <select value={filters.maxPrice} onChange={(e) => set({ maxPrice: e.target.value })} className={selectCls} aria-label="Budget">
            {BUDGETS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <select value={filters.completion} onChange={(e) => set({ completion: e.target.value })} className={selectCls} aria-label="Completion">
            <option value="">Any completion</option>
            {[thisYear, thisYear + 1, thisYear + 2].map((y) => (
              <option key={y} value={String(y)}>
                Completes in {y}
              </option>
            ))}
            <option value={`${thisYear + 3}+`}>{thisYear + 3} or later</option>
          </select>
          <select value={filters.sort} onChange={(e) => set({ sort: e.target.value as ProjectFilters['sort'] })} className={selectCls} aria-label="Sort">
            <option value="popular">Most sold and rented</option>
            <option value="price">Lowest price</option>
            <option value="completion">Completing soonest</option>
            <option value="newest">Newest launches</option>
          </select>
          {active && (
            <button
              onClick={() => {
                setFilters(EMPTY_PROJECT_FILTERS);
                setSearch('');
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 text-sm text-slate-300 hover:text-slate-50"
            >
              <X className="w-4 h-4" /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Result summary */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-slate-400">
          {loading && page === 1 ? 'Searching…' : `${total.toLocaleString()} ${total === 1 ? 'project' : 'projects'}`}
          {filters.beds || filters.maxPrice
            ? filters.includeUnknown
              ? `, including ${unknownCount.toLocaleString()} with no sales recorded yet`
              : ' with recorded sales or rentals matching your filters'
            : ''}
        </p>
        {(filters.beds || filters.maxPrice) && unknownCount > 0 && (
          <label className="inline-flex items-center gap-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              className="accent-amber-500"
              checked={filters.includeUnknown}
              onChange={(e) => set({ includeUnknown: e.target.checked })}
            />
            Also show {unknownCount.toLocaleString()} projects with no sales recorded yet
          </label>
        )}
      </div>
      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

      {/* Results */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((p) => {
          const buckets = BUCKET_ORDER.filter((b) => p.market[b]);
          const shown =
            filters.beds === 'villa'
              ? buckets.filter((b) => b.startsWith('v'))
              : filters.beds
                ? buckets.filter((b) => b === filters.beds)
                : buckets.slice(0, 4);
          const done = p.phase === 'READY';
          const q = quarter(p.completionDate);
          return (
            <article key={p.id} className="flex flex-col bg-slate-900 border border-slate-800 rounded-[22px] p-6">
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`px-2.5 py-1 rounded-full text-[12px] ${
                    done ? 'bg-slate-800 text-slate-300' : 'bg-champagne/40 text-onyx'
                  }`}
                >
                  {done ? `Ready${p.completionDate ? `, ${new Date(p.completionDate).getUTCFullYear()}` : ''}` : `Off-plan${q ? `, ${q}` : ''}`}
                </span>
                {!done && p.percentComplete !== null && (
                  <span className="text-[12px] text-slate-400">{Math.round(p.percentComplete)}% built</span>
                )}
              </div>
              <h3 className="mt-4 text-[1.45rem] leading-tight font-serif text-slate-50">{titleCase(p.name)}</h3>
              <p className="mt-1.5 text-sm text-slate-400">
                {[titleCase(p.developer), titleCase(p.area)].filter(Boolean).join(', ')}
                {p.units ? `. ${p.units.toLocaleString()} units` : ''}
              </p>

              <div className="mt-5 flex-1">
                {shown.length ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[12px] text-slate-400 text-left">
                        <th className="font-normal pb-1.5"></th>
                        <th className="font-normal pb-1.5">Sold for</th>
                        <th className="font-normal pb-1.5 text-right">Rents for</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {shown.map((b) => {
                        const s = p.market[b];
                        return (
                          <tr key={b}>
                            <td className="py-2 pr-2 text-slate-300 whitespace-nowrap">{BUCKET_LABELS[b]}</td>
                            <td className="py-2 pr-2 text-slate-50 whitespace-nowrap" title={s.saleCount ? `${s.saleCount} sales in 12 months` : undefined}>
                              {s.saleMedian ? aed(s.saleMedian) : <span className="text-slate-600">—</span>}
                            </td>
                            <td className="py-2 text-right text-slate-50 whitespace-nowrap" title={s.rentCount ? `${s.rentCount} contracts in 120 days` : undefined}>
                              {s.rentMedian ? `${aed(s.rentMedian)}/yr` : <span className="text-slate-600">—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-slate-400">
                    {buckets.length
                      ? 'No recorded sales or rentals for this unit type yet.'
                      : done
                        ? 'No sales or rentals recorded in the last year.'
                        : 'New launch: no resales recorded yet. Ask for the developer price list.'}
                  </p>
                )}
              </div>

              <div className="mt-6 flex items-center gap-2">
                <button
                  onClick={() => onEnquire(`${done ? 'Availability' : 'Price list & availability'}: ${titleCase(p.name)}`, titleCase(p.area))}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-full bg-gulf hover:bg-gulf-deep text-champagne text-sm transition-colors"
                >
                  {done ? 'Check availability' : 'Get the price list'}
                  <ArrowUpRight className="w-4 h-4" />
                </button>
                <a
                  href={`https://wa.me/971508392140?text=${encodeURIComponent(
                    `Hello PropEngine UAE, I'm interested in ${titleCase(p.name)}${p.area ? ` in ${titleCase(p.area)}` : ''}. Please share availability and prices.`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-slate-700 text-emerald-400 hover:border-emerald-400 transition-colors"
                  aria-label={`WhatsApp about ${titleCase(p.name)}`}
                >
                  <MessageSquare className="w-4 h-4" />
                </a>
              </div>
            </article>
          );
        })}
      </div>

      {!loading && projects.length === 0 && (
        <div className="mt-6 p-10 text-center bg-slate-900 border border-slate-800 rounded-3xl">
          <p className="text-slate-300">No projects match these filters.</p>
          <button onClick={() => onEnquire('Project search assistance', filters.area || 'Dubai')} className="mt-4 px-5 py-2.5 rounded-full bg-gulf text-champagne text-sm">
            Ask a specialist to search for you
          </button>
        </div>
      )}

      {page < pages && (
        <div className="mt-8 text-center">
          <button
            onClick={() => load(page + 1)}
            disabled={loading}
            className="px-6 py-3 rounded-full border border-slate-700 text-slate-200 hover:border-slate-500 text-sm disabled:opacity-50"
          >
            {loading ? 'Loading…' : `Show more (${(total - projects.length).toLocaleString()} left)`}
          </button>
        </div>
      )}

      <p className="mt-8 text-[12px] text-slate-500 max-w-3xl">
        Source: Dubai Land Department open data. Sold-for figures are median sale prices over the last 12 months; rents are median
        Ejari contract values over the last 120 days. Listing a project here is not an offer of a specific unit; availability is
        confirmed by our specialists.
      </p>
    </div>
  );
};
