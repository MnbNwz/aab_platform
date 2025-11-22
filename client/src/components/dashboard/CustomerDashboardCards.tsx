import React, { memo, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  Briefcase,
  Clock,
  CheckCircle,
  Building,
  RefreshCw,
  Wrench,
} from "lucide-react";
import type { RootState } from "../../store";
import Loader from "../ui/Loader";
import { formatCurrency } from "../../utils";

// Format date helper
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

const StatCard: React.FC<StatCardProps> = ({
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
    className={`${bgColor} rounded-lg shadow p-4 border border-gray-100 flex flex-col items-center transition-transform hover:scale-105 hover:shadow-lg min-h-[120px]`}
  >
    <div
      className={`${color} p-2 rounded-full mb-2 flex items-center justify-center`}
    >
      <Icon className="h-5 w-5 text-white" />
    </div>
    <div className={`text-xl font-bold ${textColor} mb-1`}>
      {loading ? (
        <Loader size="small" color="gray" />
      ) : typeof value === "number" ? (
        value.toLocaleString()
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
);

interface RecentActivityCardProps {
  title: string;
  items: any[];
  loading: boolean;
  emptyMessage: string;
  totalAmount?: number;
  renderItem: (item: any, index: number) => React.ReactNode;
}

const RecentActivityCard: React.FC<RecentActivityCardProps> = ({
  title,
  items,
  loading,
  emptyMessage,
  totalAmount,
  renderItem,
}) => (
  <div className="bg-white rounded-lg shadow p-4 sm:p-6 flex flex-col h-full">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
      {title}
    </h3>
      {totalAmount !== undefined && totalAmount > 0 && (
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Total Spent
          </p>
          <p className="text-lg font-bold text-emerald-600">
            {formatCurrency(totalAmount)}
          </p>
        </div>
      )}
    </div>
    {loading ? (
      <div className="flex justify-center items-center py-8 flex-1 min-h-[200px]">
        <Loader size="large" color="accent" />
      </div>
    ) : items.length === 0 ? (
      <div className="flex items-center justify-center py-8 flex-1 min-h-[200px]">
        <p className="text-gray-500 text-center">{emptyMessage}</p>
      </div>
    ) : (
      <div className="space-y-3 flex-1">{items.map(renderItem)}</div>
    )}
  </div>
);

interface CustomerDashboardCardsProps {
  data?: any;
  loading?: boolean;
  onRefresh?: () => void;
}

export const CustomerDashboardCards: React.FC<CustomerDashboardCardsProps> =
  memo(({ data, loading, onRefresh }) => {
    const { customerData, customerError, customerLoading } = useSelector(
      (state: RootState) => state.dashboard
    );

    // Use prop data if available, fallback to Redux state
    const dashboardData = data || customerData;
    // API returns data.customer, not data.analytics
    const customer = dashboardData?.customer || dashboardData?.analytics;
    const isLoading = loading || customerLoading;

    // Sort items by date (newest first)
    const sortedRecentJobs = useMemo(() => {
      const jobs = customer?.recentJobs ?? [];
      return [...jobs].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA; // Descending order (newest first)
      });
    }, [customer?.recentJobs]);

    const sortedRecentPayments = useMemo(() => {
      const payments = customer?.recentPayments ?? [];
      return [...payments].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA; // Descending order (newest first)
      });
    }, [customer?.recentPayments]);

    const statCards = useMemo(
      () => [
        {
          title: "Total Jobs",
          value: customer?.jobStats.totalJobs ?? 0,
          icon: Briefcase,
          color: "bg-primary-500",
          textColor: "text-primary-600",
          bgColor: "bg-primary-50",
        },
        {
          title: "Open Jobs",
          value: customer?.jobStats.openJobs ?? 0,
          icon: Clock,
          color: "bg-accent-500",
          textColor: "text-accent-600",
          bgColor: "bg-accent-50",
        },
        {
          title: "In Progress",
          value:
            customer?.jobStats.inProgressJobs ??
            (customer?.jobStats.totalJobs &&
            customer?.jobStats.openJobs !== undefined &&
            customer?.jobStats.completedJobs !== undefined
              ? Math.max(
                  0,
                  customer.jobStats.totalJobs -
                    customer.jobStats.openJobs -
                    customer.jobStats.completedJobs
                )
              : 0),
          icon: Wrench,
          color: "bg-blue-500",
          textColor: "text-blue-600",
          bgColor: "bg-blue-50",
        },
        {
          title: "Completed",
          value: customer?.jobStats.completedJobs ?? 0,
          icon: CheckCircle,
          color: "bg-green-500",
          textColor: "text-green-600",
          bgColor: "bg-green-50",
        },
        {
          title: "Properties",
          value: customer?.propertyStats.totalProperties ?? 0,
          icon: Building,
          color: "bg-cyan-500",
          textColor: "text-cyan-600",
          bgColor: "bg-cyan-50",
        },
      ],
      [customer]
    );

    if (customerError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">
            Error loading dashboard: {customerError}
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
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Dashboard Overview
            </h2>
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center px-4 py-2 text-sm font-medium text-accent-600 bg-accent-50 border border-accent-200 rounded-lg hover:bg-accent-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {statCards.slice(0, 3).map((card) => (
            <StatCard key={card.title} {...card} loading={isLoading} />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          {statCards.slice(3).map((card) => (
            <StatCard key={card.title} {...card} loading={isLoading} />
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Recent Jobs */}
          <RecentActivityCard
            title="Recent Jobs"
            items={sortedRecentJobs}
            loading={isLoading}
            emptyMessage="No recent jobs"
            renderItem={(job, index) => (
              <div
                key={job._id || index}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {job.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {job.property?.title || "N/A"} • {job.bidCount || 0} bids
                  </p>
                  {job.createdAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      Created: {formatDate(job.createdAt)}
                    </p>
                  )}
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm font-medium text-green-600">
                    {formatCurrency(job.estimate ? job.estimate / 100 : 0)}
                  </p>
                  <span
                    className={`inline-flex px-2 py-1 text-xs rounded-full mt-1 ${
                      job.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : job.status === "open"
                        ? "bg-accent-100 text-accent-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
              </div>
            )}
          />

          {/* Recent Payments */}
          <RecentActivityCard
            title="My Payments"
            items={sortedRecentPayments}
            loading={isLoading}
            emptyMessage="No recent payments"
            totalAmount={
              customer?.paymentStats?.totalAmount
                ? customer.paymentStats.totalAmount / 100
                : 0
            }
            renderItem={(payment, index) => {
              // Payment amount is in cents, convert to dollars
              const amount = payment.amount ? payment.amount / 100 : 0;
              // Determine payment type - membership payments have billingPeriod, job payments have job info
              const paymentType = payment.billingPeriod
                ? `Membership (${payment.billingPeriod})`
                : payment.job?.title || "Payment";
              const paymentMethod = payment.paymentMethod || "Stripe";

              return (
              <div
                  key={payment._id || index}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(amount)}
                  </p>
                  <p className="text-xs text-gray-500">
                      {paymentType} • {paymentMethod}
                  </p>
                  {payment.createdAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(payment.createdAt)}
                    </p>
                  )}
                </div>
                <span
                  className={`inline-flex px-2 py-1 text-xs rounded-full ${
                    payment.status === "succeeded"
                      ? "bg-green-100 text-green-800"
                      : payment.status === "pending"
                      ? "bg-accent-100 text-accent-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {payment.status}
                </span>
              </div>
              );
            }}
          />
        </div>
      </div>
    );
  });

CustomerDashboardCards.displayName = "CustomerDashboardCards";

export default CustomerDashboardCards;
