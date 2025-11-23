import React, { memo, useMemo, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { createSelector } from "@reduxjs/toolkit";
import {
  Briefcase,
  Clock,
  CheckCircle,
  Building,
  RefreshCw,
  Wrench,
} from "lucide-react";
import type { RootState, AppDispatch } from "../../store";
import { getJobByIdThunk } from "../../store/thunks/jobThunks";
import Loader from "../ui/Loader";
import JobDetailViewModal from "../JobDetailViewModal";
import { formatCurrency, truncateString } from "../../utils";
import type { Job } from "../../types/job";

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
  )
);

StatCard.displayName = "StatCard";

interface RecentActivityCardProps {
  title: string;
  items: any[];
  loading: boolean;
  emptyMessage: string;
  totalAmount?: number;
  renderItem: (item: any, index: number) => React.ReactNode;
}

const RecentActivityCard = memo<RecentActivityCardProps>(
  ({ title, items, loading, emptyMessage, totalAmount, renderItem }) => (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6 flex flex-col h-full">
      <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 xs:gap-0 mb-4">
        <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">
          {title}
        </h3>
        {totalAmount !== undefined && totalAmount > 0 && (
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Total Spent
            </p>
            <p className="text-base sm:text-lg font-bold text-emerald-600">
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
          <p className="text-gray-500 text-center text-sm sm:text-base">
            {emptyMessage}
          </p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3 flex-1">
          {items.map(renderItem)}
        </div>
      )}
    </div>
  )
);

RecentActivityCard.displayName = "RecentActivityCard";

interface CustomerDashboardCardsProps {
  data?: any;
  loading?: boolean;
  onRefresh?: () => void;
}

// Memoized selector to prevent unnecessary re-renders
const selectDashboardState = createSelector(
  [
    (state: RootState) => state.dashboard.customerData,
    (state: RootState) => state.dashboard.customerError,
    (state: RootState) => state.dashboard.customerLoading,
    (state: RootState) => state.job.currentJob,
  ],
  (customerData, customerError, customerLoading, currentJob) => ({
    customerData,
    customerError,
    customerLoading,
    currentJob,
  })
);

