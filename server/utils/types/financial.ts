// Financial utility types
export interface FinancialCalculationResult {
  originalAmount: number;
  calculatedAmount: number;
  currency: string;
  precision: number;
}

export interface DepositCalculation {
  totalAmount: number;
  depositAmount: number;
  remainingAmount: number;
  depositPercentage: number;
}

export interface MembershipPricing {
  basePrice: number;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  billingPeriod: "monthly" | "yearly";
}
