import type { PersonNameLike } from "./types/paymentDetails";

export const formatAmountCents = (value: number): string => (value / 100).toFixed(2);

export const formatPersonName = (person?: PersonNameLike | null): string | null =>
  [person?.firstName, person?.lastName].filter(Boolean).join(" ") || null;
