export type PaymentDetailType = "membership" | "job" | "general";

export interface PaymentDetailsPayload<TType extends PaymentDetailType, TData> {
  id: string;
  type: TType;
  status: string;
  amount: number;
  amountFormatted: string;
  currency: string;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  details: {
    type: TType;
    data: TData;
  };
}

export interface PaymentMembershipDetails {
  planName: string | null;
  status: string;
  cycleEnd: Date | null;
}

export interface PaymentJobParticipant {
  id: string | null;
  name: string | null;
  companyName?: string | null;
}

export interface PaymentJobDetails {
  jobId: string | null;
  jobSummary: {
    title: string | null;
    service: string | null;
    status: string | null;
    referenceNumber: string | null;
  } | null;
  participants: {
    contractor: PaymentJobParticipant | null;
    customer: PaymentJobParticipant | null;
  };
  refunds: Array<{
    amount: number;
    amountFormatted: string;
    reason: string;
    processedAt: Date;
  }>;
  milestones: Array<{
    name: string;
    status: string;
    completedAt: Date | null;
  }>;
}

export interface PersonNameLike {
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
}
