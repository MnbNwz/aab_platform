import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { createSelector } from "@reduxjs/toolkit";
import {
  Users,
  Briefcase,
  Activity,
  RefreshCw,
  Calendar,
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

const StatCard = React.memo<StatCardProps>(
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
      className={`${bgColor} rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200 flex flex-col items-center transition-all duration-200 hover:shadow-md hover:border-gray-300 min-h-[120px] sm:min-h-[140px]`}
    >
      <div
        className={`${color} p-3 rounded-full mb-3 flex items-center justify-center shadow-sm`}
      >
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className={`text-xl sm:text-2xl font-bold ${textColor} mb-2`}>
        {loading ? (
          <Loader size="small" color="gray" />
        ) : typeof value === "number" ? (
          formatCurrency(value)
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

export const PlatformDashboardCards = React.memo<PlatformDashboardCardsProps>(
  ({ data, onRefresh }) => {
    const dashboardState = useSelector(selectDashboardData);

    const dashboardData =
      data || dashboardState.data || dashboardState.platformData;
    const isLoading = dashboardState.platformLoading || !dashboardData;
    const platform = dashboardData?.platform || dashboardData;
    const summary =
      dashboardData?.summary || dashboardState.platformData?.summary;

    const statCards = useMemo(
      () => [
        {
          title: "Total Users",
          value: platform?.users?.totalUsers ?? 0,
          icon: Users,
          color: "bg-primary-500",
          textColor: "text-primary-600",
          bgColor: "bg-primary-50",
          subtitle: `${platform?.users?.totalApproved ?? 0} approved`,
        },
        {
          title: "Total Jobs",
          value: platform?.jobs?.totalJobs ?? 0,
          icon: Briefcase,
          color: "bg-blue-500",
          textColor: "text-blue-600",
          bgColor: "bg-blue-50",
          subtitle: `${platform?.jobs?.openJobs ?? 0} open`,
        },
        {
          title: "Completed Jobs",
          value: platform?.jobs?.completedJobs ?? 0,
          icon: CheckCircle,
          color: "bg-green-500",
          textColor: "text-green-600",
          bgColor: "bg-green-50",
        },
        {
          title: "Active Memberships",
          value: platform?.memberships?.totalMemberships ?? 0,
          icon: Shield,
          color: "bg-purple-500",
          textColor: "text-purple-600",
          bgColor: "bg-purple-50",
        },
        {
          title: "Platform Health",
          value: `${(summary?.healthScore ?? 0).toFixed(1)}%`,
          icon: Activity,
          color: "bg-orange-500",
          textColor: "text-orange-600",
          bgColor: "bg-orange-50",
        },
      ],
      [
        platform?.users,
        platform?.jobs,
        platform?.memberships,
        summary?.healthScore,
      ]
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Platform Analytics
              </h2>
              <div className="flex items-center px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>
            {dashboardState.platformLastFetched && (
              <p className="text-xs sm:text-sm text-gray-500">
                Last updated:{" "}
                {new Date(dashboardState.platformLastFetched).toLocaleString()}
              </p>
            )}
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-accent-600 bg-accent-50 border border-accent-200 rounded-lg hover:bg-accent-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw
              className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${
                isLoading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {statCards.map((card) => (
            <StatCard key={card.title} {...card} loading={isLoading} />
          ))}
        </div>

        {/* User Role Breakdown */}
        {platform?.users?.roles && platform.users.roles.length > 0 && (
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
              {platform.users.roles.map((role: any) => {
                // Define colors for different roles
                const getRoleColors = (roleName: string) => {
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
                };

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
        {platform?.jobs && (
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
                  {platform.jobs.openJobs}
                </div>
                <div className="text-sm font-medium text-green-600 uppercase tracking-wide">
                  Open Jobs
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">
                  {platform.jobs.inProgressJobs}
                </div>
                <div className="text-sm font-medium text-blue-600 uppercase tracking-wide">
                  In Progress
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-700">
                  {platform.jobs.completedJobs}
                </div>
                <div className="text-sm font-medium text-purple-600 uppercase tracking-wide">
                  Completed
                </div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-pink-100 border border-red-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-700">
                  {platform.jobs.cancelledJobs}
                </div>
                <div className="text-sm font-medium text-red-600 uppercase tracking-wide">
                  Cancelled
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Membership Analytics */}
        {platform?.memberships && (
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
                  {platform.memberships.totalMemberships}
                </div>
                <div className="text-sm text-gray-500">Total Memberships</div>
              </div>
            </div>

            {/* Membership Breakdown */}
            {platform.memberships.membershipBreakdown &&
              platform.memberships.membershipBreakdown.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {platform.memberships.membershipBreakdown.map(
                      (membership: any) => {
                        // Define membership types with specific colors and icons
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
                            className={`bg-gradient-to-br ${config.bg} border ${config.border} rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:scale-105`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center">
                                <IconComponent
                                  className={`h-5 w-5 ${config.icon} mr-2`}
                                />
                                <h4
                                  className={`font-semibold ${config.text} capitalize text-sm sm:text-base`}
                                >
                                  {membership.status}
                                </h4>
                              </div>
                              <div
                                className={`text-xl sm:text-2xl font-bold ${config.text}`}
                              >
                                {membership.count}
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                              <span className="text-gray-600">Members</span>
                              <div className="flex items-center">
                                <div
                                  className={`w-2 h-2 rounded-full ${config.bgDot} mr-2`}
                                ></div>
                                <span className="font-medium text-gray-700">
                                  {(
                                    (membership.count /
                                      platform.memberships.totalMemberships) *
                                    100
                                  ).toFixed(1)}
                                  %
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>

                  {/* Summary Stats */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4 sm:p-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4 text-center">
                      Quick Overview
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-3 shadow-sm">
                        <div className="text-lg sm:text-xl font-bold text-gray-800">
                          {platform.memberships.totalMemberships}
                        </div>
                        <div className="text-xs text-gray-600 uppercase tracking-wide">
                          Total Members
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-3 shadow-sm">
                        <div className="text-lg sm:text-xl font-bold text-blue-700">
                          {platform.memberships.membershipBreakdown?.find(
                            (m: any) => m.status === "active"
                          )?.count || 0}
                        </div>
                        <div className="text-xs text-blue-600 uppercase tracking-wide">
                          Active
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-3 shadow-sm">
                        <div className="text-lg sm:text-xl font-bold text-green-700">
                          {platform.memberships.membershipBreakdown?.find(
                            (m: any) => m.status === "upgraded"
                          )?.count || 0}
                        </div>
                        <div className="text-xs text-green-600 uppercase tracking-wide">
                          Upgraded
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-3 shadow-sm">
                        <div className="text-lg sm:text-xl font-bold text-purple-700">
                          {platform.memberships.membershipBreakdown?.find(
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
        {dashboardState.investmentStatistics && (
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
            {dashboardState.investmentStatistics.overallStats &&
              dashboardState.investmentStatistics.overallStats[0] && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-lg p-3 sm:p-4 text-center">
                    <div className="text-xl sm:text-2xl font-bold text-blue-700">
                      {
                        dashboardState.investmentStatistics.overallStats[0]
                          .totalOpportunities
                      }
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-blue-600 uppercase tracking-wide">
                      Total
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-lg p-3 sm:p-4 text-center">
                    <div className="text-xl sm:text-2xl font-bold text-green-700">
                      {formatCurrency(
                        dashboardState.investmentStatistics.overallStats[0]
                          .totalValue / 100
                      )}
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-green-600 uppercase tracking-wide">
                      Value
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-lg p-3 sm:p-4 text-center">
                    <div className="text-xl sm:text-2xl font-bold text-purple-700">
                      {dashboardState.investmentStatistics.overallStats[0].avgROI.toFixed(
                        1
                      )}
                      %
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-purple-600 uppercase tracking-wide">
                      Avg ROI
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-amber-100 border border-orange-200 rounded-lg p-3 sm:p-4 text-center">
                    <div className="text-xl sm:text-2xl font-bold text-orange-700">
                      {
                        dashboardState.investmentStatistics.overallStats[0]
                          .totalInterests
                      }
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
