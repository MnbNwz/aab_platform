import React, { useEffect, useMemo, memo, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { createSelector } from "@reduxjs/toolkit";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import type { RootState, AppDispatch } from "../../store";
import { fetchAnalyticsThunk } from "../../store/slices/analyticsSlice";
import Loader from "../ui/Loader";
import { formatCurrency, CHART_COLORS } from "../../utils";

const selectAnalyticsState = createSelector(
  [(state: RootState) => state.analytics],
  (analytics) => ({
    data: analytics.data,
    loading: analytics.loading,
    error: analytics.error,
    lastFetched: analytics.lastFetched,
  })
);

// Memoized KPI Card Component
const KPICard = memo(
  ({
    title,
    value,
    subtitle,
    gradientFrom,
    gradientTo,
    textColor,
    subtitleColor,
  }: {
    title: string;
    value: string;
    subtitle: string;
    gradientFrom: string;
    gradientTo: string;
    textColor: string;
    subtitleColor: string;
  }) => (
    <div
      className={`bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white rounded-xl shadow-lg p-4 lg:p-6 hover:shadow-xl transition-shadow min-h-[120px] flex flex-col justify-between`}
    >
      <div>
        <p className={`${textColor} text-sm font-medium mb-2`}>{title}</p>
        <p className="text-2xl lg:text-3xl font-bold mb-1 break-words">
          {value}
        </p>
      </div>
      <p className={`${subtitleColor} text-xs`}>{subtitle}</p>
    </div>
  )
);

KPICard.displayName = "KPICard";

// Memoized Business Intelligence Card Component
const BusinessIntelligenceCard = memo(
  ({
    title,
    value,
    color,
  }: {
    title: string;
    value: string;
    color: string;
  }) => (
    <div className="bg-gray-50 rounded-lg p-3 lg:p-4 border border-gray-200 hover:bg-gray-100 transition-colors min-h-[80px] flex flex-col justify-between">
      <p className="text-xs text-gray-600 uppercase tracking-wide mb-2 font-medium">
        {title}
      </p>
      <p className={`text-xl lg:text-2xl font-bold ${color} break-words`}>
        {value}
      </p>
    </div>
  )
);

BusinessIntelligenceCard.displayName = "BusinessIntelligenceCard";

const Analytics: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading, error, lastFetched } =
    useSelector(selectAnalyticsState);

  // State for pagination and data limits
  const [contractorPage, setContractorPage] = React.useState(0);
  const [customerPage, setCustomerPage] = React.useState(0);

  // Refs to prevent unnecessary re-renders
  const hasInitialized = useRef(false);
  const lastFetchTime = useRef<number>(0);

  const ITEMS_PER_PAGE = 5;
  const MAX_DISPLAY_ITEMS = 10;

  // Optimized useEffect with ref to prevent multiple initial calls
  useEffect(() => {
    const now = Date.now();
    const shouldFetch =
      !data &&
      !loading &&
      !error &&
      (!hasInitialized.current || now - lastFetchTime.current > 30000); // 30 second cooldown

    if (shouldFetch) {
      hasInitialized.current = true;
      lastFetchTime.current = now;
      dispatch(fetchAnalyticsThunk());
    }
  }, [dispatch, data, loading, error]);

  const handleRefresh = useCallback(() => {
    lastFetchTime.current = Date.now();
    dispatch(fetchAnalyticsThunk());
  }, [dispatch]);

  // Memoized pagination handlers
  const handleContractorPageChange = useCallback(
    (direction: "prev" | "next") => {
      setContractorPage((prev) => {
        if (direction === "prev") {
          return Math.max(0, prev - 1);
        } else {
          return prev + 1;
        }
      });
    },
    []
  );

  const handleCustomerPageChange = useCallback((direction: "prev" | "next") => {
    setCustomerPage((prev) => {
      if (direction === "prev") {
        return Math.max(0, prev - 1);
      } else {
        return prev + 1;
      }
    });
  }, []);

  // Memoized computed values - must be called before any early returns
  const totalRevenue = useMemo(() => {
    if (!data?.revenue?.jobs?.summary || !data?.revenue?.memberships?.summary)
      return 0;
    try {
      return (
        ((data.revenue.jobs.summary.totalJobsValue || 0) +
          (data.revenue.memberships.summary.totalRevenue || 0)) /
        100
      );
    } catch (error) {
      console.error("Error calculating total revenue:", error);
      return 0;
    }
  }, [data]);

  const growthRate = useMemo(() => {
    if (!data?.trends?.growth) return 0;
    try {
      return data.trends.growth.jobsGrowthPercent || 0;
    } catch (error) {
      console.error("Error calculating growth rate:", error);
      return 0;
    }
  }, [data]);

  // Pagination logic for contractors
  const contractorData = useMemo(() => {
    if (!data?.performance?.contractors?.topContractors) {
      return { items: [], totalPages: 0, hasMore: false, totalItems: 0 };
    }
    try {
      const contractors = data.performance.contractors.topContractors || [];
      const totalPages = Math.ceil(contractors.length / ITEMS_PER_PAGE);
      const startIndex = contractorPage * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const items = contractors.slice(startIndex, endIndex);

      return {
        items,
        totalPages,
        hasMore: contractorPage < totalPages - 1,
        totalItems: contractors.length,
      };
    } catch (error) {
      console.error("Error processing contractor data:", error);
      return { items: [], totalPages: 0, hasMore: false, totalItems: 0 };
    }
  }, [data, contractorPage]);

  // Pagination logic for customers
  const customerData = useMemo(() => {
    if (!data?.performance?.customers?.topCustomers) {
      return { items: [], totalPages: 0, hasMore: false, totalItems: 0 };
    }
    try {
      const customers = data.performance.customers.topCustomers || [];
      const totalPages = Math.ceil(customers.length / ITEMS_PER_PAGE);
      const startIndex = customerPage * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const items = customers.slice(startIndex, endIndex);

      return {
        items,
        totalPages,
        hasMore: customerPage < totalPages - 1,
        totalItems: customers.length,
      };
    } catch (error) {
      console.error("Error processing customer data:", error);
      return { items: [], totalPages: 0, hasMore: false, totalItems: 0 };
    }
  }, [data, customerPage]);

  // Chart data with limits to prevent overflow
  const chartDataLimits = useMemo(() => {
    if (!data) return {};

    try {
      return {
        contractors: (
          data.performance?.contractors?.topContractors || []
        ).slice(0, MAX_DISPLAY_ITEMS),
        customers: (data.performance?.customers?.topCustomers || []).slice(
          0,
          MAX_DISPLAY_ITEMS
        ),
        services: (data.revenue?.jobs?.serviceRevenue || []).slice(0, 8), // Limit to top 8 services
        membershipTiers: (data.revenue?.memberships?.tierRevenue || []).slice(
          0,
          6
        ), // Limit to 6 tiers
        paymentTypes: (data.revenue?.payments?.typeBreakdown || []).slice(0, 5), // Limit to 5 payment types
      };
    } catch (error) {
      console.error("Error processing chart data limits:", error);
      return {};
    }
  }, [data]);

  const monthlyRevenueData = useMemo(() => {
    if (!data) return [];

    try {
      const monthlyMap = new Map<string, any>();

      // Process job revenue data
      (data.revenue?.jobs?.monthlyRevenue || []).forEach((item) => {
        const key = `${item.year}-${String(item.month).padStart(2, "0")}`;
        if (!monthlyMap.has(key)) {
          monthlyMap.set(key, {
            month: new Date(item.year, item.month - 1).toLocaleDateString(
              "en-US",
              { month: "short", year: "2-digit" }
            ),
            jobs: 0,
            memberships: 0,
            total: 0,
          });
        }
        const current = monthlyMap.get(key);
        current.jobs += (item.totalValue || 0) / 100;
      });

      // Process membership revenue data
      (data.revenue?.memberships?.monthlySignups || []).forEach((item) => {
        const key = `${item.year}-${String(item.month).padStart(2, "0")}`;
        if (!monthlyMap.has(key)) {
          monthlyMap.set(key, {
            month: new Date(item.year, item.month - 1).toLocaleDateString(
              "en-US",
              { month: "short", year: "2-digit" }
            ),
            jobs: 0,
            memberships: 0,
            total: 0,
          });
        }
        const current = monthlyMap.get(key);
        current.memberships += (item.revenue || 0) / 100;
      });

      return Array.from(monthlyMap.values())
        .map((item) => ({
          ...item,
          total: item.jobs + item.memberships,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));
    } catch (error) {
      console.error("Error processing monthly revenue data:", error);
      return [];
    }
  }, [data]);

  const serviceBreakdown = useMemo(() => {
    if (!data || !chartDataLimits.services) return [];

    try {
      const serviceMap = new Map<string, { count: number; revenue: number }>();

      chartDataLimits.services.forEach((item) => {
        if (!item?.service) return;
        const service =
          item.service.charAt(0).toUpperCase() + item.service.slice(1);
        if (!serviceMap.has(service)) {
          serviceMap.set(service, { count: 0, revenue: 0 });
        }
        const current = serviceMap.get(service)!;
        current.count += item.count || 0;
        current.revenue += (item.totalValue || 0) / 100;
      });

      return Array.from(serviceMap.entries()).map(([name, data]) => ({
        name,
        count: data.count,
        revenue: data.revenue,
      }));
    } catch (error) {
      console.error("Error processing service breakdown:", error);
      return [];
    }
  }, [data, chartDataLimits]);

  const membershipDistribution = useMemo(() => {
    if (!data?.revenue?.memberships?.tierRevenue) return [];

    try {
      return data.revenue.memberships.tierRevenue
        .filter((item) => item?.tier)
        .map((item) => ({
          name: item.tier.charAt(0).toUpperCase() + item.tier.slice(1),
          members: item.count || 0,
          revenue: (item.totalRevenue || 0) / 100,
        }));
    } catch (error) {
      console.error("Error processing membership distribution:", error);
      return [];
    }
  }, [data]);

  const paymentMethodsData = useMemo(() => {
    if (!data?.revenue?.payments?.typeBreakdown) return [];

    try {
      return data.revenue.payments.typeBreakdown
        .filter((item) => item?.type)
        .map((item) => ({
          name: item.type
            .split("_")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" "),
          amount: (item.totalAmount || 0) / 100,
          count: item.count || 0,
        }));
    } catch (error) {
      console.error("Error processing payment methods data:", error);
      return [];
    }
  }, [data]);

  const contractorPerformance = useMemo(() => {
    if (!data?.performance?.contractors?.topContractors) return [];

    try {
      return data.performance.contractors.topContractors
        .slice(0, 10)
        .map((c) => ({
          id: c._id?.slice(-6) || "unknown",
          bids: c.totalBids || 0,
          won: c.acceptedBids || 0,
          winRate: c.winRate || 0,
          value: (c.totalBidValue || 0) / 100,
        }));
    } catch (error) {
      console.error("Error processing contractor performance:", error);
      return [];
    }
  }, [data]);

  const customerSpending = useMemo(() => {
    if (!data?.performance?.customers?.topCustomers) return [];

    try {
      return data.performance.customers.topCustomers.slice(0, 10).map((c) => ({
        name:
          `${c.firstName || ""} ${c.lastName || ""}`.trim() ||
          "Unknown Customer",
        jobs: c.totalJobs || 0,
        spending: (c.totalSpending || 0) / 100,
      }));
    } catch (error) {
      console.error("Error processing customer spending:", error);
      return [];
    }
  }, [data]);

  const leadUsageTrend = useMemo(() => {
    if (!data?.performance?.leads?.monthlyLeadUsage) return [];

    try {
      const tierMap = new Map<string, any>();

      data.performance.leads.monthlyLeadUsage.forEach((item) => {
        const key = `${item.year}-${String(item.month).padStart(2, "0")}`;
        if (!tierMap.has(key)) {
          tierMap.set(key, {
            month: new Date(item.year, item.month - 1).toLocaleDateString(
              "en-US",
              { month: "short" }
            ),
            basic: 0,
            standard: 0,
            premium: 0,
          });
        }
        const current = tierMap.get(key);
        if (item.tier && current) {
          current[item.tier.toLowerCase()] = item.count || 0;
        }
      });

      return Array.from(tierMap.values()).sort((a, b) =>
        a.month.localeCompare(b.month)
      );
    } catch (error) {
      console.error("Error processing lead usage trend:", error);
      return [];
    }
  }, [data]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-700 font-medium">
          Error loading analytics: {error}
        </p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  // Show loader when loading or when we haven't attempted to fetch data yet
  if (loading || (!data && !error)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader size="large" color="accent" />
          <p className="text-gray-600 mt-4 font-medium text-lg">
            Loading analytics data...
          </p>
        </div>
      </div>
    );
  }

  // Show error state only if there's an actual error from the API
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6 space-y-4 lg:space-y-6 overflow-x-hidden">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Analytics Data Unavailable
            </h2>
            <p className="text-gray-600 mb-6">
              We're having trouble loading the analytics data. Please try again.
            </p>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-6 py-3 bg-accent-500 text-white rounded-lg hover:bg-accent-600 disabled:opacity-50 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6 space-y-4 lg:space-y-6 overflow-x-hidden">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 bg-white rounded-xl shadow-lg border border-gray-200 p-4 lg:p-6">
        <div className="flex-1 w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
            Business Analytics
          </h1>
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-4 text-sm">
            <div className="flex items-center bg-gray-50 px-3 py-2 rounded-lg">
              <span className="text-gray-600 font-medium">Total Revenue:</span>
              <span className="ml-2 text-lg lg:text-xl font-bold text-primary-700 break-words">
                {formatCurrency(totalRevenue)}
              </span>
            </div>
            <div className="flex items-center bg-gray-50 px-3 py-2 rounded-lg">
              <span className="text-gray-600 font-medium">Growth:</span>
              <span
                className={`ml-2 text-base lg:text-lg font-bold flex items-center ${
                  growthRate >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {growthRate >= 0 ? (
                  <TrendingUp className="h-4 w-4 lg:h-5 lg:w-5 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 lg:h-5 lg:w-5 mr-1" />
                )}
                {Math.abs(growthRate).toFixed(1)}%
              </span>
            </div>
          </div>
          {lastFetched && (
            <p className="text-xs text-gray-500 mt-3 bg-gray-100 px-2 py-1 rounded-md inline-block">
              Updated: {new Date(lastFetched).toLocaleString()}
            </p>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center px-4 lg:px-6 py-2 lg:py-3 bg-accent-500 text-white rounded-lg hover:bg-accent-600 disabled:opacity-50 transition-colors font-medium shadow-md hover:shadow-lg text-sm lg:text-base"
        >
          <RefreshCw
            className={`h-4 w-4 lg:h-5 lg:w-5 mr-2 ${
              loading ? "animate-spin" : ""
            }`}
          />
          Refresh Data
        </button>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        <KPICard
          title="Avg Job Value"
          value={formatCurrency(
            (data?.revenue?.jobs?.summary?.avgJobValue || 0) / 100
          )}
          subtitle={`From ${data?.revenue?.jobs?.summary?.totalJobs || 0} jobs`}
          gradientFrom="from-primary-700"
          gradientTo="to-primary-900"
          textColor="text-primary-100"
          subtitleColor="text-primary-200"
        />

        <KPICard
          title="Avg Membership Value"
          value={formatCurrency(
            (data?.revenue?.memberships?.summary?.avgMembershipValue || 0) / 100
          )}
          subtitle={`${
            data?.revenue?.memberships?.summary?.totalMemberships || 0
          } active`}
          gradientFrom="from-accent-500"
          gradientTo="to-accent-600"
          textColor="text-accent-100"
          subtitleColor="text-accent-100"
        />

        <KPICard
          title="Lead Conversion"
          value={`${(
            data?.performance?.leads?.conversionRate?.conversionRate || 0
          ).toFixed(1)}%`}
          subtitle={`${
            data?.performance?.leads?.conversionRate?.convertedLeads || 0
          } of ${
            data?.performance?.leads?.conversionRate?.totalLeads || 0
          } leads`}
          gradientFrom="from-green-500"
          gradientTo="to-green-600"
          textColor="text-green-100"
          subtitleColor="text-green-100"
        />

        <KPICard
          title="Contractor Win Rate"
          value={`${(
            data?.performance?.contractors?.summary?.avgWinRate || 0
          ).toFixed(1)}%`}
          subtitle={`${
            data?.performance?.contractors?.summary?.acceptedBids || 0
          } of ${data?.performance?.contractors?.summary?.totalBids || 0} bids`}
          gradientFrom="from-blue-500"
          gradientTo="to-blue-600"
          textColor="text-blue-100"
          subtitleColor="text-blue-100"
        />
      </div>

      {/* Business Intelligence Summary */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 lg:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 lg:mb-6">
          Business Intelligence Summary
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
          <BusinessIntelligenceCard
            title="Job Completion Rate"
            value={`${
              (data?.revenue?.jobs?.summary?.totalJobs || 0) > 0
                ? (
                    ((data?.revenue?.jobs?.summary?.completedJobs || 0) /
                      (data?.revenue?.jobs?.summary?.totalJobs || 1)) *
                    100
                  ).toFixed(1)
                : 0
            }%`}
            color="text-primary-700"
          />

          <BusinessIntelligenceCard
            title="Payment Success Rate"
            value={`${
              (data?.revenue?.payments?.summary?.totalPayments || 0) > 0
                ? (
                    ((data?.revenue?.payments?.summary?.successfulPayments ||
                      0) /
                      (data?.revenue?.payments?.summary?.totalPayments || 1)) *
                    100
                  ).toFixed(1)
                : 0
            }%`}
            color="text-green-600"
          />

          <BusinessIntelligenceCard
            title="Active Members Ratio"
            value={`${
              (data?.revenue?.memberships?.summary?.totalMemberships || 0) > 0
                ? (
                    ((data?.revenue?.memberships?.summary?.activeMemberships ||
                      0) /
                      (data?.revenue?.memberships?.summary?.totalMemberships ||
                        1)) *
                    100
                  ).toFixed(1)
                : 0
            }%`}
            color="text-accent-600"
          />

          <BusinessIntelligenceCard
            title="Avg Bid Amount"
            value={formatCurrency(
              (data?.performance?.contractors?.summary?.avgBidAmount || 0) / 100
            )}
            color="text-primary-700"
          />

          <BusinessIntelligenceCard
            title="Avg Jobs per Customer"
            value={`${(
              data?.performance?.customers?.summary?.avgJobsPerCustomer || 0
            ).toFixed(1)}`}
            color="text-accent-600"
          />

          <BusinessIntelligenceCard
            title="Avg Payment Amount"
            value={formatCurrency(
              (data?.revenue?.payments?.summary?.avgPaymentAmount || 0) / 100
            )}
            color="text-green-600"
          />
        </div>
      </div>

      {/* Top Performers Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        {/* Top Contractors Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 lg:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Top Performing Contractors
            </h2>
            <div className="text-sm text-gray-500">
              {contractorData.totalItems &&
                contractorData.totalItems > ITEMS_PER_PAGE && (
                  <span>
                    Showing {contractorPage * ITEMS_PER_PAGE + 1}-
                    {Math.min(
                      (contractorPage + 1) * ITEMS_PER_PAGE,
                      contractorData.totalItems
                    )}{" "}
                    of {contractorData.totalItems}
                  </span>
                )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-2 lg:px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Rank
                  </th>
                  <th className="px-2 lg:px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Bids
                  </th>
                  <th className="px-2 lg:px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Won
                  </th>
                  <th className="px-2 lg:px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Win Rate
                  </th>
                  <th className="px-2 lg:px-3 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contractorData.items.map((contractor, idx) => (
                  <tr
                    key={contractor._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-2 lg:px-3 py-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-700 font-semibold text-xs">
                        {contractorPage * ITEMS_PER_PAGE + idx + 1}
                      </span>
                    </td>
                    <td className="px-2 lg:px-3 py-3 font-medium text-gray-900">
                      {contractor.totalBids}
                    </td>
                    <td className="px-2 lg:px-3 py-3">
                      <span className="text-green-600 font-semibold">
                        {contractor.acceptedBids}
                      </span>
                    </td>
                    <td className="px-2 lg:px-3 py-3">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                          contractor.winRate >= 20
                            ? "bg-green-100 text-green-700"
                            : contractor.winRate >= 10
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {contractor.winRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-2 lg:px-3 py-3 text-right font-semibold text-primary-700">
                      {formatCurrency(contractor.totalBidValue / 100)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {contractorData.totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => handleContractorPageChange("prev")}
                disabled={contractorPage === 0}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {contractorPage + 1} of {contractorData.totalPages}
              </span>
              <button
                onClick={() => handleContractorPageChange("next")}
                disabled={!contractorData.hasMore}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Top Customers Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 lg:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Top Spending Customers
            </h2>
            <div className="text-sm text-gray-500">
              {customerData.totalItems &&
                customerData.totalItems > ITEMS_PER_PAGE && (
                  <span>
                    Showing {customerPage * ITEMS_PER_PAGE + 1}-
                    {Math.min(
                      (customerPage + 1) * ITEMS_PER_PAGE,
                      customerData.totalItems
                    )}{" "}
                    of {customerData.totalItems}
                  </span>
                )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-2 lg:px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Rank
                  </th>
                  <th className="px-2 lg:px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Customer
                  </th>
                  <th className="px-2 lg:px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Jobs
                  </th>
                  <th className="px-2 lg:px-3 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Spending
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customerData.items.map((customer, idx) => (
                  <tr
                    key={customer._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-2 lg:px-3 py-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent-100 text-accent-700 font-semibold text-xs">
                        {customerPage * ITEMS_PER_PAGE + idx + 1}
                      </span>
                    </td>
                    <td className="px-2 lg:px-3 py-3">
                      <p
                        className="font-medium text-gray-900 truncate max-w-[120px] lg:max-w-none"
                        title={`${customer.firstName} ${customer.lastName}`}
                      >
                        {customer.firstName} {customer.lastName}
                      </p>
                      <p
                        className="text-xs text-gray-500 truncate max-w-[120px] lg:max-w-none"
                        title={customer.email}
                      >
                        {customer.email}
                      </p>
                    </td>
                    <td className="px-2 lg:px-3 py-3 font-medium text-gray-700">
                      {customer.totalJobs}
                    </td>
                    <td className="px-2 lg:px-3 py-3 text-right font-semibold text-accent-600">
                      {formatCurrency(customer.totalSpending / 100)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {customerData.totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => handleCustomerPageChange("prev")}
                disabled={customerPage === 0}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {customerPage + 1} of {customerData.totalPages}
              </span>
              <button
                onClick={() => handleCustomerPageChange("next")}
                disabled={!customerData.hasMore}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Visual Analytics - Charts Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 lg:p-6">
        <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 lg:mb-6">
          📊 Visual Analytics & Insights
        </h2>

        {/* Revenue Trends - Area Chart */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 lg:p-6 mb-4 lg:mb-6">
          <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">
            Revenue Trends (Monthly)
          </h2>
          <ResponsiveContainer
            width="100%"
            height={280}
            className="lg:h-[350px]"
          >
            <AreaChart data={monthlyRevenueData}>
              <defs>
                <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={CHART_COLORS.primary}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={CHART_COLORS.primary}
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient
                  id="colorMemberships"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={CHART_COLORS.accent}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={CHART_COLORS.accent}
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={CHART_COLORS.success}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={CHART_COLORS.success}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 13, fill: "#4B5563" }} />
              <YAxis tick={{ fontSize: 13, fill: "#4B5563" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "13px" }} />
              <Area
                type="monotone"
                dataKey="jobs"
                stroke={CHART_COLORS.primary}
                fillOpacity={1}
                fill="url(#colorJobs)"
                name="Jobs Revenue ($)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="memberships"
                stroke={CHART_COLORS.accent}
                fillOpacity={1}
                fill="url(#colorMemberships)"
                name="Membership Revenue ($)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke={CHART_COLORS.success}
                fillOpacity={1}
                fill="url(#colorTotal)"
                name="Total Revenue ($)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Two Column Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 mb-4 lg:mb-6">
          {/* Service Performance */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 lg:p-6">
            <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">
              Service Performance Analysis
            </h2>
            <ResponsiveContainer
              width="100%"
              height={250}
              className="lg:h-[320px]"
            >
              <BarChart data={serviceBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 13, fill: "#4B5563" }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 13, fill: "#4B5563" }}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFF",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "13px" }} />
                <Bar
                  dataKey="revenue"
                  fill={CHART_COLORS.primary}
                  name="Revenue ($)"
                  radius={[0, 4, 4, 0]}
                />
                <Bar
                  dataKey="count"
                  fill={CHART_COLORS.accent}
                  name="Job Count"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Membership Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-primary-900 mb-3 sm:mb-4">
              Membership Distribution
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={membershipDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="revenue"
                  label={(entry: any) =>
                    `${entry.name}: ${entry.revenue.toLocaleString()}`
                  }
                >
                  <Cell fill={CHART_COLORS.primary} />
                  <Cell fill={CHART_COLORS.accent} />
                  <Cell fill={CHART_COLORS.success} />
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFF",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                  }}
                  formatter={(value: any, _name: any, props: any) => [
                    `$${value.toLocaleString()}`,
                    `${props.payload.members} members`,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Analysis */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-primary-900 mb-3 sm:mb-4">
            Payment Analysis by Type
          </h2>
          <ResponsiveContainer
            width="100%"
            height={250}
            className="sm:h-[300px]"
          >
            <BarChart data={paymentMethodsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 13, fill: "#4B5563" }} />
              <YAxis tick={{ fontSize: 13, fill: "#4B5563" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "13px" }} />
              <Bar
                dataKey="amount"
                fill={CHART_COLORS.accent}
                name="Amount ($)"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="count"
                fill={CHART_COLORS.primary}
                name="Transaction Count"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Contractor & Customer Performance Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* Contractor Win Rates */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-primary-900 mb-3 sm:mb-4">
              Top Contractors - Win Rate Analysis
            </h2>
            <ResponsiveContainer
              width="100%"
              height={300}
              className="sm:h-[350px]"
            >
              <BarChart data={contractorPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="id" tick={{ fontSize: 12, fill: "#4B5563" }} />
                <YAxis tick={{ fontSize: 12, fill: "#4B5563" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFF",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "13px" }} />
                <Bar
                  dataKey="bids"
                  fill={CHART_COLORS.primary}
                  name="Total Bids"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="won"
                  fill={CHART_COLORS.success}
                  name="Won Bids"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Customer Spending */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-primary-900 mb-3 sm:mb-4">
              Top Customers - Spending Analysis
            </h2>
            <ResponsiveContainer
              width="100%"
              height={300}
              className="sm:h-[350px]"
            >
              <BarChart data={customerSpending}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#4B5563" }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis tick={{ fontSize: 12, fill: "#4B5563" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFF",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "13px" }} />
                <Bar
                  dataKey="spending"
                  fill={CHART_COLORS.accent}
                  name="Total Spending ($)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="jobs"
                  fill={CHART_COLORS.primary}
                  name="Job Count"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Usage Trends */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-primary-900 mb-3 sm:mb-4">
            Lead Usage by Membership Tier
          </h2>
          <ResponsiveContainer
            width="100%"
            height={280}
            className="sm:h-[320px]"
          >
            <LineChart data={leadUsageTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 13, fill: "#4B5563" }} />
              <YAxis tick={{ fontSize: 13, fill: "#4B5563" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "13px" }} />
              <Line
                type="monotone"
                dataKey="premium"
                stroke={CHART_COLORS.primary}
                strokeWidth={3}
                name="Premium Tier"
                dot={{ fill: CHART_COLORS.primary, r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="standard"
                stroke={CHART_COLORS.accent}
                strokeWidth={3}
                name="Standard Tier"
                dot={{ fill: CHART_COLORS.accent, r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="basic"
                stroke={CHART_COLORS.warning}
                strokeWidth={3}
                name="Basic Tier"
                dot={{ fill: CHART_COLORS.warning, r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default memo(Analytics);
