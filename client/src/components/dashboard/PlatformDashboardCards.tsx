import React, { useMemo, memo, useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { createSelector } from "@reduxjs/toolkit";
import {
  Users,
  Briefcase,
  Activity,
  RefreshCw,
  Shield,
  Building2,
  CheckCircle,
  Crown,
  Star,
  Zap,
} from "lucide-react";
import type { RootState } from "../../store";
import Loader from "../ui/Loader";
import { formatCurrency } from "../../utils";

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
      className={`${bgColor} rounded-lg shadow-sm p-3 sm:p-4 md:p-6 border border-gray-200 flex flex-col items-center transition-all duration-200 hover:shadow-md hover:border-gray-300 min-h-[100px] sm:min-h-[120px] md:min-h-[140px]`}
    >
      <div
        className={`${color} p-2 sm:p-3 rounded-full mb-2 sm:mb-3 flex items-center justify-center shadow-sm`}
      >
        <Icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
      </div>
      <div
        className={`text-lg sm:text-xl md:text-2xl font-bold ${textColor} mb-1 sm:mb-2`}
      >
        {loading ? (
          <Loader size="small" color="gray" />
        ) : typeof value === "number" ? (
          value.toLocaleString()
        ) : (
          value
        )}
      </div>
      <p className="text-sm font-semibold text-gray-700 text-center uppercase tracking-wide leading-tight">
        {title}
      </p>
      {subtitle && (
        <p className="text-xs text-gray-600 mt-2 text-center leading-tight font-medium">
          {subtitle}
        </p>
      )}
    </div>
  )
);

StatCard.displayName = "StatCard";

interface PlatformDashboardCardsProps {
  data?: any;
  onRefresh?: () => void;
}

// Memoized selector to prevent unnecessary re-renders
const selectDashboardData = createSelector(
  [
    (state: RootState) => state.dashboard.data,
    (state: RootState) => state.dashboard.platformData,
    (state: RootState) => state.dashboard.platformError,
    (state: RootState) => state.dashboard.platformLastFetched,
    (state: RootState) => state.dashboard.platformLoading,
    (state: RootState) => state.investmentOpportunity.statistics,
  ],
  (
    data,
    platformData,
    platformError,
    platformLastFetched,
    platformLoading,
    investmentStatistics
  ) => ({
    data,
    platformData,
    platformError,
    platformLastFetched,
    platformLoading,
    investmentStatistics,
  })
);

