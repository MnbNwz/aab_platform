import Decimal from "decimal.js";

// Configure Decimal.js for financial calculations
Decimal.set({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -9e15,
  toExpPos: 9e15,
  modulo: Decimal.ROUND_HALF_UP,
  crypto: false,
});

/**
 * Safe financial calculations using Decimal.js
 * All amounts should be in cents (integers) for Stripe compatibility
 */

// Calculate deposit amount (15% of total)
export const calculateDepositAmount = (totalAmount: number): number => {
  return new Decimal(totalAmount).mul(15).div(100).round().toNumber();
};

// Calculate pre-start amount (25% of total)
export const calculatePreStartAmount = (totalAmount: number): number => {
  return new Decimal(totalAmount).mul(25).div(100).round().toNumber();
};

// Calculate completion amount (remaining after deposit and pre-start)
export const calculateCompletionAmount = (
  totalAmount: number,
  depositAmount: number,
  preStartAmount: number,
): number => {
  return new Decimal(totalAmount).sub(depositAmount).sub(preStartAmount).round().toNumber();
};

// Calculate platform fee
export const calculatePlatformFee = (totalAmount: number, feePercentage: number): number => {
  return new Decimal(totalAmount).mul(feePercentage).div(100).round().toNumber();
};

// Calculate yearly discount (15% off)
export const calculateYearlyDiscount = (amount: number): number => {
  return new Decimal(amount).mul(0.85).round().toNumber();
};

// Calculate prepaid rebate (25% additional discount)
export const calculatePrepaidRebate = (amount: number): number => {
  return new Decimal(amount).mul(0.75).round().toNumber();
};

// Calculate cancellation fee (5% of total paid)
export const calculateCancellationFee = (totalPaid: number): number => {
  return new Decimal(totalPaid).mul(5).div(100).round().toNumber();
};

// Calculate refund amount after fees
export const calculateRefundAmount = (
  originalAmount: number,
  adminFeePercentage: number = 7,
  stripeFeePercentage: number = 3,
): number => {
  const adminFee = new Decimal(originalAmount).mul(adminFeePercentage).div(100).round().toNumber();
  const stripeFee = new Decimal(originalAmount)
    .mul(stripeFeePercentage)
    .div(100)
    .round()
    .toNumber();
  return new Decimal(originalAmount).sub(adminFee).sub(stripeFee).round().toNumber();
};

// Round to nearest cent
export const roundToCents = (amount: number): number => {
  return new Decimal(amount).round().toNumber();
};
