import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Building2,
  TrendingUp,
  Percent,
  Coins,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Info,
  Layers,
  RotateCcw
} from 'lucide-react';

export type PropertyUnitType = 'Studio' | '1 Bedroom' | '2 Bedroom' | '3 Bedroom' | 'Luxury Villa';

interface PresetData {
  community: string;
  emirate: 'Dubai' | 'Abu Dhabi';
  unitType: PropertyUnitType;
  defaultPrice: number;
  defaultAnnualRent: number;
  defaultSqft: number;
  defaultServiceChargePerSqft: number;
  chequeNorm: string;
  typicalGrossYield: number;
}

const PROPERTY_PRESETS: PresetData[] = [
  {
    community: 'Jumeirah Village Circle (JVC)',
    emirate: 'Dubai',
    unitType: '1 Bedroom',
    defaultPrice: 950000,
    defaultAnnualRent: 78000,
    defaultSqft: 750,
    defaultServiceChargePerSqft: 14,
    chequeNorm: '2–4 Cheques',
    typicalGrossYield: 8.2,
  },
  {
    community: 'Downtown Dubai',
    emirate: 'Dubai',
    unitType: '1 Bedroom',
    defaultPrice: 2150000,
    defaultAnnualRent: 135000,
    defaultSqft: 850,
    defaultServiceChargePerSqft: 26,
    chequeNorm: '1–2 Cheques',
    typicalGrossYield: 6.3,
  },
  {
    community: 'Dubai Marina',
    emirate: 'Dubai',
    unitType: '1 Bedroom',
    defaultPrice: 1650000,
    defaultAnnualRent: 112000,
    defaultSqft: 820,
    defaultServiceChargePerSqft: 18,
    chequeNorm: '1–3 Cheques',
    typicalGrossYield: 6.8,
  },
  {
    community: 'Business Bay',
    emirate: 'Dubai',
    unitType: '1 Bedroom',
    defaultPrice: 1550000,
    defaultAnnualRent: 105000,
    defaultSqft: 800,
    defaultServiceChargePerSqft: 20,
    chequeNorm: '1–2 Cheques',
    typicalGrossYield: 6.8,
  },
  {
    community: 'Dubai Hills Estate',
    emirate: 'Dubai',
    unitType: '2 Bedroom',
    defaultPrice: 2600000,
    defaultAnnualRent: 175000,
    defaultSqft: 1150,
    defaultServiceChargePerSqft: 18,
    chequeNorm: '1–2 Cheques',
    typicalGrossYield: 6.7,
  },
  {
    community: 'Yas Island',
    emirate: 'Abu Dhabi',
    unitType: '1 Bedroom',
    defaultPrice: 1250000,
    defaultAnnualRent: 90000,
    defaultSqft: 800,
    defaultServiceChargePerSqft: 14,
    chequeNorm: '2–3 Cheques',
    typicalGrossYield: 7.2,
  },
  {
    community: 'Saadiyat Island',
    emirate: 'Abu Dhabi',
    unitType: '2 Bedroom',
    defaultPrice: 3400000,
    defaultAnnualRent: 220000,
    defaultSqft: 1400,
    defaultServiceChargePerSqft: 17,
    chequeNorm: '1–2 Cheques',
    typicalGrossYield: 6.5,
  },
  {
    community: 'Palm Jumeirah',
    emirate: 'Dubai',
    unitType: '2 Bedroom',
    defaultPrice: 4800000,
    defaultAnnualRent: 310000,
    defaultSqft: 1600,
    defaultServiceChargePerSqft: 28,
    chequeNorm: '1–2 Cheques',
    typicalGrossYield: 6.5,
  },
];

interface RoiComparisonWidgetProps {
  onAskAi: (prompt: string) => void;
  onOpenLeadModal: (title?: string) => void;
}

