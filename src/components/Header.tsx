import React from 'react';
import { MessageSquare, LogOut, Sparkles } from 'lucide-react';
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

const WHATSAPP_URL =
  'https://wa.me/971508392140?text=Hello%20PropEngine%20UAE%20Specialist,%20I%20would%20like%20to%20inquire%20about%20properties.';

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
  type NavTab = { id: AppTab; label: string; short: string; badge?: number };
  const publicTabs: NavTab[] = [
    { id: 'browse', label: 'Residences', short: 'Residences' },
    { id: 'benchmarks', label: 'Rent & yields', short: 'Yields' },
    { id: 'ai-assistant', label: 'AI advisor', short: 'AI advisor' },
    { id: 'calculator', label: 'Buying costs', short: 'Costs' },
    { id: 'developers', label: 'Developers', short: 'Developers' },
  ];
  const staffTabs: NavTab[] = user
    ? [
        { id: 'leads', label: 'CRM', short: 'CRM', badge: leadCount },
        ...(user.role === 'ADMIN' ? [{ id: 'admin' as AppTab, label: 'Admin', short: 'Admin' }] : []),
      ]
    : [];
  const tabs = [...publicTabs, ...staffTabs];

  return (
    <header className="theme-dark sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      {/* Regulatory strip */}
      <div className="border-b border-slate-800/70 text-[12px] text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center justify-between gap-4">
          <span className="truncate">
            RERA &amp; ADREC licensed <span className="hidden md:inline text-slate-600 mx-2">|</span>
            <span className="hidden md:inline">Dubai: DLD 4% + AED 4,200 <span className="text-slate-600 mx-2">|</span> Abu Dhabi: DMT 2%</span>
          </span>
          <div className="flex items-center gap-1" role="group" aria-label="Currency">
            {(['AED', 'USD'] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                aria-pressed={currency === c}
                className={`px-2 py-0.5 rounded-full transition-colors ${
                  currency === c ? 'bg-champagne text-onyx font-medium' : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[68px] flex items-center justify-between gap-6">
        {/* Wordmark */}
        <button onClick={() => setActiveTab('browse')} className="flex items-baseline gap-2 shrink-0 group" aria-label="PropEngine home">
          <span className="font-serif text-[26px] leading-none tracking-[-0.01em] text-slate-50 group-hover:text-champagne transition-colors">
            PropEngine
          </span>
          <span className="text-[11px] tracking-[0.18em] text-champagne/80">UAE</span>
        </button>

        {/* Desktop navigation */}
        <nav className="hidden lg:flex items-center gap-7 text-[14px]" aria-label="Main">
          {tabs.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                aria-current={active ? 'page' : undefined}
                className={`relative py-2 flex items-center gap-1.5 transition-colors ${
                  active ? 'text-slate-50' : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {t.id === 'ai-assistant' && <Sparkles className="w-3.5 h-3.5 text-champagne" />}
                {t.label}
                {t.badge ? (
                  <span className="ml-0.5 px-1.5 rounded-full bg-champagne/15 text-champagne text-[11px]">{t.badge}</span>
                ) : null}
                <span
                  className={`absolute left-0 right-0 -bottom-[3px] h-px bg-champagne transition-transform origin-left ${
                    active ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </button>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {user && (
            <button
              onClick={onLogout}
              title={`Signed in as ${user.name}. Sign out`}
              className="inline-flex items-center gap-1.5 h-10 px-3 rounded-full text-slate-300 hover:text-slate-50 hover:bg-slate-800 text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden xl:inline">Sign out</span>
            </button>
          )}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center justify-center w-10 h-10 rounded-full border border-slate-700 text-emerald-300 hover:border-emerald-400 transition-colors"
            title="WhatsApp a specialist"
            aria-label="WhatsApp a specialist"
          >
            <MessageSquare className="w-4 h-4" />
          </a>
          <button
            onClick={() => onOpenLeadModal('Callback request')}
            className="h-10 px-5 rounded-full bg-champagne hover:bg-amber-200 text-onyx text-sm font-medium transition-colors whitespace-nowrap"
          >
            Request a callback
          </button>
        </div>
      </div>

      {/* Mobile navigation */}
      <nav className="lg:hidden flex items-center gap-5 overflow-x-auto px-4 h-11 border-t border-slate-800/70 no-scrollbar text-[13px]" aria-label="Main">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            aria-current={activeTab === t.id ? 'page' : undefined}
            className={`whitespace-nowrap py-1 border-b transition-colors ${
              activeTab === t.id ? 'text-slate-50 border-champagne' : 'text-slate-400 border-transparent'
            }`}
          >
            {t.short}
            {t.badge ? ` (${t.badge})` : ''}
          </button>
        ))}
      </nav>
    </header>
  );
};
