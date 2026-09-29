import React from 'react';
import {
  Building2,
  Calendar,
  Percent,
  Download,
  Calculator,
  MessageSquare,
  Sparkles,
  MapPin,
  CheckCircle,
  CreditCard,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import { Property } from '../data/marketData';

interface PropertyCardProps {
  property: Property;
  currency: 'AED' | 'USD';
  onOpenBrochureModal: (property: Property) => void;
  onOpenCalculator: (property: Property) => void;
  onAskAi: (prompt: string) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  currency,
  onOpenBrochureModal,
  onOpenCalculator,
  onAskAi,
}) => {
  const isRent = property.category === 'Annual Rent' || property.category === 'Short-Term Holiday';
  const displayPrice =
    currency === 'AED'
      ? property.priceRangeFormatted
      : `$${(property.priceUSD).toLocaleString()} USD`;

  // WhatsApp quick text
  const waMessage = encodeURIComponent(
    `Hello PropEngine UAE Specialist, I am interested in "${property.title}" in ${property.community} (${property.developer}). Please send me the updated floor plans, payment schedule, and current unit availability.`
  );

  return (
    <div className="group bg-gradient-to-b from-[#0f172a] to-[#0b132b] rounded-2xl border border-slate-800 hover:border-amber-500/50 shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Property Image & Overlays */}
      <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-slate-900">
        <img
          src={property.imageUrl}
          alt={property.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b132b] via-transparent to-black/40" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase shadow-md ${
                property.category === 'Off-Plan'
                  ? 'bg-amber-500 text-slate-950'
                  : property.category === 'Annual Rent'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {property.category}
            </span>
            <span className="px-2 py-1 rounded-md text-[11px] font-semibold bg-slate-900/80 backdrop-blur-md text-amber-300 border border-slate-700">
              {property.emirate}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {property.goldenVisaEligible && (
              <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-amber-400/90 text-slate-950 border border-amber-300 backdrop-blur-md">
                10-Yr Golden Visa
              </span>
            )}
            <span className="px-2 py-1 rounded-md text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md flex items-center gap-1">
              <Percent className="w-3 h-3" />
              {property.projectedROI}% Net ROI
            </span>
          </div>
        </div>

        {/* Bottom Banner inside Image: Handover / Rental Key */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-200 bg-slate-950/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5">
            {isRent ? (
              <>
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                <span>{property.rentalFactors?.chequesAccepted || '1–4 Cheques'}</span>
              </>
            ) : (
              <>
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Handover: <strong>{property.handoverDate}</strong></span>
              </>
            )}
          </div>
          <span className="text-[11px] text-amber-300 font-medium">
            {property.developer}
          </span>
        </div>
      </div>

      {/* Property Details */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Location & Title */}
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{property.community}, {property.emirate}</span>
          </div>
          <h3 className="text-lg font-serif font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
            {property.title}
          </h3>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {property.tagline}
          </p>

          {/* Price & Unit Types */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-baseline justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                {isRent ? 'Annual Rental Price' : 'Price Starting From'}
              </span>
              <span className="text-xl font-extrabold text-amber-400 tracking-tight font-sans">
                {displayPrice}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                Configurations
              </span>
              <span className="text-xs font-medium text-slate-300">
                {property.unitTypes.join(' · ')}
              </span>
            </div>
          </div>

          {/* Payment Plan or Rental Breakdown */}
          <div className="mt-3 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
            {isRent ? (
              <div className="space-y-1 text-slate-300">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Security Deposit:</span>
                  <span className="font-semibold text-slate-200">{property.rentalFactors?.securityDeposit}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Service Charges:</span>
                  <span className="font-semibold text-emerald-400">{property.rentalFactors?.estimatedServiceCharge}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Agency Brokerage:</span>
                  <span className="font-semibold text-slate-200">5% + 5% VAT (Mandated)</span>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-1 text-amber-300 font-semibold text-[11px] mb-1">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Payment Plan: {property.paymentPlan?.summary}</span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-400 mt-1.5 pt-1.5 border-t border-slate-800 text-center">
                  <div>
                    <span className="block text-slate-500">Booking</span>
                    <strong className="text-slate-200">{property.paymentPlan?.downPayment}</strong>
                  </div>
                  <div>
                    <span className="block text-slate-500">Construction</span>
                    <strong className="text-slate-200">{property.paymentPlan?.duringConstruction}</strong>
                  </div>
                  <div>
                    <span className="block text-slate-500">On Handover</span>
                    <strong className="text-slate-200">{property.paymentPlan?.onHandover}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Government Mandate Preview */}
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/40 px-2.5 py-1.5 rounded-lg border border-slate-800/60">
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldAlert className="w-3 h-3 text-amber-500" />
              {property.emirate === 'Dubai' ? 'DLD (4%) + Admin:' : 'DMT (2%) Registration:'}
            </span>
            <span className="font-mono text-slate-300 font-semibold">
              AED {(property.dldCosts.registrationFeeAED + property.dldCosts.adminFeeAED).toLocaleString()}
            </span>
          </div>

          {/* Project Highlights Pill */}
          <div className="mt-2.5 flex flex-wrap gap-1">
            {property.highlights.slice(0, 2).map((h, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/50"
              >
                ✓ {h}
              </span>
            ))}
          </div>
        </div>

        {/* Lead Capture Action Buttons */}
        <div className="mt-5 space-y-2 pt-3 border-t border-slate-800">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onOpenBrochureModal(property)}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/10 transition-all hover:scale-101"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Brochure & Floorplans</span>
            </button>

            <a
              href={`https://wa.me/971508392140?text=${waMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition-all hover:scale-101"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Agent</span>
            </a>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 px-1">
            <button
              onClick={() => onOpenCalculator(property)}
              className="text-slate-400 hover:text-amber-300 transition-colors flex items-center gap-1 text-[11px]"
            >
              <Calculator className="w-3 h-3" />
              Full DLD/DMT Closing Costs
            </button>

            <button
              onClick={() =>
                onAskAi(
                  `Analyze the investment potential, payment schedule, and rental yield comparison for ${property.title} by ${property.developer} in ${property.community}.`
                )
              }
              className="text-amber-400/90 hover:text-amber-300 transition-colors flex items-center gap-1 text-[11px] font-medium"
            >
              <Sparkles className="w-3 h-3" />
              Ask AI Yield Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
