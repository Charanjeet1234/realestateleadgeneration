import React, { useState } from 'react';
import { Building2, LayoutList, TrendingUp, Users } from 'lucide-react';
import type { BenchmarkRecord, DeveloperRecord } from '../../lib/api';
import { useMarketData } from '../../lib/context';
import { ListingsAdmin } from './ListingsAdmin';
import { RecordAdmin, type FieldDef } from './RecordAdmin';
import { TeamAdmin } from './TeamAdmin';

const EMIRATE: FieldDef['type'] = { options: ['Dubai', 'Abu Dhabi'] };

const DEVELOPER_FIELDS: FieldDef[] = [
  { key: 'name', label: 'Developer name', required: true },
  { key: 'emirate', label: 'Emirate', type: EMIRATE, required: true },
  { key: 'logoInitial', label: 'Logo initials', required: true, hint: '2–3 letters, e.g. EM' },
  { key: 'establishedYear', label: 'Established (year)', type: 'number', required: true },
  { key: 'completedProjects', label: 'Completed projects', type: 'number', required: true },
  { key: 'activeProjects', label: 'Active projects', type: 'number', required: true },
  { key: 'onTimeDeliveryRate', label: 'On-time delivery', required: true, hint: 'e.g. 98.4%' },
  { key: 'standardPaymentPlan', label: 'Standard payment plan', required: true },
  { key: 'reputationSummary', label: 'Reputation summary', type: 'textarea', required: true },
  { key: 'signatureMasterpieces', label: 'Signature projects', type: 'lines' },
  { key: 'sortOrder', label: 'Sort order', type: 'number' },
];

const BENCHMARK_FIELDS: FieldDef[] = [
  { key: 'community', label: 'Community', required: true },
  { key: 'emirate', label: 'Emirate', type: EMIRATE, required: true },
  { key: 'avgPriceSqftAED', label: 'Avg price / sqft (AED)', type: 'number', required: true },
  { key: 'avgYield', label: 'Average yield', required: true, hint: 'e.g. 6.4% – 7.2%' },
  { key: 'studioRentAED', label: 'Studio rent', required: true },
  { key: 'oneBedRentAED', label: '1BR rent', required: true },
  { key: 'twoBedRentAED', label: '2BR rent', required: true },
  { key: 'threeBedRentAED', label: '3BR rent', required: true },
  { key: 'villaRentAED', label: 'Villa rent (optional)' },
  { key: 'chequeNorm', label: 'Cheque norm', required: true },
  { key: 'serviceChargePerSqft', label: 'Service charge / sqft', required: true },
  { key: 'topDeveloper', label: 'Top developer', required: true },
  { key: 'growthYoY', label: 'Growth YoY', required: true, hint: 'e.g. +12.5%' },
  { key: 'rentalTrend', label: 'Trend', type: { options: ['Surging', 'High Demand', 'Stable Prime', 'Accelerating'] }, required: true },
  { key: 'sortOrder', label: 'Sort order', type: 'number' },
];

type Section = 'listings' | 'developers' | 'benchmarks' | 'team';

export const AdminPanel: React.FC = () => {
  const [section, setSection] = useState<Section>('listings');
  const { reload } = useMarketData();

  const tabs: [Section, string, React.ReactNode][] = [
    ['listings', 'Listings', <LayoutList className="w-3.5 h-3.5" />],
    ['developers', 'Developers', <Building2 className="w-3.5 h-3.5" />],
    ['benchmarks', 'Rent benchmarks', <TrendingUp className="w-3.5 h-3.5" />],
    ['team', 'Team', <Users className="w-3.5 h-3.5" />],
  ];

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <h2 className="text-2xl sm:text-3xl font-serif font-medium text-slate-50 tracking-tight">Admin</h2>
      <p className="text-sm text-slate-400 mt-1 mb-5">Changes go live on the public site immediately.</p>

      <div className="flex gap-1.5 overflow-x-auto mb-5 no-scrollbar">
        {tabs.map(([k, label, icon]) => (
          <button
            key={k}
            onClick={() => setSection(k)}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2 rounded-lg text-xs font-semibold border ${
              section === k ? 'bg-amber-500 text-onyx border-amber-500' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-50'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {section === 'listings' && <ListingsAdmin onDataChanged={reload} />}
      {section === 'developers' && (
        <RecordAdmin<DeveloperRecord>
          collection="developers"
          singular="developer"
          fields={DEVELOPER_FIELDS}
          titleOf={(d) => d.name}
          onDataChanged={reload}
          columns={[
            { label: 'Developer', render: (d) => <span className="font-bold text-slate-50">{d.name}</span> },
            { label: 'Emirate', render: (d) => d.emirate },
            { label: 'Projects', render: (d) => `${d.completedProjects} done · ${d.activeProjects} active` },
            { label: 'On-time', render: (d) => d.onTimeDeliveryRate },
          ]}
        />
      )}
      {section === 'benchmarks' && (
        <RecordAdmin<BenchmarkRecord>
          collection="benchmarks"
          singular="benchmark"
          fields={BENCHMARK_FIELDS}
          titleOf={(b) => b.community}
          onDataChanged={reload}
          columns={[
            { label: 'Community', render: (b) => <span className="font-bold text-slate-50">{b.community}</span> },
            { label: 'Emirate', render: (b) => b.emirate },
            { label: '1BR rent', render: (b) => b.oneBedRentAED },
            { label: 'Yield', render: (b) => b.avgYield },
            { label: 'Trend', render: (b) => b.rentalTrend },
          ]}
        />
      )}
      {section === 'team' && <TeamAdmin />}
    </div>
  );
};
