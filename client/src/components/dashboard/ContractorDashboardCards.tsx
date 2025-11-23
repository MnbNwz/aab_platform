import React, { memo, useMemo, useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { createSelector } from "@reduxjs/toolkit";
import {
  Target,
  TrendingUp,
  CheckCircle,
  DollarSign,
  Users,
  RefreshCw,
} from "lucide-react";
import type { RootState } from "../../store";
import Loader from "../ui/Loader";
import { formatCurrency } from "../../utils";
import { formatJobStatusText } from "../../utils/badgeColors";

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  textColor: string;
  bgColor: string;
  subtitle?: string;
  loading?: boolean;
}

const StatCard = memo<StatCardProps>(
  ({
    title,
    value,
    icon: Icon,
    color,
    textColor,
    bgColor,
    subtitle,
    loading = false,
  }) => (
    <div
      className={`${bgColor} rounded-lg shadow p-3 sm:p-4 border border-gray-100 flex flex-col items-center transition-transform hover:scale-105 hover:shadow-lg min-h-[100px] sm:min-h-[120px]`}
    >
      <div
        className={`${color} p-2 rounded-full mb-2 flex items-center justify-center`}
      >
        <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
      </div>
      <div className={`text-lg sm:text-xl font-bold ${textColor} mb-1`}>
        {loading ? (
          <Loader size="small" color="gray" />
        ) : typeof value === "number" ? (
          formatCurrency(value)
        ) : (
          value
        )}
      </div>
      <p className="text-xs font-medium text-gray-600 text-center uppercase tracking-wide">
        {title}
      </p>
      {subtitle && (
        <p className="text-xs text-gray-500 mt-1 text-center">{subtitle}</p>
      )}
    </div>
  )
);

StatCard.displayName = "StatCard";

interface RecentActivityCardProps {
  title: string;
  items: any[];
  loading: boolean;
  emptyMessage: string;
  renderItem: (item: any, index: number) => React.ReactNode;
}

const RecentActivityCard = memo<RecentActivityCardProps>(
  ({ title, items, loading, emptyMessage, renderItem }) => (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-4">
        {title}
      </h3>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader size="large" color="accent" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-gray-500 text-center py-8 text-sm sm:text-base">
          {emptyMessage}
        </p>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {items.slice(0, 5).map(renderItem)}
        </div>
      )}
    </div>
  )
);

RecentActivityCard.displayName = "RecentActivityCard";

interface ContractorDashboardCardsProps {
  data?: any;
  loading?: boolean;
  onRefresh?: () => void;
}

// Memoized selector to prevent unnecessary re-renders
const selectDashboardState = createSelector(
  [
    (state: RootState) => state.dashboard.contractorData,
    (state: RootState) => state.dashboard.contractorError,
    (state: RootState) => state.dashboard.contractorLoading,
  ],
  (contractorData, contractorError, contractorLoading) => ({
    contractorData,
    contractorError,
    contractorLoading,
  })
);

