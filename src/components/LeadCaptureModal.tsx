import React, { useEffect, useState } from 'react';
import {
  X,
  ShieldCheck,
  Send,
  PhoneCall,
  CheckCircle2,
  Download,
  Building,
  MapPin,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';
import { ALL_COMMUNITIES } from '../data/marketData';
import { api, ApiError } from '../lib/api';
import { getAttribution } from '../lib/attribution';

interface LeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTitle?: string;
  defaultLocation?: string;
  propertyId?: string;
  leadSource?: string;
  onLeadCaptured?: () => void;
}

export const LeadCaptureModal: React.FC<LeadCaptureModalProps> = ({
  isOpen,
  onClose,
  defaultTitle = 'VIP Project Brochure & Floor Plan Package',
  defaultLocation = 'Downtown Dubai',
  propertyId,
  leadSource = 'Portal VIP Lead Gate',
  onLeadCaptured,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    preferredLocation: defaultLocation,
    budget: 'AED 1.5M – 3.5M',
    transactionType: 'buy_offplan' as 'buy_offplan' | 'buy_ready' | 'rent_annual' | 'rent_shortterm',
    unitType: '1BR or 2BR',
    message: '',
    requestAirportPickup: false,
    requestDldReport: true,
    marketingConsent: false,
    website: '', // honeypot
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fresh form each time the modal opens (keeps contact details the visitor already typed)
  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setErrorMessage('');
      setFormData((f) => ({ ...f, preferredLocation: defaultLocation, message: '', website: '' }));
    }
  }, [isOpen, defaultLocation, defaultTitle]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const extras = [
        formData.requestDldReport && 'Wants DLD/DMT transaction & yield report',
        formData.requestAirportPickup && 'Wants airport pickup & private tour',
      ].filter(Boolean);
      await api.post('/leads', {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        preferredLocation: formData.preferredLocation,
        budget: formData.budget,
        transactionType: formData.transactionType,
        unitType: formData.unitType,
        propertyId,
        propertyTitle: defaultTitle,
        leadSource,
        message: [formData.message, ...extras].filter(Boolean).join('\n') || undefined,
        marketingConsent: formData.marketingConsent,
        website: formData.website,
        ...getAttribution(),
      });

      setIsSuccess(true);
      if (onLeadCaptured) onLeadCaptured();
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(
        err instanceof ApiError ? err.message : 'Connection problem. Please try again or message us on WhatsApp.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0b132b] border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-7">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {isSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>

            <h3 className="text-2xl font-serif font-bold text-white">
              VIP Request Confirmed
            </h3>

            <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              Your dossier for <strong className="text-amber-300">{defaultTitle}</strong> is currently being assembled. Complete floor plans, payment schedules, and DLD reports are being transmitted to:
            </p>

            <div className="bg-slate-900/90 rounded-2xl p-4 text-xs font-mono text-slate-200 border border-slate-800 space-y-1 text-left max-w-sm mx-auto">
              <div>• WhatsApp: <span className="text-amber-300">{formData.phone}</span></div>
              <div>• Email: <span className="text-amber-300">{formData.email}</span></div>
              <div>• Priority Timeframe: <span className="text-emerald-400">Under 15 Minutes</span></div>
            </div>

            <div className="pt-2">
              <a
                href={`https://wa.me/971508392140?text=${encodeURIComponent(
                  `Hello Senior Specialist, I just submitted my VIP request for "${defaultTitle}" under ${formData.name}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all"
              >
                Instant WhatsApp Fast Connect
              </a>
            </div>

            <button
              onClick={onClose}
              className="block mx-auto text-xs text-slate-400 hover:text-slate-200 underline pt-2"
            >
              Return to Search Engine
            </button>
          </div>
        ) : (
          <div>
            {/* Header Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              15-Minute Guaranteed Broker Follow-Up
            </div>

            <h3 className="text-xl sm:text-2xl font-serif font-bold text-white leading-snug">
              Unlock VIP Brochure & Master Floor Plans
            </h3>

            <p className="text-xs text-slate-300 mt-1 mb-5 leading-relaxed">
              To send you the complete project brochure, exact floor plans, and updated availability for <strong className="text-amber-300">{defaultTitle}</strong>, please share your details below.
            </p>

            {errorMessage && (
              <div className="p-3 mb-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jonathan Edwards"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    WhatsApp Number (with country code) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+971 50 123 4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="investor@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Preferred Location
                  </label>
                  <select
                    value={formData.preferredLocation}
                    onChange={(e) => setFormData({ ...formData, preferredLocation: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  >
                    {ALL_COMMUNITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Target Budget Range
                  </label>
                  <select
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Under AED 1,000,000">Under AED 1.0M</option>
                    <option value="AED 1,000,000 – 2,000,000">AED 1.0M – 2.0M</option>
                    <option value="AED 2,000,000 – 5,000,000 (Golden Visa)">AED 2.0M – 5.0M (Golden Visa)</option>
                    <option value="AED 5,000,000 – 10,000,000">AED 5.0M – 10.0M</option>
                    <option value="AED 10,000,000+ (Ultra Luxury)">AED 10.0M+ (Ultra Luxury)</option>
                  </select>
                </div>
              </div>

              {/* Special deliverable checkboxes */}
              <div className="pt-2 border-t border-slate-800 space-y-1.5 text-[11px] text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requestDldReport}
                    onChange={(e) => setFormData({ ...formData, requestDldReport: e.target.checked })}
                    className="accent-amber-500 rounded"
                  />
                  <span>Include Official DLD/DMT Historical Transaction & Yield Audit</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requestAirportPickup}
                    onChange={(e) => setFormData({ ...formData, requestAirportPickup: e.target.checked })}
                    className="accent-amber-500 rounded"
                  />
                  <span>VIP Chauffeured Airport Pickup & Private Property Tour ( complimentary )</span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer text-slate-400">
                  <input
                    type="checkbox"
                    checked={formData.marketingConsent}
                    onChange={(e) => setFormData({ ...formData, marketingConsent: e.target.checked })}
                    className="accent-amber-500 rounded mt-0.5"
                  />
                  <span>Send me new launches and market updates by email and WhatsApp. You can opt out anytime.</span>
                </label>
              </div>

              {/* Honeypot: hidden from people, filled by bots */}
              <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
                <label>
                  Website
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-101"
                >
                  {isSubmitting ? (
                    <span>Dispatched to Specialist Queue...</span>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Transmit Request to Senior Specialist</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 pt-1">
                <Lock className="w-3 h-3 text-slate-500" />
                <span>Your details are used only to respond to this inquiry · RERA Licensed Brokerage</span>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