export const RoiComparisonWidget: React.FC<RoiComparisonWidgetProps> = ({
  onAskAi,
  onOpenLeadModal,
}) => {
  // Preset selector
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const currentPreset = PROPERTY_PRESETS[selectedPresetIndex];

  // Configurable sliders
  const [unitType, setUnitType] = useState<PropertyUnitType>(currentPreset.unitType);
  const [propertyPrice, setPropertyPrice] = useState<number>(currentPreset.defaultPrice);
  const [annualRent, setAnnualRent] = useState<number>(currentPreset.defaultAnnualRent);
  const [propertySqft, setPropertySqft] = useState<number>(currentPreset.defaultSqft);
  const [serviceChargePerSqft, setServiceChargePerSqft] = useState<number>(
    currentPreset.defaultServiceChargePerSqft
  );
  const [maintenanceReservePct, setMaintenanceReservePct] = useState<number>(3); // 3% of rent for minor repairs / property management buffer

  // When preset changes, reset inputs
  const handleSelectPreset = (index: number) => {
    setSelectedPresetIndex(index);
    const p = PROPERTY_PRESETS[index];
    setUnitType(p.unitType);
    setPropertyPrice(p.defaultPrice);
    setAnnualRent(p.defaultAnnualRent);
    setPropertySqft(p.defaultSqft);
    setServiceChargePerSqft(p.defaultServiceChargePerSqft);
    setMaintenanceReservePct(3);
  };

  // Calculations
  const metrics = useMemo(() => {
    const annualServiceCharges = propertySqft * serviceChargePerSqft;
    const maintenanceReserveAED = annualRent * (maintenanceReservePct / 100);
    const totalAnnualOperatingExpenses = annualServiceCharges + maintenanceReserveAED;
    const netOperatingIncome = Math.max(0, annualRent - totalAnnualOperatingExpenses);

    const grossYield = propertyPrice > 0 ? (annualRent / propertyPrice) * 100 : 0;
    const netYield = propertyPrice > 0 ? (netOperatingIncome / propertyPrice) * 100 : 0;
    const monthlyNetCashFlow = netOperatingIncome / 12;

    // Upfront statutory purchase cost (4% DLD + 4200 Admin + 2% Brokerage)
    const isDubai = currentPreset.emirate === 'Dubai';
    const govFee = isDubai ? propertyPrice * 0.04 + 4200 : propertyPrice * 0.02;
    const agencyFee = propertyPrice * 0.02 * 1.05; // 2% + 5% VAT
    const totalAllInCost = propertyPrice + govFee + agencyFee;
    const allInNetYield = totalAllInCost > 0 ? (netOperatingIncome / totalAllInCost) * 100 : 0;

    return {
      annualServiceCharges,
      maintenanceReserveAED,
      totalAnnualOperatingExpenses,
      netOperatingIncome,
      grossYield,
      netYield,
      monthlyNetCashFlow,
      govFee,
      agencyFee,
      totalAllInCost,
      allInNetYield,
    };
  }, [
    propertyPrice,
    annualRent,
    propertySqft,
    serviceChargePerSqft,
    maintenanceReservePct,
    currentPreset.emirate,
  ]);

  const handleResetToPreset = () => {
    handleSelectPreset(selectedPresetIndex);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-[#0d1633] to-[#070d1e] border-2 border-amber-500/40 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden mb-10">
      {/* Decorative ambient background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Header */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-semibold mb-2">
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
            Interactive Yield Engine
          </div>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight flex items-center gap-2.5">
            Real-Time ROI & Net Yield Stress Tester
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Simulate real-world cash flows by adjusting annual rent and service charges. Real-time DLD/ADREC statutory cost calculations show exactly how operating expenses impact net yields.
          </p>
        </div>

        {/* Quick presets pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetToPreset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
            title="Reset to selected preset defaults"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            Reset Defaults
          </button>
          <button
            onClick={() =>
              onOpenLeadModal(
                `Institutional Yield & Cash Flow Audit (${currentPreset.community} - ${unitType})`
              )
            }
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 hover:scale-102 transition-transform"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Request Full Financial Model PDF
          </button>
        </div>
      </div>

      {/* Preset selector bar */}
      <div className="relative z-10 my-6">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
          Select Benchmark Location & Unit Type Preset:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {PROPERTY_PRESETS.map((preset, idx) => {
            const isSelected = idx === selectedPresetIndex;
            return (
              <button
                key={`${preset.community}-${preset.unitType}`}
                onClick={() => handleSelectPreset(idx)}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-400 text-white shadow-md shadow-amber-500/10'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div>
                  <span className="text-[10px] block font-semibold text-amber-400/90 truncate">
                    {preset.emirate}
                  </span>
                  <p className="text-xs font-bold truncate text-white">{preset.community.split('(')[0]}</p>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-300">
                  <span className="truncate">{preset.unitType}</span>
                  <span className="text-emerald-400 font-bold ml-1">~{preset.typicalGrossYield}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Controls & Live Outcome */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Sliders & Adjusters (7 cols) */}
        <div className="lg:col-span-7 space-y-5 bg-slate-950/70 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Adjust Property Financial Inputs
            </span>
            <span className="text-[11px] text-slate-400">
              Community: <strong className="text-white">{currentPreset.community}</strong>
            </span>
          </div>

          {/* Unit Type Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Unit Configuration
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {(['Studio', '1 Bedroom', '2 Bedroom', '3 Bedroom', 'Luxury Villa'] as PropertyUnitType[]).map(
                (type) => (
                  <button
                    key={type}
                    onClick={() => setUnitType(type)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all text-center truncate ${
                      unitType === type
                        ? 'bg-amber-500 text-slate-950 font-bold shadow'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {type}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Property Price Input / Slider */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Property Acquisition Price (AED)
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  AED {propertyPrice.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  (~${Math.round(propertyPrice / 3.6725).toLocaleString()})
                </span>
              </div>
            </div>
            <input
              type="range"
              min={400000}
              max={10000000}
              step={25000}
              value={propertyPrice}
              onChange={(e) => setPropertyPrice(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>AED 400K (Studio)</span>
              <span>AED 2.0M (Golden Visa Threshold)</span>
              <span>AED 10M+ (Luxury)</span>
            </div>
          </div>

          {/* Annual Rental Rate Slider */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                Estimated Annual Rent (AED / Year)
                <span className="text-[10px] text-emerald-400 font-normal">
                  ({Math.round(annualRent / 12).toLocaleString()} AED/mo)
                </span>
              </label>
              <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                AED {annualRent.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min={30000}
              max={800000}
              step={2500}
              value={annualRent}
              onChange={(e) => setAnnualRent(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>AED 30K/yr</span>
              <span>Cheque Standard: {currentPreset.chequeNorm}</span>
              <span>AED 800K/yr</span>
            </div>
          </div>

          {/* Property Size (sqft) & Service Charge per Sqft */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Built-up Area */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Built-up Area (Sq. Ft.)
                </label>
                <span className="text-xs font-mono font-bold text-slate-200">
                  {propertySqft.toLocaleString()} sq.ft.
                </span>
              </div>
              <input
                type="range"
                min={350}
                max={4000}
                step={25}
                value={propertySqft}
                onChange={(e) => setPropertySqft(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Avg rate: AED {Math.round(propertyPrice / (propertySqft || 1)).toLocaleString()} / sqft
              </span>
            </div>

            {/* Service Charge / sqft */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  Service Charge
                  <span className="text-[10px] text-amber-400/80">(AED / sqft)</span>
                </label>
                <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  AED {serviceChargePerSqft} / sqft
                </span>
              </div>
              <input
                type="range"
                min={8}
                max={45}
                step={1}
                value={serviceChargePerSqft}
                onChange={(e) => setServiceChargePerSqft(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Total annual: AED {metrics.annualServiceCharges.toLocaleString()} (Landlord borne)
              </span>
            </div>
          </div>

          {/* Maintenance & Management Reserve */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Operating Reserve & Management Buffer
              </label>
              <span className="text-xs font-mono font-bold text-slate-200">
                {maintenanceReservePct}% (AED {Math.round(metrics.maintenanceReserveAED).toLocaleString()}/yr)
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              step={0.5}
              value={maintenanceReservePct}
              onChange={(e) => setMaintenanceReservePct(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-400"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Covers minor wear & tear, tenant turnover refresh, and property management agency buffer.
            </span>
          </div>
        </div>

        {/* Right Column: Live Yield Cards & Cash Flow Output (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Net Yield Hero Card */}
          <div className="bg-gradient-to-br from-[#0c1e38] to-[#081226] border-2 border-emerald-500/40 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Live Net Yield Outcome
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                Post-Service Charges
              </span>
            </div>

            <div className="flex items-baseline gap-3 my-2">
              <span className="text-4xl sm:text-5xl font-mono font-extrabold text-white tracking-tight">
                {metrics.netYield.toFixed(2)}%
              </span>
              <span className="text-xs text-slate-300">
                Net Annual Return
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-800/80">
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Gross Rental Yield</span>
                <span className="text-lg font-mono font-bold text-amber-300">
                  {metrics.grossYield.toFixed(2)}%
                </span>
                <span className="text-[10px] text-slate-500 block">Pre-deductions</span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Monthly Net Cash Flow</span>
                <span className="text-lg font-mono font-bold text-emerald-300">
                  AED {Math.round(metrics.monthlyNetCashFlow).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  ~${Math.round(metrics.monthlyNetCashFlow / 3.6725).toLocaleString()} USD/mo
                </span>
              </div>
            </div>
          </div>

          {/* Cash Flow Breakdown Table */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-xs space-y-2.5">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              Annual Cash Flow Breakdown
            </span>

            <div className="flex justify-between items-center text-slate-300">
              <span>Gross Rental Income:</span>
              <span className="font-mono font-bold text-white">+AED {annualRent.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center text-rose-300/90">
              <span className="flex items-center gap-1">
                Annual Service Charges:
                <span title="Borne by Landlord under Law No. 27">
                  <Info className="w-3 h-3 text-slate-500" />
                </span>
              </span>
              <span className="font-mono font-semibold">-AED {metrics.annualServiceCharges.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center text-rose-300/90">
              <span>Maintenance & Mgmt Buffer ({maintenanceReservePct}%):</span>
              <span className="font-mono font-semibold">-AED {Math.round(metrics.maintenanceReserveAED).toLocaleString()}</span>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-emerald-400 font-bold">
              <span>Net Operating Income (NOI):</span>
              <span className="font-mono text-sm">AED {Math.round(metrics.netOperatingIncome).toLocaleString()} / yr</span>
            </div>
          </div>

          {/* All-in Purchase Cost Stress Indicator */}
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-300">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 font-medium">True All-in Capital Deployed:</span>
              <span className="font-mono font-bold text-amber-300">
                AED {Math.round(metrics.totalAllInCost).toLocaleString()}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Includes {currentPreset.emirate === 'Dubai' ? '4% DLD + AED 4,200 admin' : '2% DMT registration'} + statutory 2% RERA brokerage (+ 5% VAT). Yield on total deployed equity:{' '}
              <strong className="text-white font-mono">{metrics.allInNetYield.toFixed(2)}% net</strong>.
            </p>
          </div>

          {/* Quick AI Advisor & Lead CTA */}
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                onAskAi(
                  `As PropEngine UAE, analyze my simulated property scenario in ${currentPreset.community} for a ${unitType} priced at AED ${propertyPrice.toLocaleString()} with annual rent AED ${annualRent.toLocaleString()} and service charges AED ${serviceChargePerSqft}/sqft (Net yield: ${metrics.netYield.toFixed(2)}%). Is this realistic compared to current 2026 DLD transaction benchmarks, and how does it compare to other communities?`
                )
              }
              className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Ask AI to Audit Scenario
            </button>
            <button
              onClick={() =>
                onOpenLeadModal(
                  `VIP Consultation: ${currentPreset.community} ${unitType} Portfolio`
                )
              }
              className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1"
            >
              <span>Get Units</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
