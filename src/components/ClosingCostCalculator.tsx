import React, { useState } from 'react';
import {
  Calculator,
  ShieldCheck,
  Building,
  CheckCircle,
  Download,
  AlertTriangle,
  Info,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import {
  calculatePurchaseClosingCosts,
  calculateRentalMoveInCosts,
  COMPLIANCE_DISCLAIMER,
} from '../utils/complianceCalculator';

interface ClosingCostCalculatorProps {
  initialPrice?: number;
  initialEmirate?: 'Dubai' | 'Abu Dhabi';
  onOpenLeadModal: (title?: string) => void;
}

export const ClosingCostCalculator: React.FC<ClosingCostCalculatorProps> = ({
  initialPrice = 2500000,
  initialEmirate = 'Dubai',
  onOpenLeadModal,
}) => {
  const [mode, setMode] = useState<'buy' | 'rent'>('buy');
  const [emirate, setEmirate] = useState<'Dubai' | 'Abu Dhabi'>(initialEmirate);
  const [isOffPlan, setIsOffPlan] = useState<boolean>(true);
  const [priceAED, setPriceAED] = useState<number>(initialPrice);
  const [rentAED, setRentAED] = useState<number>(120000);
  const [isFurnished, setIsFurnished] = useState<boolean>(false);
  const [includeMortgage, setIncludeMortgage] = useState<boolean>(false);

  // Calculation
  const purchaseCosts = calculatePurchaseClosingCosts(priceAED, emirate, isOffPlan);
  const rentalCosts = calculateRentalMoveInCosts(rentAED, isFurnished);

  // Mortgage metrics (standard UAE Central Bank rule: 20% down for expats under 5M, 0.25% mortgage registration + AED 290)
  const mortgageDownpayment = priceAED * 0.20;
  const loanAmount = priceAED * 0.80;
  const mortgageRegistrationFee = includeMortgage ? loanAmount * 0.0025 + 290 : 0;
  const bankValuationFee = includeMortgage ? 3150 : 0;

  const totalBuyOutlayWithMortgage =
    mortgageDownpayment +
    purchaseCosts.totalClosingCosts +
    mortgageRegistrationFee +
    bankValuationFee;

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
          <Calculator className="w-3.5 h-3.5" />
          RERA & ADREC Regulatory Fee Engine
        </div>
        <h2 className="text-2xl sm:text-4xl font-serif font-medium text-slate-50">
          UAE Government & Closing Fee Breakdown
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-400">
          Transparent calculations for Dubai Land Department (DLD), Abu Dhabi DMT, mandatory Oqood, trustee charges, and statutory agency fees.
        </p>
      </div>

      {/* Switch Buy / Rent */}
      <div className="flex justify-center mb-6">
        <div className="bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 flex gap-2">
          <button
            onClick={() => setMode('buy')}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              mode === 'buy'
                ? 'bg-amber-500 text-onyx shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-50'
            }`}
          >
            Property Purchase (Off-Plan & Ready)
          </button>
          <button
            onClick={() => setMode('rent')}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              mode === 'rent'
                ? 'bg-amber-500 text-onyx shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-50'
            }`}
          >
            Annual Rental Lease (Move-In Costs)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Controls Column */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          <h3 className="font-serif font-semibold text-slate-50 text-base flex items-center gap-2">
            <Building className="w-4 h-4 text-amber-400" />
            Transaction Parameters
          </h3>

          {mode === 'buy' ? (
            <>
              {/* Emirate Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Select Emirate Jurisdiction
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  <button
                    onClick={() => setEmirate('Dubai')}
                    className={`py-2.5 px-3 rounded-xl border text-center transition-all ${
                      emirate === 'Dubai'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-50'
                    }`}
                  >
                    Dubai (4% DLD)
                  </button>
                  <button
                    onClick={() => setEmirate('Abu Dhabi')}
                    className={`py-2.5 px-3 rounded-xl border text-center transition-all ${
                      emirate === 'Abu Dhabi'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-50'
                    }`}
                  >
                    Abu Dhabi (2% DMT)
                  </button>
                </div>
              </div>

              {/* Property Stage */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Property Stage
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  <button
                    onClick={() => setIsOffPlan(true)}
                    className={`py-2 px-3 rounded-xl border text-center transition-all ${
                      isOffPlan
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-50'
                    }`}
                  >
                    Off-Plan (Oqood Registration)
                  </button>
                  <button
                    onClick={() => setIsOffPlan(false)}
                    className={`py-2 px-3 rounded-xl border text-center transition-all ${
                      !isOffPlan
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-50'
                    }`}
                  >
                    Ready Property (Title Deed)
                  </button>
                </div>
              </div>

              {/* Price Slider & Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Purchase Price (AED)
                  </label>
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    AED {priceAED.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="500000"
                  max="25000000"
                  step="50000"
                  value={priceAED}
                  onChange={(e) => setPriceAED(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>AED 500K</span>
                  <span>AED 10M</span>
                  <span>AED 25M+</span>
                </div>
              </div>

              {/* Mortgage Toggle */}
              <div className="pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={includeMortgage}
                    onChange={(e) => setIncludeMortgage(e.target.checked)}
                    className="accent-amber-500 rounded"
                  />
                  <span>Factor in UAE Central Bank Bank Mortgage (80% LTV)</span>
                </label>
              </div>
            </>
          ) : (
            <>
              {/* Annual Rent Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Annual Agreed Rent (AED)
                  </label>
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    AED {rentAED.toLocaleString()} / year
                  </span>
                </div>
                <input
                  type="range"
                  min="40000"
                  max="500000"
                  step="5000"
                  value={rentAED}
                  onChange={(e) => setRentAED(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>AED 40,000</span>
                  <span>AED 250,000</span>
                  <span>AED 500,000</span>
                </div>
              </div>

              {/* Furnishing Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Furnishing Standard
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  <button
                    onClick={() => setIsFurnished(false)}
                    className={`py-2 px-3 rounded-xl border text-center transition-all ${
                      !isFurnished
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-50'
                    }`}
                  >
                    Unfurnished (5% Deposit)
                  </button>
                  <button
                    onClick={() => setIsFurnished(true)}
                    className={`py-2 px-3 rounded-xl border text-center transition-all ${
                      isFurnished
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-50'
                    }`}
                  >
                    Fully Furnished (10% Deposit)
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Golden Visa Flag */}
          {mode === 'buy' && priceAED >= 2000000 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-amber-300">UAE 10-Year Golden Visa Eligible</strong>
                Your purchase meets the AED 2,000,000 threshold for the renewable 10-Year Investor Residency Visa for yourself, spouse, and dependents.
              </div>
            </div>
          )}
        </div>

        {/* Breakdown Output Column */}
        <div className="lg:col-span-6 bg-gradient-to-b from-slate-900 to-slate-900 border border-amber-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-serif font-semibold text-slate-50 text-base">
                Itemized Closing Schedule
              </h3>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Official RERA Fee Schedule
              </span>
            </div>

            {mode === 'buy' ? (
              <div className="space-y-3 mt-4 text-xs">
                {/* Gov Fee */}
                <div className="flex justify-between items-center py-1">
                  <div>
                    <span className="text-slate-200 font-semibold block">
                      {purchaseCosts.registrationFeePercentageLabel}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {emirate === 'Dubai' ? 'Mandatory transfer fee to Dubai Land Dept.' : 'Abu Dhabi DMT land registry fee'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-50 text-sm">
                    AED {purchaseCosts.governmentRegistrationFee.toLocaleString()}
                  </span>
                </div>

                {/* Admin Fee */}
                <div className="flex justify-between items-center py-1 border-t border-slate-800/80">
                  <div>
                    <span className="text-slate-200 font-semibold block">
                      Government Administrative Fee
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {emirate === 'Dubai' ? 'DLD trustee registration & system fee' : 'DMT documentation fee'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-50 text-sm">
                    AED {purchaseCosts.governmentAdminFee.toLocaleString()}
                  </span>
                </div>

                {/* Oqood / Deed */}
                <div className="flex justify-between items-center py-1 border-t border-slate-800/80">
                  <div>
                    <span className="text-slate-200 font-semibold block">
                      {isOffPlan ? 'Oqood Registration (Off-Plan Certificate)' : 'Title Deed Issuance Fee'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {isOffPlan ? 'Mandatory interim property registry certificate' : 'Permanent ownership deed'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-50 text-sm">
                    AED {purchaseCosts.oqoodOrDeedFee.toLocaleString()}
                  </span>
                </div>

                {/* Agency Fee */}
                <div className="flex justify-between items-center py-1 border-t border-slate-800/80">
                  <div>
                    <span className="text-slate-200 font-semibold block">
                      Brokerage & Advisory (2% + 5% VAT)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Mandated professional real estate agency fee
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-50 text-sm">
                    AED {(purchaseCosts.agencyFee + purchaseCosts.agencyFeeVat).toLocaleString()}
                  </span>
                </div>

                {includeMortgage && (
                  <div className="flex justify-between items-center py-1 border-t border-slate-800/80 text-amber-300">
                    <div>
                      <span className="font-semibold block">
                        Mortgage Registration & Bank Valuation
                      </span>
                      <span className="text-[10px] text-slate-400">
                        0.25% loan fee + AED 290 + AED 3,150 valuation
                      </span>
                    </div>
                    <span className="font-mono font-bold text-sm">
                      AED {(mortgageRegistrationFee + bankValuationFee).toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Total Closing Costs */}
                <div className="mt-4 pt-3 border-t-2 border-slate-700 flex justify-between items-baseline">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">
                      Total Government & Closing Costs
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Approx. {((purchaseCosts.totalClosingCosts / priceAED) * 100).toFixed(2)}% of asset price
                    </span>
                  </div>
                  <span className="text-xl font-extrabold text-amber-400 font-mono">
                    AED {(purchaseCosts.totalClosingCosts + (includeMortgage ? mortgageRegistrationFee + bankValuationFee : 0)).toLocaleString()}
                  </span>
                </div>

                {/* Total Cash to Complete */}
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center mt-3">
                  <span className="text-xs font-bold text-slate-300">
                    {includeMortgage ? 'Total Initial Equity Needed (20% + Fees):' : 'Total Acquisition Outlay (100% Cash):'}
                  </span>
                  <span className="text-base font-extrabold text-slate-50 font-mono">
                    AED {(includeMortgage ? totalBuyOutlayWithMortgage : purchaseCosts.totalCashOutlay).toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 mt-4 text-xs">
                {/* 1st Cheque Rent */}
                <div className="flex justify-between items-center py-1">
                  <div>
                    <span className="text-slate-200 font-semibold block">
                      First Rental Installment (4-Cheque Basis)
                    </span>
                    <span className="text-[10px] text-slate-400">Quarterly rent payment</span>
                  </div>
                  <span className="font-mono font-bold text-slate-50 text-sm">
                    AED {(rentAED / 4).toLocaleString()}
                  </span>
                </div>

                {/* Security Deposit */}
                <div className="flex justify-between items-center py-1 border-t border-slate-800/80">
                  <div>
                    <span className="text-slate-200 font-semibold block">
                      Refundable Security Deposit ({isFurnished ? '10% Furnished' : '5% Unfurnished'})
                    </span>
                    <span className="text-[10px] text-slate-400">Returned upon tenancy handover</span>
                  </div>
                  <span className="font-mono font-bold text-slate-50 text-sm">
                    AED {rentalCosts.securityDeposit.toLocaleString()}
                  </span>
                </div>

                {/* Rental Agency Fee */}
                <div className="flex justify-between items-center py-1 border-t border-slate-800/80">
                  <div>
                    <span className="text-slate-200 font-semibold block">
                      Statutory Agency Fee (5% + 5% VAT)
                    </span>
                    <span className="text-[10px] text-slate-400">RERA mandated annual brokerage fee</span>
                  </div>
                  <span className="font-mono font-bold text-slate-50 text-sm">
                    AED {(rentalCosts.agencyFee + rentalCosts.agencyFeeVat).toLocaleString()}
                  </span>
                </div>

                {/* Ejari & DEWA */}
                <div className="flex justify-between items-center py-1 border-t border-slate-800/80">
                  <div>
                    <span className="text-slate-200 font-semibold block">
                      Ejari Registration & DEWA Connection
                    </span>
                    <span className="text-[10px] text-slate-400">AED 220 Ejari + AED 2,130 utility deposit</span>
                  </div>
                  <span className="font-mono font-bold text-slate-50 text-sm">
                    AED {(rentalCosts.ejariOrTawtheeqFee + rentalCosts.utilityDeposit).toLocaleString()}
                  </span>
                </div>

                {/* Total Move In Cost */}
                <div className="mt-4 pt-3 border-t-2 border-slate-700 flex justify-between items-baseline">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">
                      Total Move-In Cash Outlay
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Includes 1st quarter rent + refundable deposits
                    </span>
                  </div>
                  <span className="text-xl font-extrabold text-amber-400 font-mono">
                    AED {Math.round(rentalCosts.totalMoveInCost).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Lead Capture CTA on Calculator */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            <button
              onClick={() =>
                onOpenLeadModal(
                  `Official ${emirate} DLD Fee & Closing Schedule PDF (AED ${priceAED.toLocaleString()})`
                )
              }
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 text-onyx font-bold text-xs sm:text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 hover:scale-101"
            >
              <Download className="w-4 h-4" />
              <span>Get Official DLD Closing Statement PDF via WhatsApp</span>
            </button>
            <p className="text-[10px] text-slate-400 text-center mt-2 leading-relaxed">
              Dispatched with bank amortization breakdown and developer payment milestone schedules.
            </p>
          </div>
        </div>
      </div>

      {/* Compliance Disclaimer */}
      <div className="mt-6 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
        <strong className="text-slate-300 block mb-1">RERA & DLD Regulatory Notice:</strong>
        {COMPLIANCE_DISCLAIMER}
      </div>
    </div>
  );
};
