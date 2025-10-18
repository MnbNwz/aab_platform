// Dashboard-related types
import type {
  CustomerDashboardResponse,
  ContractorDashboardResponse,
  PlatformDashboardResponse,
} from "../services/dashboardService";

export interface DashboardState {
  // Unified Dashboard Data (role-based response from single endpoint)
  data: any | null;
  loading: boolean;
  error: string | null;
  lastFetched: string | null;

  // Legacy role-specific data (for backward compatibility)
  customerData: CustomerDashboardResponse["data"] | null;
  customerLoading: boolean;
  customerError: string | null;
  customerLastFetched: string | null;

  // Contractor Dashboard Data
  contractorData: ContractorDashboardResponse["data"] | null;
  contractorLoading: boolean;
  contractorError: string | null;
  contractorLastFetched: string | null;

  // Platform Dashboard Data (Admin)
  platformData: PlatformDashboardResponse["data"] | null;
  platformLoading: boolean;
  platformError: string | null;
  platformLastFetched: string | null;

  // UI State
  refreshInterval: number; // in milliseconds
  autoRefreshEnabled: boolean;
}

export interface LeadStatsUpdate {
  leadsUsed: number;
  remaining: number;
  leadsLimit: number;
}

export interface RecentBidData {
  bidId: string;
  jobTitle: string;
  service: string;
  bidAmount: number;
  status: "pending" | "accepted" | "rejected";
}
