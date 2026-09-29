import React, { useEffect, useState } from 'react';
import { Search, ArrowUpRight } from 'lucide-react';
import { api } from '../lib/api';
import { titleCase } from './ProjectsDirectory';

interface RegisteredDeveloper {
  name: string;
  projects: number;
  offplan: number;
  ready: number;
  units: number;
}

export const RegisteredDevelopers: React.FC<{ onViewProjects: (developer: string) => void }> = ({ onViewProjects }) => {
  const [developers, setDevelopers] = useState<RegisteredDeveloper[] | null>(null);
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(30);

  useEffect(() => {
    api
      .get<{ developers: RegisteredDeveloper[] }>('/registered-developers')
      .then((d) => setDevelopers(d.developers))
      .catch(() => setDevelopers([]));
  }, []);

  if (!developers || developers.length === 0) return null;

  const filtered = developers.filter((d) => d.name.toLowerCase().includes(q.trim().toLowerCase()));
  const shown = filtered.slice(0, limit);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5">
        <div className="max-w-2xl">
          <h3 className="text-3xl sm:text-4xl font-serif font-normal tracking-[-0.02em] text-slate-50">All registered developers</h3>
          <p className="mt-2 text-slate-400">
            {developers.length.toLocaleString()} developers with projects on the Dubai Land Department register.
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setLimit(30);
            }}
            placeholder="Search developers"
            aria-label="Search developers"
            className="w-full pl-11 pr-4 py-3 rounded-full bg-slate-900 border border-slate-700 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-[22px] overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="text-left text-[12px] text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3 px-5 font-normal">Developer</th>
              <th className="py-3 px-3 font-normal">Projects</th>
              <th className="py-3 px-3 font-normal">Off-plan</th>
              <th className="py-3 px-3 font-normal">Completed</th>
              <th className="py-3 px-3 font-normal">Units</th>
              <th className="py-3 px-5 font-normal text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {shown.map((d) => (
              <tr key={d.name}>
                <td className="py-3 px-5 text-slate-50">{titleCase(d.name)}</td>
                <td className="py-3 px-3 text-slate-300">{d.projects.toLocaleString()}</td>
                <td className="py-3 px-3 text-slate-300">{d.offplan ? d.offplan.toLocaleString() : '—'}</td>
                <td className="py-3 px-3 text-slate-300">{d.ready ? d.ready.toLocaleString() : '—'}</td>
                <td className="py-3 px-3 text-slate-300">{d.units ? d.units.toLocaleString() : '—'}</td>
                <td className="py-3 px-5 text-right">
                  <button
                    onClick={() => onViewProjects(d.name)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-slate-700 text-slate-200 hover:border-amber-400 whitespace-nowrap transition-colors"
                  >
                    View projects <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length > shown.length && (
        <div className="mt-5 text-center">
          <button
            onClick={() => setLimit((l) => l + 60)}
            className="px-6 py-3 rounded-full border border-slate-700 text-slate-200 hover:border-slate-500 text-sm"
          >
            Show more ({(filtered.length - shown.length).toLocaleString()} left)
          </button>
        </div>
      )}
    </section>
  );
};
