import React from 'react';
import { ShieldCheck, MapPin, Phone, Mail, Award, Lock } from 'lucide-react';
import { COMPLIANCE_DISCLAIMER } from '../utils/complianceCalculator';

export const Footer: React.FC<{ onAgentLogin?: () => void }> = ({ onAgentLogin }) => {
  return (
    <footer className="theme-dark bg-slate-950 text-slate-400 text-sm">
      <div className="brass-rule opacity-60" />
      {/* Upper Footer: Regulatory Badges & Office Locations */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand & Mandate */}
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-[28px] leading-none text-slate-50">PropEngine</span>
              <span className="text-[11px] tracking-[0.18em] text-champagne/80">UAE</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Residences, off-plan launches and rentals across Dubai and Abu Dhabi, from a RERA-registered brokerage.
            </p>
            <div className="pt-1 flex items-center gap-2 text-emerald-400 font-semibold text-[11px]">
              <ShieldCheck className="w-4 h-4" />
              <span>RERA Registered Office #28914</span>
            </div>
          </div>

          {/* Mandatory Fees Summary */}
          <div>
            <h4 className="font-serif text-lg text-champagne mb-4">
              Government fees
            </h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>• <strong>Dubai Purchase:</strong> 4% DLD Fee + AED 4,200 Admin Fee</li>
              <li>• <strong>Abu Dhabi Purchase:</strong> 2% DMT Registration Fee</li>
              <li>• <strong>Off-Plan Safeguard:</strong> Oqood Registration (DLD Escrow)</li>
              <li>• <strong>Statutory Agency Fee:</strong> 2% + 5% VAT (Purchase)</li>
              <li>• <strong>Annual Rental Fee:</strong> 5% + 5% VAT (Lease)</li>
            </ul>
          </div>

          {/* Prime Offices */}
          <div>
            <h4 className="font-serif text-lg text-champagne mb-4">
              Offices
            </h4>
            <div className="space-y-3 text-sm">
              <div>
                <strong className="text-slate-50 block flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" /> Dubai Flagship:
                </strong>
                <span>Level 24, Emaar Square Building 4, Downtown Dubai, UAE</span>
              </div>
              <div>
                <strong className="text-slate-50 block flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" /> Abu Dhabi Suite:
                </strong>
                <span>Saadiyat Cultural District, Al Saadiyat Island, Abu Dhabi, UAE</span>
              </div>
            </div>
          </div>

          {/* Contact & VIP SLA */}
          <div>
            <h4 className="font-serif text-lg text-champagne mb-4">
              Speak to a specialist
            </h4>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2 text-slate-200">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>+971 4 800 PROP (Toll Free)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>vip.advisory@propengine.ae</span>
              </div>
              <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 text-[11px] text-amber-300 mt-2">
                A specialist calls back within 15 minutes during office hours.
              </div>
            </div>
          </div>
        </div>

        {/* Regulatory Disclaimer */}
        <div className="pt-6 border-t border-slate-800/80 space-y-2">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            <strong className="text-slate-400">Legal & Regulatory Disclosures:</strong> {COMPLIANCE_DISCLAIMER} All transactions are conducted through official escrow accounts certified by the Dubai Land Department (DLD) or the Abu Dhabi Department of Municipalities and Transport (DMT).
          </p>
          <div className="flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-500 pt-2">
            <div>
              © {new Date().getFullYear()} PropEngine UAE. All rights reserved. RERA Brokerage License #28914.
            </div>
            <div className="flex gap-4">
              <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
              <span>·</span>
              <span className="hover:text-slate-300 cursor-pointer">Privacy & DLD Protection</span>
              <span>·</span>
              <span className="hover:text-slate-300 cursor-pointer">AML Compliance</span>
              {onAgentLogin && (
                <>
                  <span>·</span>
                  <button onClick={onAgentLogin} className="hover:text-slate-300">
                    Agent login
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