export const ContractorDashboardCards: React.FC<ContractorDashboardCardsProps> =
  memo(({ data, loading, onRefresh }) => {
    const { contractorData, contractorError, contractorLoading } =
      useSelector(selectDashboardState);

    const [isRefreshing, setIsRefreshing] = useState(false);

    const dashboardData = data || contractorData;
    const analytics =
      dashboardData?.contractor || dashboardData?.analytics || dashboardData;
    const isLoading = loading || contractorLoading || isRefreshing;

    const handleRefresh = useCallback(() => {
      setIsRefreshing(true);
      if (onRefresh) {
        onRefresh();
        setTimeout(() => setIsRefreshing(false), 100);
      }
    }, [onRefresh]);

    const recentBids = analytics?.recentBids;
    const recentWonJobs = analytics?.recentWonJobs;
    const sortedRecentBids = useMemo(() => {
      if (!recentBids || recentBids.length === 0) return [];
      return [...recentBids].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA; // Descending order (newest first)
      });
    }, [recentBids]);

    const sortedRecentWonJobs = useMemo(() => {
      if (!recentWonJobs || recentWonJobs.length === 0) return [];
      return [...recentWonJobs].sort((a, b) => {
        const dateA = a.acceptedAt ? new Date(a.acceptedAt).getTime() : 0;
        const dateB = b.acceptedAt ? new Date(b.acceptedAt).getTime() : 0;
        return dateB - dateA; // Descending order (newest first)
      });
    }, [recentWonJobs]);

    const biddingStats = analytics?.biddingStats;
    const leadStats = analytics?.leadStats;
    const earningsStats = analytics?.earningsStats;

    const statCards = useMemo(
      () => [
        {
          title: "Total Bids",
          value: biddingStats?.totalBids ?? 0,
          icon: Target,
          color: "bg-primary-500",
          textColor: "text-primary-600",
          bgColor: "bg-primary-50",
          subtitle: `${biddingStats?.totalBidsThisMonth ?? 0} this month`,
        },
        {
          title: "Won Bids",
          value: biddingStats?.acceptedBids ?? 0,
          icon: CheckCircle,
          color: "bg-green-500",
          textColor: "text-green-600",
          bgColor: "bg-green-50",
        },
        {
          title: "Win Rate",
          value: `${(biddingStats?.winRate ?? 0).toFixed(1)}%`,
          icon: TrendingUp,
          color: "bg-accent-500",
          textColor: "text-accent-600",
          bgColor: "bg-accent-50",
        },
        {
          title: "Total Earnings",
          value: formatCurrency((earningsStats?.totalEarnings ?? 0) / 100),
          icon: DollarSign,
          color: "bg-green-500",
          textColor: "text-green-600",
          bgColor: "bg-green-50",
        },
        {
          title: "Leads Used",
          value: `${leadStats?.used ?? 0}/${leadStats?.limit ?? 0}`,
          icon: Users,
          color: "bg-primary-500",
          textColor: "text-primary-600",
          bgColor: "bg-primary-50",
          subtitle: `${leadStats?.remaining ?? 0} remaining`,
        },
      ],
      [biddingStats, leadStats, earningsStats]
    );

    const renderBidItem = useCallback((bid: any, index: number) => {
      const bidId = bid._id || index;
      return (
        <div
          key={bidId}
          className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 xs:gap-3 p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex-1 min-w-0 w-full xs:w-auto">
            <p className="text-sm font-medium text-gray-900 truncate">
              {bid.jobTitle}
            </p>
            <p className="text-xs text-gray-500 capitalize">{bid.service}</p>
            {bid.createdAt && (
              <p className="text-xs text-gray-400 mt-1">
                Submitted: {formatDate(bid.createdAt)}
              </p>
            )}
          </div>
          <div className="flex flex-row xs:flex-col items-start xs:items-end gap-2 w-full xs:w-auto xs:ml-4 flex-shrink-0">
            <p className="text-sm font-medium text-primary-700 whitespace-nowrap">
              {formatCurrency(bid.bidAmount ? bid.bidAmount / 100 : 0)}
            </p>
            <span
              className={`inline-flex px-2 py-1 text-xs rounded-full font-semibold whitespace-nowrap ${
                bid.status === "accepted"
                  ? "bg-green-100 text-green-800"
                  : bid.status === "pending"
                  ? "bg-accent-100 text-accent-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {bid.status ? formatJobStatusText(bid.status) : ""}
            </span>
          </div>
        </div>
      );
    }, []);

    const renderWonJobItem = useCallback((job: any, index: number) => {
      const jobId = job._id || index;
      return (
        <div
          key={jobId}
          className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 xs:gap-3 p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex-1 min-w-0 w-full xs:w-auto">
            <p className="text-sm font-medium text-gray-900 truncate">
              {job.jobTitle}
            </p>
            <p className="text-xs text-gray-500 capitalize">{job.service}</p>
            {job.acceptedAt && (
              <p className="text-xs text-gray-400 mt-1">
                Accepted: {formatDate(job.acceptedAt)}
              </p>
            )}
          </div>
          <div className="text-right xs:ml-4 flex-shrink-0 w-full xs:w-auto">
            <p className="text-sm font-semibold text-green-600 whitespace-nowrap">
              {formatCurrency(job.bidAmount ? job.bidAmount / 100 : 0)}
            </p>
          </div>
        </div>
      );
    }, []);

    if (contractorError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">
            Error loading dashboard: {contractorError}
          </p>
          <button
            onClick={onRefresh}
            className="mt-2 text-red-600 hover:text-red-800 font-medium"
          >
            Try Again
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-3 xs:gap-0">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Performance Dashboard
            </h2>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-accent-600 bg-accent-50 border border-accent-200 rounded-lg hover:bg-accent-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw
              className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${
                isLoading ? "animate-spin" : ""
              }`}
            />
            <span className={isLoading ? "opacity-75" : ""}>
              {isLoading ? "Refreshing..." : "Refresh"}
            </span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
          {statCards.map((card) => (
            <StatCard key={card.title} {...card} loading={isLoading} />
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Recent Bids */}
          <RecentActivityCard
            title="Recent Bids"
            items={sortedRecentBids}
            loading={isLoading}
            emptyMessage="No recent bids"
            renderItem={renderBidItem}
          />

          {/* Recent Won Jobs */}
          <RecentActivityCard
            title="Recent Won Jobs"
            items={sortedRecentWonJobs}
            loading={isLoading}
            emptyMessage="No won jobs yet"
            renderItem={renderWonJobItem}
          />
        </div>
      </div>
    );
  });

ContractorDashboardCards.displayName = "ContractorDashboardCards";

export default ContractorDashboardCards;
