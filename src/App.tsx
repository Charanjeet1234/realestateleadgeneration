import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { HeroBanner, FilterState } from './components/HeroBanner';
import { PropertyCard } from './components/PropertyCard';
import { LiveRentBenchmarksTable } from './components/LiveRentBenchmarksTable';
import { AiSalesAssistant } from './components/AiSalesAssistant';
import { ClosingCostCalculator } from './components/ClosingCostCalculator';
import { DeveloperDirectory } from './components/DeveloperDirectory';
import { BrokerLeadsInbox } from './components/BrokerLeadsInbox';
import { LeadCaptureModal } from './components/LeadCaptureModal';
import { Footer } from './components/Footer';
import { Property } from './data/marketData';
import { LoginPanel } from './components/LoginPanel';
import { AdminPanel } from './components/admin/AdminPanel';
import { useAuth, useMarketData } from './lib/context';
import type { LeadStats } from './lib/api';
import {
  Sparkles,
  PhoneCall,
  Download,
  ShieldCheck,
  Compass,
  ArrowRight,
  MessageSquare,
  Building2,
  TrendingUp,
  Award,
} from 'lucide-react';

export type AppTab = 'browse' | 'benchmarks' | 'ai-assistant' | 'calculator' | 'developers' | 'leads' | 'admin';

const PATH_TABS: Record<string, AppTab> = { '/crm': 'leads', '/admin': 'admin' };

function tabFromUrl(): AppTab {
  const path = window.location.pathname.replace(/\/+$/, '');
  return PATH_TABS[path] ?? 'browse';
}

