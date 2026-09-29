import React from 'react';
import { Search, MapPin, Building, Shield, Sparkles, Filter, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useMarketData } from '../lib/context';

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

const UNIT_LABELS: Record<string, string> = {
  '1BR': '1 Bedroom',
  '2BR': '2 Bedroom',
  '3BR+': '3+ Bedroom',
  'Villa/Townhouse': 'Villa / Townhouse',
};

export const HeroBanner: React.FC<HeroBannerProps> = ({
  filters,
  setFilters,
  totalCount,
  onOpenLeadModal,
  onSelectAiSearch,
}) => {
  // Options come from the live listings, so a new community or developer added in
  // the admin panel appears here automatically (and empty options never show).
  const { properties } = useMarketData();
  const inEmirate = properties.filter((p) => filters.emirate === 'ALL' || p.emirate === filters.emirate);
  const uniqueSorted = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b));
  const availableCommunities = uniqueSorted(inEmirate.map((p) => p.community));
  const availableDevelopers = uniqueSorted(inEmirate.map((p) => p.developer));
  const availableUnitTypes = uniqueSorted(inEmirate.flatMap((p) => p.unitTypes));

  const trending = [
    ['JVC yields above 8%', 'What are the highest rental yield off-plan projects in JVC & Business Bay under AED 1.2M?'],
    ['Danube 1% monthly plans', 'Show me Danube 1% monthly payment plan projects in Dubai South'],
    ['Saadiyat vs Palm Jumeirah', 'Compare Saadiyat Island vs Palm Jumeirah luxury waterfront villas with handover in 2027'],
    ['Fees on AED 2.5M', 'Break down total DLD 4%, Admin fees, and 2% Agency fee on AED 2.5M purchase'],
  ] as const;

  return (
    <div className="theme-dark relative overflow-hidden bg-slate-950">
      {/* Dusk skyline — photo with Gulf-night gradient so text stays legible (and the hero still works if the image fails) */}
      <div className="absolute inset-0" aria-hidden="true">
        <img
          src="https://images.unsplash.com/photo-1749273858638-ea678cb48e94?auto=format&fit=crop&w=2400&q=80"
          alt=""
          className="w-full h-full object-cover object-[center_60%] opacity-70"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gulf via-gulf/85 to-gulf/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-gulf via-transparent to-gulf/40" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-10">
        <div className="max-w-4xl">
          <p className="hero-rise flex items-center gap-2 text-sm text-champagne/90">
            <Shield className="w-4 h-4" />
            RERA &amp; ADREC licensed brokerage
          </p>
          <h1 className="hero-rise mt-5 text-[2.6rem] leading-[1.02] sm:text-6xl lg:text-[4.6rem] font-serif font-normal tracking-[-0.02em] text-slate-50">
            Waterfront homes and off-plan launches across Dubai &amp; Abu Dhabi
          </h1>
          <div className="hero-rise-delay brass-rule w-40 mt-8" />
          <p className="hero-rise-delay mt-6 text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed">
            Every listing shows its full DLD fees, payment plan and verified rental yield. Tell us what you are looking for and a specialist replies within 15 minutes.
          </p>
          <div className="hero-rise-delay mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onOpenLeadModal('Private viewing & shortlist request')}
              className="px-6 py-3.5 rounded-full bg-champagne hover:bg-amber-200 text-onyx text-sm font-medium tracking-wide transition-colors"
            >
              Get a private shortlist
            </button>
            <button
              onClick={() => document.getElementById('listings')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-6 py-3.5 rounded-full border border-champagne/50 hover:border-champagne text-slate-100 text-sm tracking-wide transition-colors"
            >
              Browse {totalCount} residences
            </button>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <span className="text-slate-400">Ask our AI advisor:</span>
          {trending.map(([label, prompt]) => (
            <button
              key={label}
              onClick={() => onSelectAiSearch(prompt)}
              className="text-slate-200 underline decoration-champagne/40 underline-offset-4 hover:decoration-champagne hover:text-slate-50 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filter Box Card */}
        <div className="theme-light mt-8 bg-slate-900 text-slate-300 rounded-3xl p-4 sm:p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55)]">
          {/* Main Category Switches */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
            {/* Category selection */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950/70 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setFilters(f => ({ ...f, transactionType: 'ALL' }))}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filters.transactionType === 'ALL'
                    ? 'bg-amber-500 text-onyx font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-50'
                }`}
              >
                All Listings
              </button>
              <button
                onClick={() => setFilters(f => ({ ...f, transactionType: 'Off-Plan' }))}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filters.transactionType === 'Off-Plan'
                    ? 'bg-amber-500 text-onyx font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-50'
                }`}
              >
                Buy: Off-Plan
              </button>
              <button
                onClick={() => setFilters(f => ({ ...f, transactionType: 'Ready Apartments' }))}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filters.transactionType === 'Ready Apartments'
                    ? 'bg-amber-500 text-onyx font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-50'
                }`}
              >
                Ready Apartments
              </button>
              <button
                onClick={() => setFilters(f => ({ ...f, transactionType: 'Ready Villas' }))}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filters.transactionType === 'Ready Villas'
                    ? 'bg-amber-500 text-onyx font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-50'
                }`}
              >
                Ready Villas
              </button>
              <button
                onClick={() => setFilters(f => ({ ...f, transactionType: 'Annual Rent' }))}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filters.transactionType === 'Annual Rent'
                    ? 'bg-amber-500 text-onyx font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-50'
                }`}
              >
                Rent (1–4 Cheques)
              </button>
            </div>

            {/* Emirate Switch */}
            <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 px-2 font-medium">Emirate:</span>
              <button
                onClick={() => setFilters(f => ({ ...f, emirate: 'ALL', community: 'ALL', developer: 'ALL' }))}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  filters.emirate === 'ALL' ? 'bg-slate-800 text-amber-300' : 'text-slate-400 hover:text-slate-50'
                }`}
              >
                All UAE
              </button>
              <button
                onClick={() => setFilters(f => ({ ...f, emirate: 'Dubai', community: 'ALL', developer: 'ALL' }))}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  filters.emirate === 'Dubai' ? 'bg-slate-800 text-amber-300' : 'text-slate-400 hover:text-slate-50'
                }`}
              >
                Dubai
              </button>
              <button
                onClick={() => setFilters(f => ({ ...f, emirate: 'Abu Dhabi', community: 'ALL', developer: 'ALL' }))}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  filters.emirate === 'Abu Dhabi' ? 'bg-slate-800 text-amber-300' : 'text-slate-400 hover:text-slate-50'
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
                  className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-slate-50 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
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
                  className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-slate-50 focus:outline-none focus:border-amber-400 transition-colors appearance-none cursor-pointer"
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
                  className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-slate-50 focus:outline-none focus:border-amber-400 transition-colors appearance-none cursor-pointer"
                >
                  <option value="ALL">All Master Developers</option>
                  {availableDevelopers.map((d) => (
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
                  className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-slate-50 focus:outline-none focus:border-amber-400 transition-colors appearance-none cursor-pointer"
                >
                  <option value="ALL">All Bed Configurations</option>
                  {availableUnitTypes.map((u) => (
                    <option key={u} value={u}>
                      {UNIT_LABELS[u] ?? u}
                    </option>
                  ))}
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
                    : 'border-slate-800 text-slate-400 hover:text-slate-50'
                }`}
              >
                1% Monthly Plans
              </button>
              <button
                onClick={() => setFilters(f => ({ ...f, paymentPlanFilter: f.paymentPlanFilter === 'Post-Handover' ? 'ALL' : 'Post-Handover' }))}
                className={`px-2.5 py-1 rounded-md text-[11px] border transition-colors ${
                  filters.paymentPlanFilter === 'Post-Handover'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                    : 'border-slate-800 text-slate-400 hover:text-slate-50'
                }`}
              >
                Post-Handover Available
              </button>
              <button
                onClick={() => setFilters(f => ({ ...f, paymentPlanFilter: f.paymentPlanFilter === 'Golden Visa' ? 'ALL' : 'Golden Visa' }))}
                className={`px-2.5 py-1 rounded-md text-[11px] border transition-colors ${
                  filters.paymentPlanFilter === 'Golden Visa'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                    : 'border-slate-800 text-slate-400 hover:text-slate-50'
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
