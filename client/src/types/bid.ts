// Bid-related types

export interface BidContractor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profileImage?: string | null;
  contractor?: {
    companyName?: string;
    services?: string[];
    license?: string;
    taxId?: string;
  };
}

export interface Bid {
  _id: string;
  bidAmount: number;
  status: "pending" | "accepted" | "rejected";
  message?: string;
  timeline?: {
    startDate: string;
    endDate: string;
  };
  materials?: {
    included: boolean;
    description?: string;
  };
  warranty?: {
    period: number;
    description?: string;
  };
  contractor: BidContractor;
  depositPaid?: boolean;
  completionPaid?: boolean;
  jobPaymentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BidFormData {
  bidAmount: number;
  message?: string;
  timeline?: {
    startDate: string;
    endDate: string;
  };
  materials?: {
    included: boolean;
    description?: string;
  };
  warranty?: {
    period: number;
    description?: string;
  };
}