export default function App() {
  const { user, loading: authLoading, logout } = useAuth();
  const { properties: PROPERTIES_DATABASE, loading: listingsLoading, error: listingsError, reload: reloadListings } =
    useMarketData();
  const [activeTab, setActiveTabState] = useState<AppTab>(tabFromUrl);
  const [initialLeadId] = useState(() => new URLSearchParams(window.location.search).get('lead'));

  // Keep the URL in sync so staff can bookmark /crm and /admin
  const setActiveTab = useCallback((tab: AppTab) => {
    setActiveTabState(tab);
    const path = tab === 'leads' ? '/crm' : tab === 'admin' ? '/admin' : '/';
    if (window.location.pathname !== path) window.history.pushState(null, '', path + (path === '/' ? window.location.search : ''));
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const onPop = () => setActiveTabState(tabFromUrl());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const [currency, setCurrency] = useState<'AED' | 'USD'>('AED');
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [leadModalTitle, setLeadModalTitle] = useState('VIP Allocation & Floor Plan Package');
  const [leadModalLocation, setLeadModalLocation] = useState('Downtown Dubai');
  const [leadModalPropertyId, setLeadModalPropertyId] = useState<string | undefined>();
  const [leadModalSource, setLeadModalSource] = useState('Portal VIP Lead Gate');
  const [leadCount, setLeadCount] = useState(0);
  const [aiInitialPrompt, setAiInitialPrompt] = useState('');
  const [calculatorInitialPrice, setCalculatorInitialPrice] = useState<number>(2500000);
  const [calculatorInitialEmirate, setCalculatorInitialEmirate] = useState<'Dubai' | 'Abu Dhabi'>('Dubai');

  const [filters, setFilters] = useState<FilterState>({
    transactionType: 'ALL',
    emirate: 'ALL',
    community: 'ALL',
    developer: 'ALL',
    unitType: 'ALL',
    maxBudgetAED: 50000000,
    paymentPlanFilter: 'ALL',
    searchQuery: '',
  });

  // Filter properties
  const filteredProperties = useMemo(() => {
    return PROPERTIES_DATABASE.filter((p) => {
      // Transaction Category
      if (filters.transactionType !== 'ALL') {
        if (p.category !== filters.transactionType) return false;
      }

      // Emirate
      if (filters.emirate !== 'ALL' && p.emirate !== filters.emirate) {
        return false;
      }

      // Community
      if (filters.community !== 'ALL' && p.community !== filters.community) {
        return false;
      }

      // Developer
      if (filters.developer !== 'ALL' && p.developer !== filters.developer) {
        return false;
      }

      // Unit Type
      if (filters.unitType !== 'ALL' && !p.unitTypes.includes(filters.unitType as any)) {
        return false;
      }

      // Payment Plan
      if (filters.paymentPlanFilter === '1% Monthly') {
        if (!p.paymentPlan?.summary?.toLowerCase().includes('1% monthly')) return false;
      }
      if (filters.paymentPlanFilter === 'Post-Handover') {
        if (!p.paymentPlan?.postHandover) return false;
      }
      if (filters.paymentPlanFilter === 'Golden Visa') {
        if (!p.goldenVisaEligible) return false;
      }

      // Search Query
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesTagline = p.tagline.toLowerCase().includes(q);
        const matchesDev = p.developer.toLowerCase().includes(q);
        const matchesComm = p.community.toLowerCase().includes(q);
        const matchesHighlights = p.highlights.some((h) => h.toLowerCase().includes(q));
        if (!matchesTitle && !matchesTagline && !matchesDev && !matchesComm && !matchesHighlights) {
          return false;
        }
      }

      return true;
    });
  }, [filters, PROPERTIES_DATABASE]);

  // Handler for opening lead modal with bespoke property title
  const handleOpenLeadModal = (title?: string, location?: string, propertyId?: string, source?: string) => {
    setLeadModalTitle(title || 'VIP Project Brochure & Floor Plan Package');
    if (location) setLeadModalLocation(location);
    setLeadModalPropertyId(propertyId);
    setLeadModalSource(source || (propertyId ? 'Property Brochure Request' : 'Portal VIP Lead Gate'));
    setLeadModalOpen(true);
  };

  // Handler for jumping to AI Copilot
  const handleAskAi = (prompt: string) => {
    setAiInitialPrompt(prompt);
    setActiveTab('ai-assistant');
  };

  // Handler for opening calculator pre-filled with property price
  const handleOpenCalculator = (prop: Property) => {
    setCalculatorInitialPrice(prop.priceAED);
    setCalculatorInitialEmirate(prop.emirate);
    setActiveTab('calculator');
  };

  // Handler for filtering by community from the benchmarks table
  const handleSelectCommunityFromBenchmark = (communityName: string) => {
    setFilters((prev) => ({
      ...prev,
      community: communityName,
      emirate: 'ALL',
      transactionType: 'ALL',
    }));
    setActiveTab('browse');
  };

  // Handler for filtering by developer from the directory
  const handleSelectDeveloperFromDirectory = (devName: string) => {
    setFilters((prev) => ({
      ...prev,
      developer: devName,
      transactionType: 'ALL',
    }));
    setActiveTab('browse');
  };

  // Open-lead badge for signed-in staff only (lead data is never exposed publicly)
  useEffect(() => {
    if (!user) {
      setLeadCount(0);
      return;
    }
    fetch('/api/stats', { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: LeadStats | null) => data && setLeadCount(data.open))
      .catch(() => {});
  }, [user]);

  // Leaving admin tabs after sign-out
  useEffect(() => {
    if (!authLoading && !user && activeTab === 'admin') setActiveTab('leads');
  }, [authLoading, user, activeTab, setActiveTab]);

  const handleStatsChange = useCallback((s: LeadStats) => setLeadCount(s.open), []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 flex flex-col font-sans">
      {/* Universal Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currency={currency}
        setCurrency={setCurrency}
        onOpenLeadModal={handleOpenLeadModal}
        leadCount={leadCount}
        user={user}
        onLogout={async () => {
          await logout();
          setActiveTab('browse');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'browse' && (
          <div>
            {/* Hero & Search Engine */}
            <HeroBanner
              filters={filters}
              setFilters={setFilters}
              totalCount={filteredProperties.length}
              onOpenLeadModal={handleOpenLeadModal}
              onSelectAiSearch={handleAskAi}
            />

            {/* Properties Catalog Section */}
            <div id="listings" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 scroll-mt-28">
              {/* Section Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div className="max-w-2xl">
                  <h2 className="text-4xl sm:text-5xl font-serif font-normal tracking-[-0.02em] text-slate-50">
                    Available residences
                  </h2>
                  <p className="mt-3 text-slate-400 text-base leading-relaxed">
                    {listingsLoading
                      ? 'Loading current inventory'
                      : `${filteredProperties.length} ${filteredProperties.length === 1 ? 'home' : 'homes'} with developer pricing, closing fees and verified yields.`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setActiveTab('benchmarks')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-slate-700 text-slate-300 hover:text-slate-50 hover:border-slate-500 text-sm transition-colors"
                  >
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    Rents &amp; yields by area
                  </button>
                  <button
                    onClick={() => handleOpenLeadModal('Off-market unit list')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gulf hover:bg-gulf-deep text-champagne text-sm transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Off-market unit list
                  </button>
                </div>
              </div>

              {/* Grid of Properties */}
              {listingsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-96 rounded-3xl bg-slate-900 border border-slate-800 animate-pulse" />
                  ))}
                </div>
              ) : listingsError ? (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center max-w-xl mx-auto space-y-3">
                  <p className="text-sm text-slate-300">We couldn't load the listings right now.</p>
                  <div className="flex justify-center gap-2">
                    <button onClick={reloadListings} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl font-semibold">
                      Try again
                    </button>
                    <button
                      onClick={() => handleOpenLeadModal('Property Search Assistance')}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-onyx text-xs rounded-xl font-bold"
                    >
                      Ask a specialist
                    </button>
                  </div>
                </div>
              ) : filteredProperties.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                    <Compass className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-serif font-semibold text-slate-50">
                    No Direct Matches for Current Criteria
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Our off-market brokerage catalog contains private units not publicly indexed. Ask our AI Sales Assistant or request an exclusive allocation sheet.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
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
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl font-semibold"
                    >
                      Reset All Filters
                    </button>
                    <button
                      onClick={() => handleOpenLeadModal('Custom Off-Market Portfolio Request')}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-onyx text-xs rounded-xl font-bold shadow-md"
                    >
                      Request Private Allocation
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProperties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      currency={currency}
                      onOpenBrochureModal={(p) =>
                        handleOpenLeadModal(
                          `Brochure & Floorplans for ${p.title} (${p.developer})`,
                          p.community,
                          p.id,
                          'Property Brochure Request',
                        )
                      }
                      onOpenCalculator={handleOpenCalculator}
                      onAskAi={handleAskAi}
                    />
                  ))}
                </div>
              )}

              {/* Pre-launch access */}
              <div className="theme-dark mt-24 relative overflow-hidden rounded-[28px] bg-slate-950">
                <img
                  src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1800&q=75"
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover opacity-35"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-gulf via-gulf/90 to-gulf/30" aria-hidden="true" />
                <div className="relative z-10 grid lg:grid-cols-[1.4fr_1fr] gap-10 p-8 sm:p-14">
                  <div>
                    <h3 className="text-3xl sm:text-5xl font-serif font-normal tracking-[-0.02em] text-slate-50 leading-[1.08]">
                      See pre-launch units before they reach the market
                    </h3>
                    <div className="brass-rule w-32 mt-7" />
                    <p className="mt-6 text-slate-300 text-base leading-relaxed max-w-xl">
                      Developers release early inventory to registered buyers first. We send the price sheet and floor plans, and arrange a private viewing with airport pickup for overseas investors.
                    </p>
                  </div>
                  <div className="flex flex-col justify-end gap-3 lg:items-end">
                    <button
                      onClick={() => handleOpenLeadModal('Pre-launch allocation list')}
                      className="w-full sm:w-auto px-7 py-4 rounded-full bg-champagne hover:bg-amber-200 text-onyx text-sm font-medium tracking-wide transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Get the pre-launch list
                    </button>
                    <a
                      href="https://wa.me/971508392140?text=Hello%20PropEngine%20Specialist,%20I%20would%20like%20to%20receive%20the%20pre-launch%20off-market%20allocation%20pack%20for%20Dubai%20and%20Abu%20Dhabi."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-7 py-4 rounded-full border border-slate-600 hover:border-emerald-400 text-slate-100 text-sm tracking-wide transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-300" />
                      Ask on WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Rent Benchmarks Tab */}
        {activeTab === 'benchmarks' && (
          <LiveRentBenchmarksTable
            onSelectCommunity={handleSelectCommunityFromBenchmark}
            onAskAi={handleAskAi}
            onOpenLeadModal={handleOpenLeadModal}
          />
        )}

        {/* AI Sales Assistant Tab */}
        {activeTab === 'ai-assistant' && (
          <AiSalesAssistant
            initialPrompt={aiInitialPrompt}
            onClearInitialPrompt={() => setAiInitialPrompt('')}
            onOpenLeadModal={handleOpenLeadModal}
          />
        )}

        {/* Closing Fee Calculator Tab */}
        {activeTab === 'calculator' && (
          <ClosingCostCalculator
            initialPrice={calculatorInitialPrice}
            initialEmirate={calculatorInitialEmirate}
            onOpenLeadModal={handleOpenLeadModal}
          />
        )}

        {/* Developers Directory Tab */}
        {activeTab === 'developers' && (
          <DeveloperDirectory
            onSelectDeveloper={handleSelectDeveloperFromDirectory}
            onOpenLeadModal={handleOpenLeadModal}
            onAskAi={handleAskAi}
          />
        )}

        {/* Staff area: CRM & admin (sign-in required) */}
        {(activeTab === 'leads' || activeTab === 'admin') &&
          (authLoading ? (
            <div className="py-24 text-center text-xs text-slate-500">Loading…</div>
          ) : !user ? (
            <LoginPanel />
          ) : activeTab === 'admin' && user.role === 'ADMIN' ? (
            <AdminPanel />
          ) : (
            <BrokerLeadsInbox initialLeadId={initialLeadId} onStatsChange={handleStatsChange} />
          ))}
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-3 pointer-events-auto">
        {/* Floating AI Copilot Bubble (if not on AI tab) */}
        {activeTab !== 'ai-assistant' && (
          <button
            onClick={() => setActiveTab('ai-assistant')}
            className="flex items-center gap-2 h-12 px-5 rounded-full bg-gulf text-champagne text-sm ring-1 ring-champagne/40 shadow-[0_12px_30px_-8px_rgba(7,38,45,0.6)] hover:bg-gulf-deep transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Ask the AI advisor</span>
          </button>
        )}

        {/* Floating WhatsApp Quick Connect */}
        <a
          href="https://wa.me/971508392140?text=Hello%20PropEngine%20UAE%20Specialist,%20I%20am%20reviewing%20properties%20on%20your%20portal%20and%20would%20like%20immediate%20consultation."
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 rounded-full bg-[#1f9d6b] hover:bg-[#188a5d] text-white flex items-center justify-center shadow-[0_12px_30px_-8px_rgba(15,112,80,0.6)] transition-colors"
          title="WhatsApp a specialist"
          aria-label="WhatsApp a specialist"
        >
          <MessageSquare className="w-5 h-5" />
        </a>
      </div>

      {/* Universal Lead Capture Modal */}
      <LeadCaptureModal
        isOpen={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
        defaultTitle={leadModalTitle}
        defaultLocation={leadModalLocation}
        propertyId={leadModalPropertyId}
        leadSource={leadModalSource}
      />

      {/* Compliance-Rich Footer */}
      <Footer onAgentLogin={() => setActiveTab('leads')} />
    </div>
  );
}
