import { addMonths, addYears, differenceInDays } from "date-fns";

/**
 * Safe date operations using date-fns
 * All functions handle timezone and daylight saving time properly
 */

// Get membership end date based on billing period
export const getMembershipEndDate = (
  startDate: Date,
  billingPeriod: "monthly" | "yearly",
): Date => {
  if (billingPeriod === "monthly") {
    return addMonths(startDate, 1);
  } else {
    return addYears(startDate, 1);
  }
};

// Calculate days remaining until a date
export const getDaysRemaining = (endDate: Date): number => {
  const now = new Date();
  const days = differenceInDays(endDate, now);
  return Math.max(0, days); // Return 0 if date has passed
};
