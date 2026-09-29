import React, { useState, useMemo, useEffect } from 'react';
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
import { PROPERTIES_DATABASE, Property } from './data/marketData';
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

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'browse' | 'benchmarks' | 'ai-assistant' | 'calculator' | 'developers' | 'leads'
  >('browse');

  const [currency, setCurrency] = useState<'AED' | 'USD'>('AED');
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [leadModalTitle, setLeadModalTitle] = useState('VIP Allocation & Floor Plan Package');
  const [leadModalLocation, setLeadModalLocation] = useState('Downtown Dubai');
  const [leadCount, setLeadCount] = useState(3);
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
  }, [filters]);

  // Handler for opening lead modal with bespoke property title
  const handleOpenLeadModal = (title?: string, location?: string) => {
    setLeadModalTitle(title || 'VIP Project Brochure & Floor Plan Package');
    if (location) setLeadModalLocation(location);
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

  // Fetch initial leads count from API
  useEffect(() => {
    fetch('/api/leads')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.leads) {
          setLeadCount(data.leads.length);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col font-sans selection:bg-amber-400/30 selection:text-amber-200">
      {/* Universal Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currency={currency}
        setCurrency={setCurrency}
        onOpenLeadModal={handleOpenLeadModal}
        leadCount={leadCount}
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                      Curated Investment & Rental Inventory
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40">
                      {filteredProperties.length} Properties
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Direct developer allocations with transparent DLD/DMT closing fees and verified net yields.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('benchmarks')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    Live Rent Benchmarks
                  </button>
                  <button
                    onClick={() => handleOpenLeadModal('Full Dubai & Abu Dhabi Off-Market Unit List')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Off-Market Allocation List
                  </button>
                </div>
              </div>

              {/* Grid of Properties */}
              {filteredProperties.length === 0 ? (
                <div className="bg-[#0b132b] border border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                    <Compass className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-white">
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
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs rounded-xl font-bold shadow-md"
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
                        handleOpenLeadModal(`Brochure & Floorplans for ${p.title} (${p.developer})`, p.community)
                      }
                      onOpenCalculator={handleOpenCalculator}
                      onAskAi={handleAskAi}
                    />
                  ))}
                </div>
              )}

              {/* Conversion Lead Magnet Banner */}
              <div className="mt-16 bg-gradient-to-r from-[#101b3b] via-[#0b132b] to-[#101b3b] border border-amber-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-3xl relative z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-3">
                    <Award className="w-3.5 h-3.5" />
                    VIP Institutional Client Privileges
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-serif font-extrabold text-white leading-tight">
                    Access Off-Market Pre-Launch Allocations Before Public Release
                  </h3>
                  <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Gain direct access to developer inventory sheets, bulk purchase discounts, private floor plan allocations, and chauffeured airport pickups for international investors.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleOpenLeadModal('VIP Pre-Launch Allocation Pass')}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 font-bold text-xs sm:text-sm shadow-xl shadow-amber-500/25 hover:scale-102 transition-all flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Request Pre-Launch Allocation Pack</span>
                    </button>

                    <a
                      href="https://wa.me/971508392140?text=Hello%20PropEngine%20Specialist,%20I%20would%20like%20to%20receive%20the%20pre-launch%20off-market%20allocation%20pack%20for%20Dubai%20and%20Abu%20Dhabi."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-semibold text-xs sm:text-sm transition-all flex items-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>WhatsApp Direct Specialist</span>
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

        {/* Agency CRM Leads Inbox Tab */}
        {activeTab === 'leads' && <BrokerLeadsInbox />}
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-3 pointer-events-auto">
        {/* Floating AI Copilot Bubble (if not on AI tab) */}
        {activeTab !== 'ai-assistant' && (
          <button
            onClick={() => setActiveTab('ai-assistant')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs shadow-2xl shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all group"
          >
            <Sparkles className="w-4 h-4 animate-spin-slow" />
            <span className="hidden sm:inline">Ask PropEngine AI</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          </button>
        )}

        {/* Floating WhatsApp Quick Connect */}
        <a
          href="https://wa.me/971508392140?text=Hello%20PropEngine%20UAE%20Specialist,%20I%20am%20reviewing%20properties%20on%20your%20portal%20and%20would%20like%20immediate%20consultation."
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-2xl shadow-emerald-500/40 hover:scale-110 active:scale-95 transition-all"
          title="Connect with Senior Specialist on WhatsApp"
        >
          <MessageSquare className="w-6 h-6 fill-current" />
        </a>
      </div>

      {/* Universal Lead Capture Modal */}
      <LeadCaptureModal
        isOpen={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
        defaultTitle={leadModalTitle}
        defaultLocation={leadModalLocation}
        onLeadCaptured={() => setLeadCount((c) => c + 1)}
      />

      {/* Compliance-Rich Footer */}
      <Footer />
    </div>
  );
}
