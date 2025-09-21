import React, { useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  Users,
  Briefcase,
  DollarSign,
  Target,
  Activity,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
} from "lucide-react";
import type { RootState } from "../../store";
import Loader from "../ui/Loader";

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

interface PlatformDashboardCardsProps {
  data?: any;
  loading?: boolean;
  onRefresh?: () => void;
}

export const PlatformDashboardCards: React.FC<PlatformDashboardCardsProps> = ({
  data,
  loading = false,
  onRefresh,
}) => {
  const { platformData, platformError, platformLastFetched } = useSelector(
    (state: RootState) => state.dashboard
  );

  // Use prop data if available, fallback to Redux state
  const dashboardData = data || platformData;

  // Dashboard data is loaded by the main Dashboard component
  // No need to call API here to avoid multiple calls

  if (platformError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Error loading dashboard: {platformError}</p>
        <button
          onClick={onRefresh}
          className="mt-2 text-red-600 hover:text-red-800 font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Handle both unified data structure and platform-specific structure
  const platform = dashboardData?.platform || dashboardData;
  const summary = dashboardData?.summary || platformData?.summary;

  const statCards = useMemo(
    () => [
      {
        title: "Total Users",
        value: platform?.users.totalUsers ?? 0,
        icon: Users,
        color: "bg-primary-500",
        textColor: "text-primary-600",
        bgColor: "bg-primary-50",
      },
      {
        title: "Total Jobs",
        value: platform?.jobs.totalJobs ?? 0,
        icon: Briefcase,
        color: "bg-accent-500",
        textColor: "text-accent-600",
        bgColor: "bg-accent-50",
      },
      {
        title: "Total Revenue",
        value: `$${(
          (platform?.payments.totalAmount ?? 0) / 100
        ).toLocaleString()}`,
        icon: DollarSign,
        color: "bg-green-500",
        textColor: "text-green-600",
        bgColor: "bg-green-50",
      },
      {
        title: "Pending Users",
        value: platform?.users.totalPending ?? 0,
        icon: AlertCircle,
        color: "bg-amber-500",
        textColor: "text-amber-600",
        bgColor: "bg-amber-50",
      },
      {
        title: "Health Score",
        value: `${(summary?.healthScore ?? 0).toFixed(1)}%`,
        icon: Activity,
        color: "bg-purple-500",
        textColor: "text-purple-600",
        bgColor: "bg-purple-50",
      },
    ],
    [platform, summary]
  );

  const getActivityConfig = useCallback((activity: any) => {
    const type = activity.type || "job_created";

    switch (type) {
      case "user_registration":
        return {
          icon: Users,
          iconColor: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          title: "User Registration",
          subtitle: `${activity.role?.toUpperCase()} • ${activity.email}`,
          badge: activity.role === "contractor" ? "Contractor" : "Customer",
          badgeColor:
            activity.role === "contractor"
              ? "bg-purple-100 text-purple-800"
              : "bg-blue-100 text-blue-800",
          trend: null,
        };
      case "bid_placed":
        return {
          icon: Target,
          iconColor: "text-purple-600",
          bgColor: "bg-purple-50",
          borderColor: "border-purple-200",
          title: "Bid Submitted",
          subtitle: `$${(
            activity.bidAmount / 100
          ).toLocaleString()} • ${activity.status?.toUpperCase()}`,
          badge:
            activity.status === "accepted"
              ? "Accepted"
              : activity.status === "pending"
              ? "Pending"
              : "Rejected",
          badgeColor:
            activity.status === "accepted"
              ? "bg-green-100 text-green-800"
              : activity.status === "pending"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800",
          trend:
            activity.status === "accepted"
              ? "up"
              : activity.status === "rejected"
              ? "down"
              : null,
        };
      case "payment_processed":
        return {
          icon: DollarSign,
          iconColor: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          title: "Payment Processed",
          subtitle: `$${(
            activity.amount / 100
          ).toLocaleString()} • ${activity.status?.toUpperCase()}`,
          badge: activity.status === "succeeded" ? "Success" : "Failed",
          badgeColor:
            activity.status === "succeeded"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800",
          trend: activity.status === "succeeded" ? "up" : "down",
        };
      case "job_created":
        const jobValue = activity.estimate ? activity.estimate / 100 : 0;
        return {
          icon: Briefcase,
          iconColor: "text-accent-600",
          bgColor: "bg-accent-50",
          borderColor: "border-accent-200",
          title: `Job Posted: ${activity.title}`,
          subtitle: `${activity.service?.toUpperCase()} • $${jobValue.toLocaleString()} • ${activity.status?.toUpperCase()}`,
          badge:
            activity.status === "completed"
              ? "Completed"
              : activity.status === "inprogress"
              ? "In Progress"
              : activity.status === "cancelled"
              ? "Cancelled"
              : "Open",
          badgeColor:
            activity.status === "completed"
              ? "bg-green-100 text-green-800"
              : activity.status === "inprogress"
              ? "bg-blue-100 text-blue-800"
              : activity.status === "cancelled"
              ? "bg-red-100 text-red-800"
              : "bg-yellow-100 text-yellow-800",
          trend:
            activity.status === "completed"
              ? "up"
              : activity.status === "cancelled"
              ? "down"
              : null,
        };
      default:
        return {
          icon: Activity,
          iconColor: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          title: "Platform Activity",
          subtitle: activity.status ? `Status: ${activity.status}` : "",
          badge: "Activity",
          badgeColor: "bg-gray-100 text-gray-800",
          trend: null,
        };
    }
  }, []);

  const getTrendIcon = useCallback((trend: string | null) => {
    switch (trend) {
      case "up":
        return <ArrowUpRight className="h-3 w-3 text-green-600" />;
      case "down":
        return <ArrowDownRight className="h-3 w-3 text-red-600" />;
      default:
        return null;
    }
  }, []);

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Platform Analytics
          </h2>
          {platformLastFetched && (
            <p className="text-sm text-gray-500">
              Last updated: {new Date(platformLastFetched).toLocaleString()}
            </p>
          )}
        </div>
        <button
          onClick={onRefresh}
          disabled={false}
          className="flex items-center px-4 py-2 text-sm font-medium text-accent-600 bg-accent-50 border border-accent-200 rounded-lg hover:bg-accent-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${false ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold">
                ${((summary?.totalRevenue ?? 0) / 100).toLocaleString()}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-primary-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-accent-500 to-accent-600 rounded-lg shadow p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-accent-100 text-sm">Total Users</p>
              <p className="text-2xl font-bold">
                {(summary?.totalUsers ?? 0).toLocaleString()}
              </p>
            </div>
            <Users className="h-8 w-8 text-accent-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Jobs</p>
              <p className="text-2xl font-bold">
                {(summary?.totalJobs ?? 0).toLocaleString()}
              </p>
            </div>
            <Briefcase className="h-8 w-8 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Health Score</p>
              <p className="text-2xl font-bold">
                {(summary?.healthScore ?? 0).toFixed(1)}%
              </p>
            </div>
            <Activity className="h-8 w-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Essential Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} loading={false} />
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6">
        {/* Platform Activity Analytics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Zap className="h-5 w-5 text-accent-600 mr-2" />
                Platform Activity Analytics
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Real-time business metrics and platform events
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center px-3 py-1 bg-green-50 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                <span className="text-xs font-medium text-green-700">Live</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader size="large" color="accent" />
            </div>
          ) : (platform?.recentActivity ?? []).length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No recent activity</p>
              <p className="text-gray-400 text-sm">
                Platform events will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Quick Analytics */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {(platform?.recentActivity ?? []).length}
                  </div>
                  <div className="text-xs text-gray-500">Total Events</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {
                      (platform?.recentActivity ?? []).filter(
                        (a: any) =>
                          a.status === "succeeded" ||
                          a.status === "accepted" ||
                          a.status === "completed"
                      ).length
                    }
                  </div>
                  <div className="text-xs text-gray-500">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {
                      (platform?.recentActivity ?? []).filter(
                        (a: any) => a.type === "user_registration"
                      ).length
                    }
                  </div>
                  <div className="text-xs text-gray-500">New Users</div>
                </div>
              </div>

              {/* Section Title */}
              <div className="border-b border-gray-200 pb-3">
                <h4 className="text-lg font-semibold text-gray-900">
                  Recent User Registration
                </h4>
                <p className="text-sm text-gray-500">
                  Latest platform activities and events
                </p>
              </div>

              {/* Activity Feed */}
              <div className="space-y-4">
                {(platform?.recentActivity ?? [])
                  .slice(0, 8)
                  .map((activity: any, index: number) => {
                    const config = getActivityConfig(activity);
                    const IconComponent = config.icon;
                    const trendIcon = getTrendIcon(config.trend);
                    const timeAgo = new Date(
                      activity.createdAt
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const dateFormatted = new Date(
                      activity.createdAt
                    ).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    });

                    return (
                      <div
                        key={activity._id || index}
                        className={`relative p-4 rounded-xl border-2 ${config.borderColor} ${config.bgColor}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <div
                              className={`p-2 rounded-lg ${config.bgColor} border ${config.borderColor}`}
                            >
                              <IconComponent
                                className={`h-5 w-5 ${config.iconColor}`}
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="text-sm font-semibold text-gray-900 truncate">
                                  {config.title}
                                </h4>
                                {trendIcon}
                              </div>

                              <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                                {config.subtitle}
                              </p>

                              <div className="flex items-center justify-between">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.badgeColor}`}
                                >
                                  {config.badge}
                                </span>

                                <div className="text-right">
                                  <div className="text-xs font-medium text-gray-900">
                                    {timeAgo}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {dateFormatted}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

PlatformDashboardCards.displayName = "PlatformDashboardCards";

export default PlatformDashboardCards;
