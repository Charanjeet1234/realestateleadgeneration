import React, { useEffect, useMemo, useState } from 'react';
import { Search, ChevronRight, ArrowLeft, Building2, MessageSquare } from 'lucide-react';
import { api } from '../lib/api';

type Bucket = { n: number; median: number; p25: number; p75: number; sqm: number | null };
interface Place {
  key: string;
  name: string;
  areaKey: string;
  areaName: string | null;
  masterName: string | null;
  contracts: number;
  buildings?: number;
  buckets: Record<string, Bucket>;
}

const APARTMENT_COLS: [string, string][] = [
  ['0', 'Studio'],
  ['1', '1 bed'],
  ['2', '2 bed'],
  ['3', '3 bed'],
  ['4', '4+ bed'],
];
const VILLA_COLS: [string, string][] = [
  ['v3', 'Villa ≤3 bed'],
  ['v4', 'Villa 4 bed'],
  ['v5', 'Villa 5+ bed'],
];

const titleCase = (s: string) =>
  s
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\b(Ii|Iii|Iv|Jvc|Jlt|Dso|Mbr)\b/g, (m) => m.toUpperCase());

const k = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 2).replace(/\.?0+$/, '')}M` : `${Math.round(n / 1000)}k`);

/** DLD land-registry area name, only when it differs from the community title. */
function areaContext(p: Place) {
  const t = placeTitle(p, 'area').toLowerCase();
  const a = (p.areaName ?? '').toLowerCase();
  return a && a !== t ? titleCase(p.areaName!) : null;
}

/** Community name people search for (master project), with the DLD land-registry area as context. */
function placeTitle(p: Place, level: 'area' | 'building') {
  if (level === 'building') return titleCase(p.name);
  return titleCase(p.masterName && p.masterName.toLowerCase() !== (p.areaName ?? '').toLowerCase() ? p.masterName : p.areaName ?? p.name);
}

function PriceCell({ b }: { b?: Bucket }) {
  if (!b) return <td className="py-3 px-3 text-slate-600">—</td>;
  return (
    <td className="py-3 px-3 whitespace-nowrap" title={`${b.n.toLocaleString()} contracts${b.sqm ? `, typical size ${Math.round(b.sqm * 10.764).toLocaleString()} sq ft` : ''}`}>
      <div className="text-slate-50">AED {k(b.median)}</div>
      <div className="text-[12px] text-slate-400">
        {k(b.p25)}–{k(b.p75)}
      </div>
    </td>
  );
}

interface Props {
  onEnquire: (title: string, location: string) => void;
}

export const RentPriceExplorer: React.FC<Props> = ({ onEnquire }) => {
  const [areas, setAreas] = useState<Place[] | null>(null);
  const [meta, setMeta] = useState<{ windowDays: number; updatedAt: string | null } | null>(null);
  const [open, setOpen] = useState<{ area: Place; buildings: Place[] } | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ areas: Place[]; buildings: Place[] } | null>(null);
  const [sort, setSort] = useState<'contracts' | 'name'>('contracts');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ areas: Place[]; windowDays: number; updatedAt: string | null }>('/rent-prices/areas')
      .then((d) => {
        setAreas(d.areas);
        setMeta({ windowDays: d.windowDays, updatedAt: d.updatedAt });
      })
      .catch(() => setAreas([]));
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(null);
      return;
    }
    const t = setTimeout(() => {
      api
        .get<{ areas: Place[]; buildings: Place[] }>(`/rent-prices/search?q=${encodeURIComponent(q)}`)
        .then(setResults)
        .catch(() => setResults({ areas: [], buildings: [] }));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const openArea = async (areaKey: string, buildingKey?: string) => {
    setError(null);
    try {
      const d = await api.get<{ area: Place; buildings: Place[] }>(`/rent-prices/areas/${encodeURIComponent(areaKey)}`);
      setOpen(d);
      setHighlight(buildingKey ?? null);
      setQuery('');
      setResults(null);
      document.getElementById('rent-explorer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this area');
    }
  };

  const list = open ? open.buildings : areas ?? [];
  const sorted = useMemo(
    () =>
      [...list].sort((a, b) =>
        sort === 'name' ? placeTitle(a, open ? 'building' : 'area').localeCompare(placeTitle(b, open ? 'building' : 'area')) : b.contracts - a.contracts,
      ),
    [list, sort, open],
  );
  const hasVillas = sorted.some((p) => VILLA_COLS.some(([c]) => p.buckets[c]));
  const cols = [...APARTMENT_COLS, ...(hasVillas ? VILLA_COLS : [])];

  if (areas === null) return null;
  if (areas.length === 0) return null; // nothing synced yet: keep the page clean

  const totalContracts = areas.reduce((s, a) => s + a.contracts, 0);
  const level = open ? 'building' : 'area';

  return (
    <section id="rent-explorer" className="mb-14 scroll-mt-28">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-5">
        <div className="max-w-2xl">
          <h3 className="text-3xl sm:text-4xl font-serif font-normal tracking-[-0.02em] text-slate-50">Rent prices by building</h3>
          <p className="mt-2 text-slate-400 leading-relaxed">
            What tenants actually pay, from {totalContracts.toLocaleString()} Ejari contracts registered with the Dubai Land
            Department in the last {meta?.windowDays ?? 120} days
            {meta?.updatedAt ? `, updated ${new Date(meta.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}` : ''}.
            Each figure is the median annual rent; the smaller line is the range for the middle half of contracts.
          </p>
        </div>
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a building or area, e.g. Marina Gate"
            aria-label="Search a building or area"
            className="w-full pl-11 pr-4 py-3 rounded-full bg-slate-900 border border-slate-700 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
          {results && (
            <div className="absolute z-20 mt-2 w-full max-h-96 overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 shadow-[0_24px_60px_-20px_rgba(23,20,15,0.4)] text-sm">
              {results.areas.length === 0 && results.buildings.length === 0 && (
                <p className="p-4 text-slate-400">No buildings or areas match &ldquo;{query}&rdquo;.</p>
              )}
              {results.areas.map((a) => (
                <button key={`a-${a.areaKey}`} onClick={() => openArea(a.areaKey)} className="w-full text-left px-4 py-3 hover:bg-slate-800 flex items-center justify-between gap-3">
                  <span>
                    <span className="text-slate-50">{placeTitle(a, 'area')}</span>
                    <span className="block text-[12px] text-slate-400">Area, {a.contracts.toLocaleString()} contracts</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              ))}
              {results.buildings.map((b) => (
                <button
                  key={`b-${b.areaKey}-${b.key}`}
                  onClick={() => openArea(b.areaKey, b.key)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-800 flex items-center justify-between gap-3"
                >
                  <span>
                    <span className="text-slate-50">{titleCase(b.name)}</span>
                    <span className="block text-[12px] text-slate-400">
                      {titleCase(b.masterName ?? b.areaName ?? '')}
                      {b.buckets['1'] ? `, 1 bed from AED ${k(b.buckets['1'].median)}` : ''}
                    </span>
                  </span>
                  <Building2 className="w-4 h-4 text-slate-500" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 text-sm">
        {open ? (
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => { setOpen(null); setHighlight(null); }} className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-50">
              <ArrowLeft className="w-4 h-4" /> All areas
            </button>
            <span className="text-slate-600">/</span>
            <span className="text-slate-50 truncate">
              {placeTitle(open.area, 'area')}
              <span className="text-slate-400">
                {' '}
                ({[areaContext(open.area), `${open.buildings.length} buildings`].filter(Boolean).join(', ')})
              </span>
            </span>
          </div>
        ) : (
          <span className="text-slate-400">{areas.length} areas. Select one to see every building.</span>
        )}
        <label className="flex items-center gap-2 text-slate-400">
          Sort
          <select value={sort} onChange={(e) => setSort(e.target.value as 'contracts' | 'name')} className="bg-slate-900 border border-slate-700 rounded-full px-3 py-1.5 text-slate-200 text-sm">
            <option value="contracts">Most rented</option>
            <option value="name">A–Z</option>
          </select>
        </label>
      </div>

      {error && <p className="mb-3 text-sm text-rose-400">{error}</p>}

      <div className="bg-slate-900 border border-slate-800 rounded-[22px] overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-[12px] text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3 px-4 font-normal sticky left-0 bg-slate-900 min-w-[150px] sm:min-w-[220px]">{open ? 'Building' : 'Area'}</th>
              {cols.map(([c, label]) => (
                <th key={c} className="py-3 px-3 font-normal whitespace-nowrap">
                  {label}
                </th>
              ))}
              <th className="py-3 px-4 font-normal text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {sorted.map((p) => {
              const title = placeTitle(p, level);
              const isHighlighted = highlight === p.key;
              return (
                <tr
                  key={`${p.areaKey}-${p.key}`}
                  ref={isHighlighted ? (el) => el?.scrollIntoView({ block: 'center' }) : undefined}
                  className={isHighlighted ? 'bg-amber-500/10' : open ? '' : 'hover:bg-slate-800/40 cursor-pointer'}
                  onClick={open ? undefined : () => openArea(p.areaKey)}
                >
                  <td className={`py-3 px-4 sticky left-0 ${isHighlighted ? 'bg-amber-50' : 'bg-slate-900'}`}>
                    <div className="text-slate-50 flex items-center gap-1.5">
                      {title}
                      {!open && <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                    </div>
                    <div className="text-[12px] text-slate-400">
                      {open
                        ? `${p.contracts.toLocaleString()} contracts`
                        : [areaContext(p), `${p.buildings ?? 0} buildings`, `${p.contracts.toLocaleString()} contracts`].filter(Boolean).join(', ')}
                    </div>
                  </td>
                  {cols.map(([c]) => (
                    <PriceCell key={c} b={p.buckets[c]} />
                  ))}
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEnquire(`Rent enquiry: ${title}`, open ? placeTitle(open.area, 'area') : title);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-slate-700 text-slate-200 hover:border-amber-400 hover:text-slate-50 whitespace-nowrap transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Enquire
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[12px] text-slate-500">
        Source: Dubai Land Department open data (Ejari). Buildings and bedroom types with fewer than 3 recent contracts are not
        shown. Figures are registered contract rents, not advertised asking prices.
      </p>
    </section>
  );
};
