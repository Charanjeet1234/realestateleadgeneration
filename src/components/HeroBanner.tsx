import React from 'react';
import { Search, MapPin, Building, Shield, Sparkles, Filter, ChevronDown, CheckCircle2 } from 'lucide-react';
import {
  ALL_COMMUNITIES,
  ALL_DEVELOPERS,
  DUBAI_COMMUNITIES,
  ABU_DHABI_COMMUNITIES,
} from '../data/marketData';

export interface FilterState {
  transactionType: 'ALL' | 'Off-Plan' | 'Ready Apartments' | 'Ready Villas' | 'Annual Rent' | 'Short-Term Holiday';
  emirate: 'ALL' | 'Dubai' | 'Abu Dhabi';
  community: string;
  developer: string;
  unitType: string;
  maxBudgetAED: number;
  paymentPlanFilter: string;
  searchQuery: string;
}

interface HeroBannerProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  totalCount: number;
  onOpenLeadModal: (title?: string) => void;
  onSelectAiSearch: (query: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  filters,
  setFilters,
  totalCount,
  onOpenLeadModal,
  onSelectAiSearch,
}) => {
  const availableCommunities =
    filters.emirate === 'Dubai'
      ? DUBAI_COMMUNITIES
      : filters.emirate === 'Abu Dhabi'
      ? ABU_DHABI_COMMUNITIES
      : ALL_COMMUNITIES;

  return (
    <div className="relative pt-6 pb-10 px-4 sm:px-6 lg:px-8 border-b border-slate-800 bg-radial from-[#132042] via-[#0b132b] to-[#080d1a]">
      {/* Background glow aesthetic */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl h-64 bg-amber-500/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Elite Sales & Acquisition Intelligence Engine
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            DLD & ADREC Regulatory Standard
          </div>
        </div>

        {/* Hero Title */}
        <div className="text-center max-w-4xl mx-auto mb-8">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-extrabold tracking-tight text-white leading-tight">
            High-Yield Property & Luxury Assets Across{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-200">
              Dubai & Abu Dhabi
            </span>
          </h1>
          <p className="mt-4 text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Direct developer allocations, live rental yield benchmarks, and compliant DLD/DMT closing schedules. Connect with a Senior Specialist in under 15 minutes.
          </p>

          {/* Quick AI Intent Prompts */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-slate-400">Trending Queries:</span>
            <button
              onClick={() => onSelectAiSearch('What are the highest rental yield off-plan projects in JVC & Business Bay under AED 1.2M?')}
              className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700 transition-colors"
            >
              🔥 JVC 8%+ Net Yields
            </button>
            <button
              onClick={() => onSelectAiSearch('Show me Danube 1% monthly payment plan projects in Dubai South')}
              className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700 transition-colors"
            >
              💳 Danube 1% Monthly Plan
            </button>
            <button
              onClick={() => onSelectAiSearch('Compare Saadiyat Island vs Palm Jumeirah luxury waterfront villas with handover in 2027')}
              className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700 transition-colors"
            >
              🏖️ Saadiyat vs Palm Jumeirah
            </button>
            <button
              onClick={() => onSelectAiSearch('Break down total DLD 4%, Admin fees, and 2% Agency fee on AED 2.5M purchase')}
              className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700 transition-colors"
            >
              ⚖️ DLD 4% Fee Breakdown
            </button>
          </div>
        </div>

        {/* Filter Box Card */}
        <div className="bg-[#0b132b]/90 border border-amber-500/30 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
          {/* Main Category Switches */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
            {/* Category selection */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950/70 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setFilters(f => ({ ...f, transactionType: 'ALL' }))}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filters.transactionType === 'ALL'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Listings
              </button>
              <button
                onClick={() => setFilters(f => ({ ...f, transactionType: 'Off-Plan' }))}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filters.transactionType === 'Off-Plan'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Buy: Off-Plan
              </button>
              <button
                onClick={() => setFilters(f => ({ ...f, transactionType: 'Ready Apartments' }))}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filters.transactionType === 'Ready Apartments'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Ready Apartments
              </button>
              <button
                onClick={() => setFilters(f => ({ ...f, transactionType: 'Ready Villas' }))}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filters.transactionType === 'Ready Villas'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Ready Villas
              </button>
              <button
                onClick={() => setFilters(f => ({ ...f, transactionType: 'Annual Rent' }))}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filters.transactionType === 'Annual Rent'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Rent (1–4 Cheques)
              </button>
            </div>

            {/* Emirate Switch */}
            <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 px-2 font-medium">Emirate:</span>
              <button
                onClick={() => setFilters(f => ({ ...f, emirate: 'ALL', community: 'ALL' }))}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  filters.emirate === 'ALL' ? 'bg-slate-800 text-amber-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                All UAE
              </button>
              <button
                onClick={() => setFilters(f => ({ ...f, emirate: 'Dubai', community: 'ALL' }))}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  filters.emirate === 'Dubai' ? 'bg-slate-800 text-amber-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                Dubai
              </button>
              <button
                onClick={() => setFilters(f => ({ ...f, emirate: 'Abu Dhabi', community: 'ALL' }))}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  filters.emirate === 'Abu Dhabi' ? 'bg-slate-800 text-amber-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                Abu Dhabi
              </button>
            </div>
          </div>

          {/* Granular Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="lg:col-span-2 relative">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Keyword / Project / Landmark
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. Marina, Lagoon, Beachfront, 1% Monthly..."
                  value={filters.searchQuery}
                  onChange={(e) => setFilters(f => ({ ...f, searchQuery: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            {/* Community */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-400" />
                Target Location
              </label>
              <div className="relative">
                <select
                  value={filters.community}
                  onChange={(e) => setFilters(f => ({ ...f, community: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 transition-colors appearance-none cursor-pointer"
                >
                  <option value="ALL">All Communities</option>
                  {availableCommunities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Developer */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <Building className="w-3 h-3 text-amber-400" />
                Developer
              </label>
              <div className="relative">
                <select
                  value={filters.developer}
                  onChange={(e) => setFilters(f => ({ ...f, developer: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 transition-colors appearance-none cursor-pointer"
                >
                  <option value="ALL">All Master Developers</option>
                  {ALL_DEVELOPERS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Unit Type */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Unit Type
              </label>
              <div className="relative">
                <select
                  value={filters.unitType}
                  onChange={(e) => setFilters(f => ({ ...f, unitType: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 transition-colors appearance-none cursor-pointer"
                >
                  <option value="ALL">All Bed Configurations</option>
                  <option value="Studio">Studio</option>
                  <option value="1BR">1 Bedroom</option>
                  <option value="2BR">2 Bedroom</option>
                  <option value="3BR+">3+ Bedroom</option>
                  <option value="Villa/Townhouse">Villa / Townhouse</option>
                  <option value="Penthouse">Penthouse</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Lower Filter Toggles & Fast Counters */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 font-medium">Payment Plan:</span>
              <button
                onClick={() => setFilters(f => ({ ...f, paymentPlanFilter: f.paymentPlanFilter === '1% Monthly' ? 'ALL' : '1% Monthly' }))}
                className={`px-2.5 py-1 rounded-md text-[11px] border transition-colors ${
                  filters.paymentPlanFilter === '1% Monthly'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                    : 'border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                1% Monthly Plans
              </button>
              <button
                onClick={() => setFilters(f => ({ ...f, paymentPlanFilter: f.paymentPlanFilter === 'Post-Handover' ? 'ALL' : 'Post-Handover' }))}
                className={`px-2.5 py-1 rounded-md text-[11px] border transition-colors ${
                  filters.paymentPlanFilter === 'Post-Handover'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                    : 'border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Post-Handover Available
              </button>
              <button
                onClick={() => setFilters(f => ({ ...f, paymentPlanFilter: f.paymentPlanFilter === 'Golden Visa' ? 'ALL' : 'Golden Visa' }))}
                className={`px-2.5 py-1 rounded-md text-[11px] border transition-colors ${
                  filters.paymentPlanFilter === 'Golden Visa'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                    : 'border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Golden Visa (AED 2.0M+)
              </button>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <span className="text-slate-400 text-xs">
                Showing <strong className="text-amber-400 font-bold">{totalCount}</strong> verified assets
              </span>
              <button
                onClick={() =>
                  setFilters({
                    transactionType: 'ALL',
                    emirate: 'ALL',
                    community: 'ALL',
                    developer: 'ALL',
                    unitType: 'ALL',
                    maxBudgetAED: 50000000,
                    paymentPlanFilter: 'ALL',
                    searchQuery: '',
                  })
                }
                className="text-slate-500 hover:text-slate-300 underline text-[11px]"
              >
                Reset Filters
              </button>
              <button
                onClick={() => onOpenLeadModal('VIP Tailored Property Search')}
                className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold"
              >
                Request Off-Market Pack
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
