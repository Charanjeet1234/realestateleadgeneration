import React, { useState } from 'react';
import {
  Building2,
  Award,
  CheckCircle2,
  Download,
  Sparkles,
  ExternalLink,
  Layers,
  Calendar,
  Percent,
} from 'lucide-react';
import { useMarketData } from '../lib/context';
import {
  DeveloperInfo,
  DUBAI_DEVELOPERS,
  ABU_DHABI_DEVELOPERS,
} from '../data/marketData';

interface DeveloperDirectoryProps {
  onSelectDeveloper: (developerName: string) => void;
  onOpenLeadModal: (title?: string) => void;
  onAskAi: (prompt: string) => void;
}

export const DeveloperDirectory: React.FC<DeveloperDirectoryProps> = ({
  onSelectDeveloper,
  onOpenLeadModal,
  onAskAi,
}) => {
  const { developers: DEVELOPERS_DATABASE } = useMarketData();
  const [activeEmirate, setActiveEmirate] = useState<'ALL' | 'Dubai' | 'Abu Dhabi'>('ALL');

  const filteredDevelopers = DEVELOPERS_DATABASE.filter(
    (dev) => activeEmirate === 'ALL' || dev.emirate === activeEmirate
  );

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5" />
            Institutional UAE Master Developer Index
          </div>
          <h2 className="text-2xl sm:text-4xl font-serif font-medium text-slate-50 tracking-tight">
            Developer Track Records & Payment Structures
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Vetted master developers across Dubai and Abu Dhabi. Compare delivery punctuality, signature portfolio landmarks, and standard off-plan installment milestones.
          </p>
        </div>

        <button
          onClick={() => onOpenLeadModal('Off-Market Master Developer Inventory & Allocation Sheet')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-onyx text-xs font-bold shadow-lg shadow-amber-500/20 hover:scale-102 transition-all self-start md:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          Request Exclusive Allocation Sheets
        </button>
      </div>

      {/* Emirate Switch */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setActiveEmirate('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            activeEmirate === 'ALL'
              ? 'bg-amber-500 text-onyx font-bold'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-50'
          }`}
        >
          All Key Developers ({DEVELOPERS_DATABASE.length})
        </button>
        <button
          onClick={() => setActiveEmirate('Dubai')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            activeEmirate === 'Dubai'
              ? 'bg-amber-500 text-onyx font-bold'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-50'
          }`}
        >
          Dubai Flagships ({DUBAI_DEVELOPERS.length})
        </button>
        <button
          onClick={() => setActiveEmirate('Abu Dhabi')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            activeEmirate === 'Abu Dhabi'
              ? 'bg-amber-500 text-onyx font-bold'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-50'
          }`}
        >
          Abu Dhabi Sovereign Leaders ({ABU_DHABI_DEVELOPERS.length})
        </button>
      </div>

      {/* Developer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredDevelopers.map((dev) => (
          <div
            key={dev.name}
            className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 shadow-xl transition-all duration-300 flex flex-col justify-between group"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-yellow-400/20 border border-amber-500/30 flex items-center justify-center font-serif font-black text-amber-400 text-sm">
                  {dev.logoInitial}
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
                  {dev.emirate}
                </span>
              </div>

              <h3 className="text-lg font-serif font-semibold text-slate-50 group-hover:text-amber-300 transition-colors">
                {dev.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 line-clamp-3 leading-relaxed">
                {dev.reputationSummary}
              </p>

              {/* Delivery & Stats */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                    Delivery Track Record
                  </span>
                  <span className="font-bold text-emerald-400 text-sm">
                    {dev.onTimeDeliveryRate}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                    Completed / Active
                  </span>
                  <span className="font-bold text-slate-200 text-sm">
                    {dev.completedProjects} / {dev.activeProjects}
                  </span>
                </div>
              </div>

              {/* Standard Payment Plan */}
              <div className="mt-3 p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px]">
                <span className="text-amber-400 font-semibold block mb-0.5">
                  Standard Payment Horizon:
                </span>
                <span className="text-slate-300 leading-snug block">
                  {dev.standardPaymentPlan}
                </span>
              </div>

              {/* Signature Projects */}
              <div className="mt-3">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block mb-1">
                  Signature Portfolio:
                </span>
                <div className="flex flex-wrap gap-1">
                  {dev.signatureMasterpieces.slice(0, 3).map((p, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 bg-slate-800/80 text-slate-300 rounded-md border border-slate-700/60"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-5 pt-3 border-t border-slate-800 space-y-2">
              <button
                onClick={() => onSelectDeveloper(dev.name)}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-onyx text-slate-200 text-xs font-bold transition-all text-center"
              >
                View Available Listings
              </button>

              <button
                onClick={() =>
                  onAskAi(
                    `Analyze developer track record and upcoming off-plan investment launches for ${dev.name} in ${dev.emirate}. What is their average capital appreciation and payment plan flexibility?`
                  )
                }
                className="w-full py-1.5 text-center text-amber-400 hover:text-amber-300 text-[11px] font-medium transition-colors flex items-center justify-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Ask AI Analysis on {dev.name}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
