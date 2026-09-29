import React from 'react';
import { Calculator, MessageSquare, Sparkles, MapPin, ArrowUpRight } from 'lucide-react';
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
  const price =
    currency === 'AED' ? property.priceRangeFormatted : `USD ${property.priceUSD.toLocaleString()}${isRent ? ' / year' : ''}`;
  const fees = property.dldCosts.registrationFeeAED + property.dldCosts.adminFeeAED;

  const waMessage = encodeURIComponent(
    `Hello PropEngine UAE, I am interested in "${property.title}" in ${property.community} (${property.developer}). Please send the floor plans, payment schedule and current availability.`,
  );

  const facts: [string, string][] = [
    [isRent ? 'Rent' : 'From', price],
    ['Net yield', `${property.projectedROI}%`],
    isRent
      ? ['Cheques', property.rentalFactors?.chequesAccepted ?? '1–4']
      : ['Handover', property.handoverDate?.replace(/\s*\/.*$/, '') ?? 'Ready'],
  ];

  return (
    <article className="group flex flex-col bg-slate-900 rounded-[22px] overflow-hidden border border-slate-800 hover:border-slate-700 hover:shadow-[0_24px_60px_-28px_rgba(23,20,15,0.35)] transition-[box-shadow,border-color] duration-300">
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gulf">
        <img
          src={property.imageUrl}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gulf/60 via-transparent to-transparent" aria-hidden="true" />
        <div className="absolute top-4 left-4 flex flex-wrap gap-1.5">
          <span className="px-3 py-1 rounded-full bg-alabaster/90 backdrop-blur text-onyx text-[12px]">{property.category}</span>
          {property.goldenVisaEligible && (
            <span className="px-3 py-1 rounded-full bg-champagne/95 text-onyx text-[12px]">Golden Visa</span>
          )}
        </div>
        <span className="absolute bottom-4 left-4 text-[12px] text-alabaster/90">{property.developer}</span>
      </div>

      {/* Details */}
      <div className="flex-1 flex flex-col p-6">
        <p className="flex items-center gap-1.5 text-slate-400 text-[13px]">
          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">
            {property.community}, {property.emirate}
          </span>
        </p>
        <h3 className="mt-2 text-[1.6rem] leading-tight font-serif font-normal text-slate-50">{property.title}</h3>
        <p className="mt-2 text-sm text-slate-400 leading-relaxed line-clamp-2">{property.tagline}</p>

        {/* Key facts */}
        <dl className="mt-5 grid grid-cols-[1.6fr_1fr_1fr] border-y border-slate-800 divide-x divide-slate-800">
          {facts.map(([k, v], i) => (
            <div key={k} className={`py-3 ${i === 0 ? 'pr-3' : 'px-3'}`}>
              <dt className="text-[12px] text-slate-400">{k}</dt>
              <dd className={`mt-0.5 text-slate-50 text-[15px] ${i === 0 ? 'font-medium whitespace-nowrap' : ''}`}>{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 space-y-1.5 text-[13px] text-slate-400">
          {isRent ? (
            <p>
              Deposit {property.rentalFactors?.securityDeposit}, service charge {property.rentalFactors?.estimatedServiceCharge}
            </p>
          ) : (
            property.paymentPlan && (
              <p>
                <span className="text-slate-200">{property.paymentPlan.summary}</span>, {property.paymentPlan.downPayment.toLowerCase()}
              </p>
            )
          )}
          <p>
            {property.emirate === 'Dubai' ? 'DLD 4% + admin' : 'DMT 2% registration'}:{' '}
            <span className="text-slate-200">AED {fees.toLocaleString()}</span>
          </p>
        </div>

        {/* Actions */}
        <div className="mt-auto pt-6 flex items-center gap-2">
          <button
            onClick={() => onOpenBrochureModal(property)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-full bg-gulf hover:bg-gulf-deep text-champagne text-sm transition-colors"
          >
            Request floor plans
            <ArrowUpRight className="w-4 h-4" />
          </button>
          <a
            href={`https://wa.me/971508392140?text=${waMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-slate-700 text-emerald-400 hover:border-emerald-400 transition-colors"
            title="WhatsApp about this property"
            aria-label={`WhatsApp about ${property.title}`}
          >
            <MessageSquare className="w-4 h-4" />
          </a>
        </div>
        <div className="mt-3 flex items-center justify-between text-[13px]">
          <button onClick={() => onOpenCalculator(property)} className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-50 transition-colors">
            <Calculator className="w-3.5 h-3.5" />
            Total buying costs
          </button>
          <button
            onClick={() =>
              onAskAi(
                `Analyze the investment potential, payment schedule, and rental yield comparison for ${property.title} by ${property.developer} in ${property.community}.`,
              )
            }
            className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Ask the AI advisor
          </button>
        </div>
      </div>
    </article>
  );
};
