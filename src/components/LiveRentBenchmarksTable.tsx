import React, { useState } from 'react';
import {
  TrendingUp,
  MapPin,
  ShieldCheck,
  Search,
  Sparkles,
  ArrowRight,
  Info,
  DollarSign,
  Layers,
} from 'lucide-react';
import { LIVE_RENTAL_BENCHMARKS, CommunityBenchmark } from '../data/marketData';
import { RoiComparisonWidget } from './RoiComparisonWidget';

interface LiveRentBenchmarksTableProps {
  onSelectCommunity: (communityName: string) => void;
  onAskAi: (prompt: string) => void;
  onOpenLeadModal: (title?: string) => void;
}

export const LiveRentBenchmarksTable: React.FC<LiveRentBenchmarksTableProps> = ({
  onSelectCommunity,
  onAskAi,
  onOpenLeadModal,
}) => {
  const [search, setSearch] = useState('');
  const [selectedEmirate, setSelectedEmirate] = useState<'ALL' | 'Dubai' | 'Abu Dhabi'>('ALL');

  const filtered = LIVE_RENTAL_BENCHMARKS.filter((item) => {
    const matchesEmirate = selectedEmirate === 'ALL' || item.emirate === selectedEmirate;
    const matchesSearch =
      item.community.toLowerCase().includes(search.toLowerCase()) ||
      item.topDeveloper.toLowerCase().includes(search.toLowerCase());
    return matchesEmirate && matchesSearch;
  });

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            Live Q3/Q4 Real-Time Rental Benchmarks Index
          </div>
          <h2 className="text-2xl sm:text-4xl font-serif font-extrabold text-white tracking-tight">
            Dubai & Abu Dhabi Rental Index & Yield Matrix
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Verified average annual rental brackets (AED), cheque standard practices, service charge ranges, and investor net yields updated weekly from DLD & ADREC transaction registries.
          </p>
        </div>

        <button
          onClick={() => onOpenLeadModal('Official DLD Community Rental & Yield Audit Report')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 hover:scale-102 transition-all self-start md:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Download 2026 DLD Rental Yield PDF
        </button>
      </div>

      {/* Interactive ROI Comparison Widget */}
      <RoiComparisonWidget onAskAi={onAskAi} onOpenLeadModal={onOpenLeadModal} />

      {/* Compliance Guidelines Alert Box */}
      <div className="bg-[#0b132b] border border-amber-500/30 rounded-2xl p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div className="border-r md:border-slate-800 pr-2">
          <span className="text-amber-400 font-bold block mb-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Cheques Norms (1–4)
          </span>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Standard UAE leases accept 1, 2, or 4 post-dated cheques. Landlords often provide 3%–5% rental discounts for single-cheque upfront payments.
          </p>
        </div>
        <div className="border-r md:border-slate-800 pr-2">
          <span className="text-amber-400 font-bold block mb-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            Service Charges
          </span>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Under Law No. 27 of 2007 (Dubai), annual service charges (AED 11–38/sqft) are legally covered by the landlord, not the tenant.
          </p>
        </div>
        <div className="border-r md:border-slate-800 pr-2">
          <span className="text-amber-400 font-bold block mb-1 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" />
            Security Deposits
          </span>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Mandatory refundable security deposit: <strong>5% for unfurnished</strong> units and <strong>10% for fully furnished</strong> residences.
          </p>
        </div>
        <div>
          <span className="text-amber-400 font-bold block mb-1 flex items-center gap-1">
            <Info className="w-3.5 h-3.5" />
            Statutory Agency Fees
          </span>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Annual rental broker fee is strictly <strong>5% of the 1st year annual rent + 5% VAT</strong>, accompanied by official Ejari / Tawtheeq tenancy registration.
          </p>
        </div>
      </div>

      {/* Filters & Search for Benchmarks */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search community or developer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setSelectedEmirate('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              selectedEmirate === 'ALL' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Emirates ({LIVE_RENTAL_BENCHMARKS.length})
          </button>
          <button
            onClick={() => setSelectedEmirate('Dubai')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              selectedEmirate === 'Dubai' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Dubai
          </button>
          <button
            onClick={() => setSelectedEmirate('Abu Dhabi')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              selectedEmirate === 'Abu Dhabi' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Abu Dhabi
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-[#0b132b]/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4">Community & Emirate</th>
              <th className="py-3.5 px-3">Avg Rate / Sqft</th>
              <th className="py-3.5 px-3">1 Bedroom Rent (AED)</th>
              <th className="py-3.5 px-3">2 Bedroom Rent (AED)</th>
              <th className="py-3.5 px-3">Net Rental Yield</th>
              <th className="py-3.5 px-3">Cheques Norm</th>
              <th className="py-3.5 px-3">Service Charge</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-200">
            {filtered.map((row) => (
              <tr
                key={row.community}
                className="hover:bg-slate-800/40 transition-colors group"
              >
                {/* Community */}
                <td className="py-4 px-4 font-medium">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white group-hover:text-amber-300 transition-colors block text-sm">
                        {row.community}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="text-amber-400/90 font-medium">{row.emirate}</span>
                        <span>·</span>
                        <span className="text-slate-500">{row.topDeveloper}</span>
                      </div>
                    </div>
                  </div>
                </td>

                {/* Avg Sqft */}
                <td className="py-4 px-3 font-mono text-slate-300">
                  AED {row.avgPriceSqftAED.toLocaleString()}
                  <span className="block text-[10px] text-emerald-400 font-semibold">{row.growthYoY} YoY</span>
                </td>

                {/* 1BR Rent */}
                <td className="py-4 px-3">
                  <span className="font-semibold text-white block">{row.oneBedRentAED}</span>
                  <span className="text-[10px] text-slate-400">Studio: {row.studioRentAED.split('–')[0]}</span>
                </td>

                {/* 2BR Rent */}
                <td className="py-4 px-3">
                  <span className="font-semibold text-white block">{row.twoBedRentAED}</span>
                  <span className="text-[10px] text-slate-400">3BR: {row.threeBedRentAED.split('–')[0]}</span>
                </td>

                {/* Net Yield */}
                <td className="py-4 px-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[11px]">
                    {row.avgYield}
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    Trend: <strong className="text-amber-300">{row.rentalTrend}</strong>
                  </span>
                </td>

                {/* Cheques Norm */}
                <td className="py-4 px-3 text-slate-300">
                  <span className="block font-medium">{row.chequeNorm}</span>
                  <span className="text-[10px] text-slate-500">Ejari Standard</span>
                </td>

                {/* Service Charge */}
                <td className="py-4 px-3 text-slate-400 font-mono text-[11px]">
                  {row.serviceChargePerSqft}
                  <span className="block text-[10px] text-emerald-500">Landlord Borne</span>
                </td>

                {/* Actions */}
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onSelectCommunity(row.community)}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition-colors whitespace-nowrap"
                    >
                      View Listings
                    </button>
                    <button
                      onClick={() =>
                        onAskAi(
                          `Please provide a detailed rental investment breakdown for ${row.community} in ${row.emirate}. Include 1BR vs 2BR rental yields, expected tenant profile, standard cheques, service charges (${row.serviceChargePerSqft}), and top recommended developers.`
                        )
                      }
                      title="Ask AI Copilot"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
