export interface JobRevenueMonthly {
  year: number;
  month: number;
  status: string;
  count: number;
  totalValue: number;
}

export interface ServiceRevenue {
  service: string;
  status: string;
  count: number;
  totalValue: number;
  avgValue: number;
}

export interface TypeRevenue {
  type: string;
  count: number;
  totalValue: number;
  avgValue: number;
}

export interface JobRevenue {
  summary: {
    totalJobsValue: number;
    completedJobsValue: number;
    inProgressValue: number;
    openJobsValue: number;
    cancelledValue: number;
    avgJobValue: number;
    totalJobs: number;
    completedJobs: number;
  };
  monthlyRevenue: JobRevenueMonthly[];
  serviceRevenue: ServiceRevenue[];
  typeRevenue: TypeRevenue[];
}

export interface TierRevenue {
  tier: string;
  count: number;
  totalRevenue: number;
  avgRevenue: number;
}

export interface BillingRevenue {
  billingPeriod: string;
  count: number;
  totalRevenue: number;
}

export interface MonthlySignup {
  year: number;
  month: number;
  tier: string;
  count: number;
  revenue: number;
}

export interface MembershipRevenue {
  summary: {
    totalRevenue: number;
    activeRevenue: number;
    totalMemberships: number;
    activeMemberships: number;
    avgMembershipValue: number;
  };
  tierRevenue: TierRevenue[];
  billingRevenue: BillingRevenue[];
  monthlySignups: MonthlySignup[];
}

export interface PaymentTypeBreakdown {
  type: string;
  count: number;
  totalAmount: number;
}

export interface PaymentsRevenue {
  summary: {
    totalPayments: number;
    totalAmount: number;
    avgPaymentAmount: number;
    successfulPayments: number;
    failedPayments: number;
  };
  typeBreakdown: PaymentTypeBreakdown[];
}

export interface RevenueData {
  jobs: JobRevenue;
  memberships: MembershipRevenue;
  payments: PaymentsRevenue;
}

export interface TopContractor {
  _id: string;
  totalBids: number;
  acceptedBids: number;
  rejectedBids: number;
  pendingBids: number;
  totalBidValue: number;
  avgBidAmount: number;
  winRate: number;
}

export interface ContractorPerformance {
  summary: {
    totalBids: number;
    acceptedBids: number;
    avgBidAmount: number;
    totalBidValue: number;
    avgWinRate: number;
  };
  topContractors: TopContractor[];
}

export interface TopCustomer {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  totalJobs: number;
  totalSpending: number;
}

export interface CustomerPerformance {
  summary: {
    totalCustomers: number;
    activeCustomers: number;
    avgJobsPerCustomer: number;
    avgSpendingPerCustomer: number;
  };
  topCustomers: TopCustomer[];
}

export interface MonthlyLeadUsage {
  year: number;
  month: number;
  tier: string;
  count: number;
}

export interface LeadPerformance {
  summary: {
    totalLeadsUsed: number;
    basicTierLeads: number;
    standardTierLeads: number;
    premiumTierLeads: number;
  };
  monthlyLeadUsage: MonthlyLeadUsage[];
  conversionRate: {
    totalLeads: number;
    convertedLeads: number;
    conversionRate: number;
  };
}

export interface PerformanceData {
  contractors: ContractorPerformance;
  customers: CustomerPerformance;
  leads: LeadPerformance;
}

export interface TrendsData {
  currentMonth: {
    jobs: number;
    users: number;
    month: number;
    year: number;
  };
  previousMonth: {
    jobs: number;
    users: number;
    month: number;
    year: number;
  };
  growth: {
    jobsGrowthPercent: number;
    usersGrowthPercent: number;
  };
}

export interface AnalyticsData {
  revenue: RevenueData;
  performance: PerformanceData;
  trends: TrendsData;
}

export interface AnalyticsResponse {
  success: boolean;
  data: AnalyticsData;
  timestamp: string;
  description: string;
}
