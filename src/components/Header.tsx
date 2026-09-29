import React from 'react';
import { Building2, Sparkles, PhoneCall, ShieldCheck, Compass, Users, Calculator, MessageSquare, Settings, LogOut } from 'lucide-react';
import type { AppTab } from '../App';
import type { SessionUser } from '../lib/api';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  currency: 'AED' | 'USD';
  setCurrency: (c: 'AED' | 'USD') => void;
  onOpenLeadModal: (title?: string) => void;
  leadCount: number;
  user: SessionUser | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currency,
  setCurrency,
  onOpenLeadModal,
  leadCount,
  user,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#080d1a]/95 backdrop-blur-md border-b border-amber-500/20 shadow-xl">
      {/* Top Compliance & Ticker Bar */}
      <div className="bg-gradient-to-r from-[#0b132b] via-[#101b3b] to-[#0b132b] border-b border-slate-800/80 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-slate-300">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              RERA Dubai & ADREC Abu Dhabi Licensed
            </span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:inline text-slate-400">
              Government Mandate: 4% DLD + AED 4,200 (Dubai) · 2% DMT (Abu Dhabi)
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-amber-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Market Average Yield: <strong>7.4% Net</strong>
            </span>
            <div className="flex items-center border border-slate-700 rounded-md overflow-hidden bg-slate-900/80 text-[11px]">
              <button
                onClick={() => setCurrency('AED')}
                className={`px-2 py-0.5 font-bold transition-colors ${
                  currency === 'AED' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                AED
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`px-2 py-0.5 font-bold transition-colors ${
                  currency === 'USD' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                USD
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Brand */}
        <div
          onClick={() => setActiveTab('browse')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-300 p-0.5 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#080d1a] rounded-[10px] flex items-center justify-center">
              <Building2 className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif tracking-wider font-extrabold text-lg text-white group-hover:text-amber-300 transition-colors">
                PROPENGINE
              </span>
              <span className="text-[10px] font-bold tracking-widest bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 px-1.5 py-0.5 rounded uppercase">
                UAE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wider uppercase font-medium">
              Dubai & Abu Dhabi Prime Engine
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-900/60 border border-slate-800/80 p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'browse'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Property Discovery
          </button>

          <button
            onClick={() => setActiveTab('benchmarks')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'benchmarks'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Live Rent Benchmarks
          </button>

          <button
            onClick={() => setActiveTab('ai-assistant')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 relative ${
              activeTab === 'ai-assistant'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold shadow-md'
                : 'text-amber-300 hover:bg-amber-500/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
            AI Sales Assistant
            <span className="absolute -top-1.5 -right-1.5 px-1 py-0.2 bg-emerald-500 text-[9px] text-slate-950 font-bold rounded-full">
              LIVE
            </span>
          </button>

          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'calculator'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            DLD Closing Fees
          </button>

          <button
            onClick={() => setActiveTab('developers')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'developers'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Developers
          </button>

{user && (
          <>
          <button
            onClick={() => setActiveTab('leads')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'leads'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            CRM
            {leadCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-400/20 text-amber-300 border border-amber-400/40 rounded-full text-[10px] font-bold">
                {leadCount}
              </span>
            )}
          </button>
          {user.role === 'ADMIN' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Admin
            </button>
          )}
          </>
          )}
        </nav>

        {/* Action CTAs */}
        <div className="flex items-center gap-2.5">
          {user && (
            <button
              onClick={onLogout}
              title={`Signed in as ${user.name} — sign out`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign out</span>
            </button>
          )}
          <a
            href="https://wa.me/971508392140?text=Hello%20PropEngine%20UAE%20Specialist,%20I%20would%20like%20to%20inquire%20about%20off-market%20properties%20and%20investment%20brochures."
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition-all hover:scale-102"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            WhatsApp VIP
          </a>

          <button
            onClick={() => onOpenLeadModal('VIP Off-Market Allocation Request')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all hover:scale-102 active:scale-98"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Agent VIP Callback</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Scrollbar */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto px-4 py-2 border-t border-slate-800/60 no-scrollbar text-xs">
        <button
          onClick={() => setActiveTab('browse')}
          className={`whitespace-nowrap px-3 py-1.5 rounded-lg ${
            activeTab === 'browse' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 bg-slate-900/60'
          }`}
        >
          Properties
        </button>
        <button
          onClick={() => setActiveTab('benchmarks')}
          className={`whitespace-nowrap px-3 py-1.5 rounded-lg ${
            activeTab === 'benchmarks' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 bg-slate-900/60'
          }`}
        >
          Rent Benchmarks
        </button>
        <button
          onClick={() => setActiveTab('ai-assistant')}
          className={`whitespace-nowrap px-3 py-1.5 rounded-lg flex items-center gap-1 ${
            activeTab === 'ai-assistant' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-amber-300 bg-amber-500/10'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          AI Copilot
        </button>
        <button
          onClick={() => setActiveTab('calculator')}
          className={`whitespace-nowrap px-3 py-1.5 rounded-lg ${
            activeTab === 'calculator' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 bg-slate-900/60'
          }`}
        >
          DLD Fees
        </button>
        <button
          onClick={() => setActiveTab('developers')}
          className={`whitespace-nowrap px-3 py-1.5 rounded-lg ${
            activeTab === 'developers' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 bg-slate-900/60'
          }`}
        >
          Developers
        </button>
{user && (
          <>
        <button
          onClick={() => setActiveTab('leads')}
          className={`whitespace-nowrap px-3 py-1.5 rounded-lg ${
            activeTab === 'leads' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 bg-slate-900/60'
          }`}
        >
          Leads ({leadCount})
        </button>
            {user.role === 'ADMIN' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg ${
                  activeTab === 'admin' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 bg-slate-900/60'
                }`}
              >
                Admin
              </button>
            )}
          </>
        )}
      </div>
    </header>
  );
};