export const CustomerDashboardCards: React.FC<CustomerDashboardCardsProps> =
  memo(({ data, loading, onRefresh }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { customerData, customerError, customerLoading, currentJob } =
      useSelector(selectDashboardState);

    const [isRefreshing, setIsRefreshing] = useState(false);

    const dashboardData = data || customerData;
    const customer = dashboardData?.customer || dashboardData?.analytics;
    const isLoading = loading || customerLoading || isRefreshing;

    const handleRefresh = useCallback(() => {
      setIsRefreshing(true);
      if (onRefresh) {
        onRefresh();
        setTimeout(() => setIsRefreshing(false), 100);
      }
    }, [onRefresh]);

    const [jobDetailModalOpen, setJobDetailModalOpen] = useState(false);

    const recentJobs = customer?.recentJobs;
    const recentPayments = customer?.recentPayments;
    const jobStats = customer?.jobStats;
    const propertyStats = customer?.propertyStats;
    const paymentStats = customer?.paymentStats;

    // Sort items by date (newest first)
    const sortedRecentJobs = useMemo(() => {
      if (!recentJobs || recentJobs.length === 0) return [];
      return [...recentJobs].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA; // Descending order (newest first)
      });
    }, [recentJobs]);

    const jobPaymentMap = useMemo(() => {
      if (!recentJobs || recentJobs.length === 0) return new Map();
      const paymentMap = new Map<
        string,
        {
          jobId: string;
          jobTitle: string;
          paymentType: "deposit" | "completion";
        }
      >();
      recentJobs.forEach(
        (job: {
          _id?: string;
          title?: string;
          acceptedBid?: {
            depositPaymentId?: string;
            completionPaymentId?: string;
          };
          bids?: Array<{
            depositPaymentId?: string;
            completionPaymentId?: string;
            status?: string;
          }>;
        }) => {
          const jobId = job._id;
          const jobTitle = job.title || "Job";
          if (!jobId) return;

          if (job.acceptedBid) {
            if (job.acceptedBid.depositPaymentId) {
              paymentMap.set(job.acceptedBid.depositPaymentId, {
                jobId,
                jobTitle,
                paymentType: "deposit",
              });
            }
            if (job.acceptedBid.completionPaymentId) {
              paymentMap.set(job.acceptedBid.completionPaymentId, {
                jobId,
                jobTitle,
                paymentType: "completion",
              });
            }
          }
          if (job.bids) {
            job.bids.forEach((bid) => {
              if (bid.status === "accepted") {
                if (bid.depositPaymentId) {
                  paymentMap.set(bid.depositPaymentId, {
                    jobId,
                    jobTitle,
                    paymentType: "deposit",
                  });
                }
                if (bid.completionPaymentId) {
                  paymentMap.set(bid.completionPaymentId, {
                    jobId,
                    jobTitle,
                    paymentType: "completion",
                  });
                }
              }
            });
          }
        }
      );
      return paymentMap;
    }, [recentJobs]);

    const handleViewJob = useCallback(
      async (jobId: string) => {
        if (!jobId) return;

        setJobDetailModalOpen(true);

        try {
          await dispatch(getJobByIdThunk(jobId));
        } catch (error) {
          console.error("Failed to fetch job details:", error);
        }
      },
      [dispatch]
    );

    const handleCloseJobDetail = useCallback(() => {
      setJobDetailModalOpen(false);
    }, []);

    // Memoized render function for job items
    const renderJobItem = useCallback(
      (job: any, index: number) => {
        const jobId = job._id;
        if (!jobId) return null;

        return (
          <div
            key={jobId || index}
            onClick={() => handleViewJob(jobId)}
            className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 xs:gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
          >
            <div className="flex-1 min-w-0 w-full xs:w-auto">
              <p
                className="text-sm font-medium text-gray-900 truncate"
                title={job.title}
              >
                {truncateString(job.title || "Untitled Job", 60)}
              </p>
              <p className="text-xs text-gray-500 truncate mt-1">
                {truncateString(job.property?.title || "N/A", 40)} •{" "}
                {job.bidCount || 0} bids
              </p>
              {job.createdAt && (
                <p className="text-xs text-gray-400 mt-1">
                  Created: {formatDate(job.createdAt)}
                </p>
              )}
            </div>
            <div className="flex flex-row xs:flex-col items-start xs:items-end gap-2 xs:gap-1 w-full xs:w-auto xs:ml-4 flex-shrink-0">
              <p className="text-sm font-medium text-green-600 whitespace-nowrap">
                {formatCurrency(job.estimate ? job.estimate / 100 : 0)}
              </p>
              <span
                className={`inline-flex px-2 py-1 text-xs rounded-full whitespace-nowrap ${
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
        );
      },
      [handleViewJob]
    );

    const renderPaymentItem = useCallback(
      (payment: any, index: number) => {
        const amount = payment.amount ? payment.amount / 100 : 0;

        const paymentObj = payment as {
          _id?: string;
          paymentType?: string;
          type?: string;
          purpose?: string;
          job?: { _id?: string; title?: string };
          jobId?: string;
          billingPeriod?: "monthly" | "yearly";
          paymentMethod?: string;
          planId?: string;
          membership?: any;
          details?: {
            type?: string;
            data?: {
              jobId?: string;
              jobSummary?: { title?: string };
            };
          };
        };

        let paymentTypeLabel = "Payment";
        let paymentTypeBadge = "Stripe Payment";
        let badgeColorClass = "bg-blue-100 text-blue-800";

        let linkedJobId: string | null = null;
        if (paymentObj._id && jobPaymentMap.has(paymentObj._id)) {
          const jobInfo = jobPaymentMap.get(paymentObj._id)!;
          linkedJobId = jobInfo.jobId;
          if (jobInfo.paymentType === "deposit") {
            paymentTypeLabel = truncateString(jobInfo.jobTitle, 50);
            paymentTypeBadge = "Job Deposit";
            badgeColorClass = "bg-amber-100 text-amber-800";
          } else if (jobInfo.paymentType === "completion") {
            paymentTypeLabel = truncateString(jobInfo.jobTitle, 50);
            paymentTypeBadge = "Job Completion";
            badgeColorClass = "bg-green-100 text-green-800";
          }
        }
        // Check payment type from API response
        else if (paymentObj.paymentType) {
          if (paymentObj.paymentType === "job_deposit") {
            linkedJobId = paymentObj.job?._id || paymentObj.jobId || null;
            paymentTypeLabel = truncateString(
              paymentObj.job?.title || "Job Deposit",
              50
            );
            paymentTypeBadge = "Job Deposit";
            badgeColorClass = "bg-amber-100 text-amber-800";
          } else if (paymentObj.paymentType === "job_completion") {
            linkedJobId = paymentObj.job?._id || paymentObj.jobId || null;
            paymentTypeLabel = truncateString(
              paymentObj.job?.title || "Job Completion",
              50
            );
            paymentTypeBadge = "Job Completion";
            badgeColorClass = "bg-green-100 text-green-800";
          } else if (paymentObj.paymentType === "job") {
            linkedJobId = paymentObj.job?._id || paymentObj.jobId || null;
            paymentTypeLabel = truncateString(
              paymentObj.job?.title || "Job Payment",
              50
            );
            paymentTypeBadge = "Job Payment";
            badgeColorClass = "bg-blue-100 text-blue-800";
          } else if (paymentObj.paymentType === "membership") {
            paymentTypeLabel = `Membership (${
              paymentObj.billingPeriod || "monthly"
            })`;
            paymentTypeBadge = "Membership";
            badgeColorClass = "bg-purple-100 text-purple-800";
          }
        }
        // Check type field
        else if (paymentObj.type === "membership") {
          paymentTypeLabel = `Membership (${
            paymentObj.billingPeriod || "monthly"
          })`;
          paymentTypeBadge = "Membership";
          badgeColorClass = "bg-purple-100 text-purple-800";
        } else if (paymentObj.type === "job") {
          linkedJobId = paymentObj.job?._id || paymentObj.jobId || null;
          paymentTypeLabel = truncateString(
            paymentObj.job?.title || "Job Payment",
            50
          );
          paymentTypeBadge = "Job Payment";
          badgeColorClass = "bg-blue-100 text-blue-800";
        }
        // Check purpose field
        else if (paymentObj.purpose) {
          const purpose = paymentObj.purpose.toLowerCase();
          if (purpose.includes("membership")) {
            paymentTypeLabel = `Membership (${
              paymentObj.billingPeriod || "monthly"
            })`;
            paymentTypeBadge = "Membership";
            badgeColorClass = "bg-purple-100 text-purple-800";
          } else if (purpose.includes("deposit")) {
            linkedJobId =
              paymentObj.job?._id ||
              paymentObj.jobId ||
              paymentObj.details?.data?.jobId ||
              null;
            paymentTypeLabel = truncateString(
              paymentObj.job?.title || "Job Deposit",
              50
            );
            paymentTypeBadge = "Job Deposit";
            badgeColorClass = "bg-amber-100 text-amber-800";
          } else if (purpose.includes("completion")) {
            linkedJobId =
              paymentObj.job?._id ||
              paymentObj.jobId ||
              paymentObj.details?.data?.jobId ||
              null;
            paymentTypeLabel = truncateString(
              paymentObj.job?.title || "Job Completion",
              50
            );
            paymentTypeBadge = "Job Completion";
            badgeColorClass = "bg-green-100 text-green-800";
          } else if (purpose.includes("job")) {
            linkedJobId =
              paymentObj.job?._id ||
              paymentObj.jobId ||
              paymentObj.details?.data?.jobId ||
              null;
            paymentTypeLabel = truncateString(
              paymentObj.job?.title || "Job Payment",
              50
            );
            paymentTypeBadge = "Job Payment";
            badgeColorClass = "bg-blue-100 text-blue-800";
          }
        }
        // Check membership-related fields
        else if (
          paymentObj.planId ||
          paymentObj.billingPeriod ||
          paymentObj.membership
        ) {
          paymentTypeLabel = `Membership (${
            paymentObj.billingPeriod || "monthly"
          })`;
          paymentTypeBadge = "Membership";
          badgeColorClass = "bg-purple-100 text-purple-800";
        }
        // Check details field for job ID
        if (!linkedJobId && paymentObj.details?.type === "job") {
          linkedJobId = paymentObj.details?.data?.jobId || null;
        }

        return (
          <div
            key={payment._id || index}
            onClick={() => linkedJobId && handleViewJob(linkedJobId)}
            className={`flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 xs:gap-3 p-3 bg-gray-50 rounded-lg ${
              linkedJobId
                ? "cursor-pointer hover:bg-gray-100 transition-colors"
                : ""
            }`}
          >
            <div className="flex-1 min-w-0 w-full xs:w-auto">
              <p className="text-sm font-medium text-gray-900">
                {formatCurrency(amount)}
              </p>
              <p
                className="text-xs text-gray-500 mt-1.5 truncate"
                title={paymentTypeLabel}
              >
                {paymentTypeLabel}
              </p>
              {payment.createdAt && (
                <p className="text-xs text-gray-400 mt-1">
                  {formatDate(payment.createdAt)}
                </p>
              )}
            </div>
            <div className="flex flex-row xs:flex-col items-start xs:items-end gap-2 w-full xs:w-auto flex-shrink-0">
              <span
                className={`inline-flex px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                  payment.status === "succeeded"
                    ? "bg-green-100 text-green-800"
                    : payment.status === "pending"
                    ? "bg-accent-100 text-accent-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {payment.status}
              </span>
              <span
                className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${badgeColorClass}`}
              >
                {paymentTypeBadge}
              </span>
            </div>
          </div>
        );
      },
      [jobPaymentMap, handleViewJob]
    );

    const totalPaymentAmount = useMemo(() => {
      return paymentStats?.totalAmount ? paymentStats.totalAmount / 100 : 0;
    }, [paymentStats?.totalAmount]);

    const sortedRecentPayments = useMemo(() => {
      if (!recentPayments || recentPayments.length === 0) return [];
      return [...recentPayments].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    }, [recentPayments]);

    const statCards = useMemo(
      () => [
        {
          title: "Total Jobs",
          value: jobStats?.totalJobs ?? 0,
          icon: Briefcase,
          color: "bg-primary-500",
          textColor: "text-primary-600",
          bgColor: "bg-primary-50",
        },
        {
          title: "Open Jobs",
          value: jobStats?.openJobs ?? 0,
          icon: Clock,
          color: "bg-accent-500",
          textColor: "text-accent-600",
          bgColor: "bg-accent-50",
        },
        {
          title: "In Progress",
          value:
            jobStats?.inProgressJobs ??
            (jobStats?.totalJobs &&
            jobStats?.openJobs !== undefined &&
            jobStats?.completedJobs !== undefined
              ? Math.max(
                  0,
                  jobStats.totalJobs -
                    jobStats.openJobs -
                    jobStats.completedJobs
                )
              : 0),
          icon: Wrench,
          color: "bg-primary-500",
          textColor: "text-primary-600",
          bgColor: "bg-primary-50",
        },
        {
          title: "Completed",
          value: jobStats?.completedJobs ?? 0,
          icon: CheckCircle,
          color: "bg-green-500",
          textColor: "text-green-600",
          bgColor: "bg-green-50",
        },
        {
          title: "Properties",
          value: propertyStats?.totalProperties ?? 0,
          icon: Building,
          color: "bg-primary-400",
          textColor: "text-primary-600",
          bgColor: "bg-primary-50",
        },
      ],
      [jobStats, propertyStats]
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
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-3 xs:gap-0">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Dashboard Overview
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
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {statCards.slice(0, 3).map((card) => (
            <StatCard key={card.title} {...card} loading={isLoading} />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          {statCards.slice(3).map((card) => (
            <StatCard key={card.title} {...card} loading={isLoading} />
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-stretch">
          {/* Recent Jobs */}
          <RecentActivityCard
            title="Recent Jobs"
            items={sortedRecentJobs}
            loading={isLoading}
            emptyMessage="No recent jobs"
            renderItem={renderJobItem}
          />

          {/* Recent Payments */}
          <RecentActivityCard
            title="My Payments"
            items={sortedRecentPayments}
            loading={isLoading}
            emptyMessage="No recent payments"
            totalAmount={totalPaymentAmount}
            renderItem={renderPaymentItem}
          />
        </div>

        {/* Job Detail Modal */}
        {jobDetailModalOpen && currentJob && (
          <JobDetailViewModal
            isOpen={jobDetailModalOpen}
            onClose={handleCloseJobDetail}
            job={currentJob as Job}
            onRefreshJobs={onRefresh || (() => {})}
            shouldRefetch={false}
          />
        )}
      </div>
    );
  });

CustomerDashboardCards.displayName = "CustomerDashboardCards";

export default CustomerDashboardCards;
