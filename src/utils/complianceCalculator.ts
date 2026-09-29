export interface PurchaseFeeBreakdown {
  propertyPriceAED: number;
  emirate: 'Dubai' | 'Abu Dhabi';
  isOffPlan: boolean;
  governmentRegistrationFee: number; // 4% DLD in Dubai or 2% DMT in Abu Dhabi
  governmentAdminFee: number; // AED 4,200 in Dubai (or AED 2,100 if <500k), AED 2,000 in Abu Dhabi
  oqoodOrDeedFee: number; // AED 3,000 Oqood for Off-Plan, AED 580 for Title Deed in Dubai
  agencyFee: number; // 2% of purchase price
  agencyFeeVat: number; // 5% VAT on agency fee
  totalClosingCosts: number;
  totalCashOutlay: number; // Property Price + Total Closing Costs
  registrationFeePercentageLabel: string;
}

export interface RentalFeeBreakdown {
  annualRentAED: number;
  isFurnished: boolean;
  agencyFee: number; // 5% of annual rent
  agencyFeeVat: number; // 5% VAT on agency fee
  securityDeposit: number; // 5% unfurnished / 10% furnished
  ejariOrTawtheeqFee: number; // AED 220 Dubai Ejari
  utilityDeposit: number; // AED 2,130 DEWA deposit
  totalMoveInCost: number; // Rent (first cheque) + Deposits + Fees
}

export function calculatePurchaseClosingCosts(
  propertyPriceAED: number,
  emirate: 'Dubai' | 'Abu Dhabi' = 'Dubai',
  isOffPlan: boolean = true
): PurchaseFeeBreakdown {
  const price = Math.max(0, propertyPriceAED);
  
  let governmentRegistrationFee = 0;
  let governmentAdminFee = 0;
  let oqoodOrDeedFee = 0;
  let registrationFeePercentageLabel = '';

  if (emirate === 'Dubai') {
    governmentRegistrationFee = price * 0.04;
    governmentAdminFee = price < 500000 ? 2100 : 4200;
    oqoodOrDeedFee = isOffPlan ? 3000 : 580;
    registrationFeePercentageLabel = '4% Dubai Land Department (DLD)';
  } else {
    governmentRegistrationFee = price * 0.02;
    governmentAdminFee = 2000;
    oqoodOrDeedFee = isOffPlan ? 1000 : 500;
    registrationFeePercentageLabel = '2% Abu Dhabi DMT Registration';
  }

  const agencyFee = price * 0.02;
  const agencyFeeVat = agencyFee * 0.05;

  const totalClosingCosts =
    governmentRegistrationFee +
    governmentAdminFee +
    oqoodOrDeedFee +
    agencyFee +
    agencyFeeVat;

  const totalCashOutlay = price + totalClosingCosts;

  return {
    propertyPriceAED: price,
    emirate,
    isOffPlan,
    governmentRegistrationFee,
    governmentAdminFee,
    oqoodOrDeedFee,
    agencyFee,
    agencyFeeVat,
    totalClosingCosts,
    totalCashOutlay,
    registrationFeePercentageLabel,
  };
}

export function calculateRentalMoveInCosts(
  annualRentAED: number,
  isFurnished: boolean = false
): RentalFeeBreakdown {
  const rent = Math.max(0, annualRentAED);
  const agencyFee = rent * 0.05;
  const agencyFeeVat = agencyFee * 0.05;
  const securityDeposit = rent * (isFurnished ? 0.10 : 0.05);
  const ejariOrTawtheeqFee = 220;
  const utilityDeposit = 2130;

  const totalMoveInCost =
    (rent / 4) + // Assuming standard 4 cheques for initial outlay
    agencyFee +
    agencyFeeVat +
    securityDeposit +
    ejariOrTawtheeqFee +
    utilityDeposit;

  return {
    annualRentAED: rent,
    isFurnished,
    agencyFee,
    agencyFeeVat,
    securityDeposit,
    ejariOrTawtheeqFee,
    utilityDeposit,
    totalMoveInCost,
  };
}

export const COMPLIANCE_DISCLAIMER =
  'Regulatory Compliance Notice: PropEngine UAE operates under Dubai Real Estate Regulatory Agency (RERA) and Abu Dhabi Real Estate Centre (ADREC) frameworks. Government fees (4% DLD + AED 4,200 admin in Dubai; 2% DMT in Abu Dhabi) and statutory agency fees (2% + VAT for purchase; 5% + VAT for annual rent) are legally mandated. Return on Investment (ROI) and net rental yields are based on historical market actuals and predictive indexes and do not represent legally binding financial guarantees.';