export const PlatformDashboardCards = memo<PlatformDashboardCardsProps>(
  ({ data, onRefresh }) => {
    const dashboardState = useSelector(selectDashboardData);

    // Local loading state for immediate UI feedback
    const [isRefreshing, setIsRefreshing] = useState(false);

    const dashboardData =
      data || dashboardState.data || dashboardState.platformData;
    const isLoading =
      dashboardState.platformLoading || !dashboardData || isRefreshing;

    // Handle refresh with immediate loading state
    const handleRefresh = useCallback(() => {
      setIsRefreshing(true);
      if (onRefresh) {
        onRefresh();
        // Reset local loading state after a short delay to allow Redux to take over
        setTimeout(() => setIsRefreshing(false), 100);
      }
    }, [onRefresh]);
    const platform = dashboardData?.platform || dashboardData;
    const summary =
      dashboardData?.summary || dashboardState.platformData?.summary;

    // Extract specific values for better memoization
    const users = platform?.users;
    const jobs = platform?.jobs;
    const memberships = platform?.memberships;
    const healthScore = summary?.healthScore;
    const userRoles = users?.roles;
    const membershipBreakdown = memberships?.membershipBreakdown;
    const investmentStats = dashboardState.investmentStatistics;

    const getRoleColors = useCallback((roleName: string) => {
      switch (roleName.toLowerCase()) {
        case "admin":
          return {
            bg: "from-red-50 to-red-100",
            border: "border-red-200",
            text: "text-red-700",
            icon: "text-red-600",
          };
        case "customer":
          return {
            bg: "from-blue-50 to-blue-100",
            border: "border-blue-200",
            text: "text-blue-700",
            icon: "text-blue-600",
          };
        case "contractor":
          return {
            bg: "from-green-50 to-green-100",
            border: "border-green-200",
            text: "text-green-700",
            icon: "text-green-600",
          };
        default:
          return {
            bg: "from-gray-50 to-gray-100",
            border: "border-gray-200",
            text: "text-gray-700",
            icon: "text-gray-600",
          };
      }
    }, []);

    const statCards = useMemo(
      () => [
        {
          title: "Total Users",
          value: users?.totalUsers ?? 0,
          icon: Users,
          color: "bg-primary-500",
          textColor: "text-primary-600",
          bgColor: "bg-primary-50",
          subtitle: `${users?.totalApproved ?? 0} approved`,
        },
        {
          title: "Total Jobs",
          value: jobs?.totalJobs ?? 0,
          icon: Briefcase,
          color: "bg-primary-500",
          textColor: "text-primary-600",
          bgColor: "bg-primary-50",
          subtitle: `${jobs?.openJobs ?? 0} open`,
        },
        {
          title: "Completed Jobs",
          value: jobs?.completedJobs ?? 0,
          icon: CheckCircle,
          color: "bg-green-500",
          textColor: "text-green-600",
          bgColor: "bg-green-50",
        },
        {
          title: "Active Memberships",
          value: memberships?.totalMemberships ?? 0,
          icon: Shield,
          color: "bg-accent-500",
          textColor: "text-accent-600",
          bgColor: "bg-accent-50",
        },
        {
          title: "Platform Health",
          value: `${(healthScore ?? 0).toFixed(1)}%`,
          icon: Activity,
          color: "bg-primary-400",
          textColor: "text-primary-600",
          bgColor: "bg-primary-50",
        },
      ],
      [users, jobs, memberships, healthScore]
    );

    if (dashboardState.platformError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">
            Error loading dashboard: {dashboardState.platformError}
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
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Platform Analytics
            </h2>
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
          {dashboardState.platformLastFetched && (
            <p className="text-xs sm:text-sm text-gray-500">
              Last updated:{" "}
              {new Date(dashboardState.platformLastFetched).toLocaleString()}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {statCards.map((card) => (
            <StatCard key={card.title} {...card} loading={isLoading} />
          ))}
        </div>

        {/* User Role Breakdown */}
        {userRoles && userRoles.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 mr-3">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                User Role Breakdown
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {userRoles.map((role: any) => {
                const colors = getRoleColors(role.role);

                return (
                  <div
                    key={role.role}
                    className={`bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-lg p-4`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`font-medium ${colors.text} capitalize`}>
                        {role.role}s
                      </h4>
                      <span className={`text-2xl font-bold ${colors.text}`}>
                        {role.count}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-green-600">Approved:</span>
                        <span className="font-medium">{role.approved}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-amber-600">Pending:</span>
                        <span className="font-medium">{role.pending}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-600">Rejected:</span>
                        <span className="font-medium">{role.rejected}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Job Status Overview */}
        {jobs && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 mr-3">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Job Status Overview
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-700">
                  {jobs.openJobs}
                </div>
                <div className="text-sm font-medium text-green-600 uppercase tracking-wide">
                  Open Jobs
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">
                  {jobs.inProgressJobs}
                </div>
                <div className="text-sm font-medium text-blue-600 uppercase tracking-wide">
                  In Progress
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-700">
                  {jobs.completedJobs}
                </div>
                <div className="text-sm font-medium text-purple-600 uppercase tracking-wide">
                  Completed
                </div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-pink-100 border border-red-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-700">
                  {jobs.cancelledJobs}
                </div>
                <div className="text-sm font-medium text-red-600 uppercase tracking-wide">
                  Cancelled
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Membership Analytics */}
        {memberships && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 mr-3">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Membership Analytics
                </h3>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-700">
                  {memberships.totalMemberships}
                </div>
                <div className="text-sm text-gray-500">Total Memberships</div>
              </div>
            </div>

            {/* Membership Breakdown */}
            {membershipBreakdown && membershipBreakdown.length > 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {membershipBreakdown.map((membership: any) => {
                    const membershipConfig = {
                      active: {
                        bg: "from-blue-50 to-blue-100",
                        border: "border-blue-200",
                        text: "text-blue-700",
                        icon: "text-blue-500",
                        bgDot: "bg-blue-500",
                        iconComponent: Shield,
                      },
                      upgraded: {
                        bg: "from-green-50 to-green-100",
                        border: "border-green-200",
                        text: "text-green-700",
                        icon: "text-green-500",
                        bgDot: "bg-green-500",
                        iconComponent: Crown,
                      },
                      premium: {
                        bg: "from-purple-50 to-purple-100",
                        border: "border-purple-200",
                        text: "text-purple-700",
                        icon: "text-purple-500",
                        bgDot: "bg-purple-500",
                        iconComponent: Star,
                      },
                      basic: {
                        bg: "from-orange-50 to-orange-100",
                        border: "border-orange-200",
                        text: "text-orange-700",
                        icon: "text-orange-500",
                        bgDot: "bg-orange-500",
                        iconComponent: Zap,
                      },
                    };

                    const config =
                      membershipConfig[
                        membership.status as keyof typeof membershipConfig
                      ] || membershipConfig.basic;
                    const IconComponent = config.iconComponent;

                    return (
                      <div
                        key={membership.status}
                        className={`bg-gradient-to-br ${config.bg} border ${config.border} rounded-lg p-4 sm:p-5 lg:p-6 hover:shadow-md transition-all duration-200 flex items-center space-x-3 sm:space-x-4 lg:space-x-6`}
                      >
                        <div
                          className={`p-2 sm:p-3 lg:p-4 rounded-xl ${config.bgDot} bg-opacity-20 flex-shrink-0`}
                        >
                          <IconComponent
                            className={`h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 ${config.icon}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4
                            className={`font-semibold ${config.text} capitalize text-base sm:text-lg mb-1 sm:mb-2`}
                          >
                            {membership.status}
                          </h4>
                          <div className="flex items-baseline space-x-1 sm:space-x-2">
                            <span
                              className={`text-2xl sm:text-3xl font-bold ${config.text}`}
                            >
                              {membership.count}
                            </span>
                            <span className="text-gray-500 text-xs sm:text-sm">
                              members
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div
                            className={`text-xl sm:text-2xl font-bold ${config.text}`}
                          >
                            {(
                              (membership.count /
                                memberships.totalMemberships) *
                              100
                            ).toFixed(1)}
                            %
                          </div>
                          <span className="text-xs text-gray-500">share</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary Stats */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4 sm:p-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4 text-center">
                    Quick Overview
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-3 shadow-sm">
                      <div className="text-lg sm:text-xl font-bold text-gray-800">
                        {memberships.totalMemberships}
                      </div>
                      <div className="text-xs text-gray-600 uppercase tracking-wide">
                        Total Members
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-3 shadow-sm">
                      <div className="text-lg sm:text-xl font-bold text-blue-700">
                        {membershipBreakdown?.find(
                          (m: any) => m.status === "active"
                        )?.count || 0}
                      </div>
                      <div className="text-xs text-blue-600 uppercase tracking-wide">
                        Active
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-3 shadow-sm">
                      <div className="text-lg sm:text-xl font-bold text-green-700">
                        {membershipBreakdown?.find(
                          (m: any) => m.status === "upgraded"
                        )?.count || 0}
                      </div>
                      <div className="text-xs text-green-600 uppercase tracking-wide">
                        Upgraded
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-3 shadow-sm">
                      <div className="text-lg sm:text-xl font-bold text-purple-700">
                        {membershipBreakdown?.find(
                          (m: any) => m.status === "premium"
                        )?.count || 0}
                      </div>
                      <div className="text-xs text-purple-600 uppercase tracking-wide">
                        Premium
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Investment Opportunities Overview */}
        {investmentStats && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 mr-3">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Investment Opportunities
              </h3>
            </div>

            {/* Overall Stats */}
            {investmentStats.overallStats &&
              investmentStats.overallStats[0] && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-lg p-3 sm:p-4 text-center">
                    <div className="text-xl sm:text-2xl font-bold text-blue-700">
                      {investmentStats.overallStats[0].totalOpportunities}
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-blue-600 uppercase tracking-wide">
                      Total
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-lg p-3 sm:p-4 text-center">
                    <div className="text-xl sm:text-2xl font-bold text-green-700">
                      {formatCurrency(
                        investmentStats.overallStats[0].totalValue / 100
                      )}
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-green-600 uppercase tracking-wide">
                      Value
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-lg p-3 sm:p-4 text-center">
                    <div className="text-xl sm:text-2xl font-bold text-purple-700">
                      {investmentStats.overallStats[0].avgROI.toFixed(1)}%
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-purple-600 uppercase tracking-wide">
                      Avg ROI
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-amber-100 border border-orange-200 rounded-lg p-3 sm:p-4 text-center">
                    <div className="text-xl sm:text-2xl font-bold text-orange-700">
                      {investmentStats.overallStats[0].totalInterests}
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-orange-600 uppercase tracking-wide">
                      Interests
                    </div>
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    );
  }
);

PlatformDashboardCards.displayName = "PlatformDashboardCards";

export default PlatformDashboardCards;
