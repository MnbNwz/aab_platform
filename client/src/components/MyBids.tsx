import React, { useEffect, useState, useCallback, useMemo, memo } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../store";
import { getMyBidsThunk } from "../store/thunks/contractorBidsThunks";
import { setBidFilters } from "../store/slices/contractorBidsSlice";
import type { ContractorBid } from "../services/contractorBidService";
import { useGeocoding } from "../hooks/useGeocoding";
import { showToast } from "../utils/toast";
import FilterPanel from "./ui/FilterPanel";
import { createSelectFieldWithAll } from "./ui/FilterPanel.utils";
import { BID_STATUSES } from "../constants";
import DataTable, { TableColumn } from "./ui/DataTable";
import type { PaginationInfo } from "./ui/DataTable";

const MyBids: React.FC = memo(() => {
  const dispatch = useDispatch<AppDispatch>();
  const { bids, loading, error, pagination, filters } = useSelector(
    (state: RootState) => state.contractorBids
  );
  const { contractorData } = useSelector((state: RootState) => state.dashboard);
  const [selectedBid, setSelectedBid] = useState<ContractorBid | null>(null);

  // Extract lead stats from dashboard data
  const leadStats = contractorData?.contractor?.leadStats;

  // Fetch bids on mount and when filters change
  useEffect(() => {
    dispatch(getMyBidsThunk(filters));
  }, [dispatch, filters]);

  const handleFilterChange = useCallback(
    (newFilters: any) => {
      dispatch(setBidFilters({ status: newFilters.status || "all", page: 1 }));
    },
    [dispatch]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      dispatch(setBidFilters({ page }));
    },
    [dispatch]
  );

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }, []);

  const getJobStatusColor = useCallback((status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "inprogress":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }, []);

  // Convert filter status to include "all" option
  const bidStatusOptions = useMemo(() => ["all", ...BID_STATUSES], []);

  // Memoized columns
  const columns = useMemo<
    TableColumn<ContractorBid & Record<string, unknown>>[]
  >(
    () => [
      {
        key: "jobTitle",
        header: "Job Title",
        render: (bid) => (
          <div
            className="font-medium text-gray-900 truncate max-w-xs"
            title={bid.jobRequest.title}
          >
            {bid.jobRequest.title}
          </div>
        ),
        mobileLabel: "Job",
        mobileRender: (bid) => (
          <div>
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-gray-900 text-sm flex-1">
                {bid.jobRequest.title}
              </h3>
              <div className="flex flex-col gap-1 items-end">
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                    bid.status
                  )}`}
                >
                  {bid.status}
                </span>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${getJobStatusColor(
                    bid.jobRequest.status
                  )}`}
                >
                  {bid.jobRequest.status}
                </span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Property:</span>
                <span className="font-medium text-gray-900">
                  {bid.jobRequest.property.title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Service:</span>
                <span className="font-medium text-gray-900 capitalize">
                  {bid.jobRequest.service}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">My Bid:</span>
                <span className="font-bold text-green-700">
                  ${(bid.bidAmount / 100).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estimate:</span>
                <span className="font-medium text-gray-900">
                  ${(bid.jobRequest.estimate / 100).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Submitted:</span>
                <span className="text-gray-900">
                  {new Date(bid.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "service",
        header: "Service",
        render: (bid) => (
          <span className="text-gray-700 capitalize">
            {bid.jobRequest.service}
          </span>
        ),
        hideOnMobile: true,
      },
      {
        key: "bidAmount",
        header: "Bid Amount",
        render: (bid) => (
          <span className="font-semibold text-primary-700">
            ${(bid.bidAmount / 100).toLocaleString()}
          </span>
        ),
        hideOnMobile: true,
      },
      {
        key: "status",
        header: "Status",
        render: (bid) => (
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
              bid.status
            )}`}
          >
            {bid.status}
          </span>
        ),
        hideOnMobile: true,
      },
      {
        key: "submitted",
        header: "Submitted",
        render: (bid) => (
          <span className="text-sm text-gray-600">
            {new Date(bid.createdAt).toLocaleDateString()}
          </span>
        ),
        hideOnMobile: true,
      },
    ],
    [getStatusColor, getJobStatusColor]
  );

  // Pagination info
  const paginationInfo = useMemo<PaginationInfo | undefined>(() => {
    if (!pagination) return undefined;
    const paginationAny = pagination as any;
    const totalCount = paginationAny.totalItems || paginationAny.total || 0;
    if (totalCount === 0) return undefined;
    return {
      currentPage: paginationAny.currentPage || paginationAny.page || 1,
      totalPages: paginationAny.totalPages || paginationAny.pages || 1,
      totalCount: totalCount,
      limit: paginationAny.itemsPerPage || paginationAny.limit || 10,
      hasNextPage:
        paginationAny.hasNextPage ??
        (paginationAny.currentPage || paginationAny.page || 1) <
          (paginationAny.totalPages || paginationAny.pages || 1),
      hasPrevPage:
        paginationAny.hasPrevPage ??
        (paginationAny.currentPage || paginationAny.page || 1) > 1,
    };
  }, [pagination]);

  return (
    <div className="space-y-6">
      {/* Main Content Card */}
      <div className="bg-white rounded-lg shadow-sm border border-primary-200 w-full max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                My Bids
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Track and manage your submitted bids
              </p>
            </div>
            {leadStats && (
              <div className="flex-shrink-0 w-full sm:w-[35%] md:w-[30%] lg:w-[25%]">
                <div className="bg-white rounded-lg shadow-sm border border-primary-200 px-3 py-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">
                      Available Leads
                    </span>
                    {/* Can Bid Badge */}
                    <div
                      className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md font-semibold text-xs whitespace-nowrap ${
                        leadStats.canBid
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          leadStats.canBid ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      {leadStats.canBid ? "Can Bid" : "Limit"}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        (leadStats.used / leadStats.limit) * 100 > 80
                          ? "bg-gradient-to-r from-red-500 to-red-600"
                          : (leadStats.used / leadStats.limit) * 100 > 50
                          ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                          : "bg-gradient-to-r from-primary-500 to-accent-500"
                      }`}
                      style={{
                        width: `${(leadStats.used / leadStats.limit) * 100}%`,
                      }}
                    />
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-700">
                      <span className="font-bold text-primary-900">
                        {leadStats.used}
                      </span>
                      <span className="text-gray-500">
                        {" "}
                        / {leadStats.limit} used
                      </span>
                    </span>
                    <span className="text-xs font-semibold text-accent-700">
                      {leadStats.remaining} left
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <FilterPanel
          mode="inline"
          fields={[
            createSelectFieldWithAll(
              "status",
              "Status",
              bidStatusOptions,
              filters.status || "all"
            ),
          ]}
          values={{ status: filters.status || "all" }}
          onChange={handleFilterChange}
          showFilterIcon={true}
          columns={{ mobile: 1, tablet: 1, desktop: 1 }}
        />

        {/* DataTable */}
        <DataTable<ContractorBid & Record<string, unknown>>
          data={bids as (ContractorBid & Record<string, unknown>)[]}
          columns={columns}
          loading={loading}
          error={error}
          emptyMessage="No bids found."
          onRowClick={(bid) => setSelectedBid(bid)}
          pagination={paginationInfo}
          onPageChange={handlePageChange}
          paginationLabel={({ startItem, endItem, totalCount }) =>
            `Showing ${startItem} to ${endItem} of ${totalCount} bids`
          }
          getRowKey={(bid) => bid._id}
          hoverable
        />
      </div>

      {/* Bid Details Modal */}
      {selectedBid && (
        <BidDetailsModal
          bid={selectedBid}
          onClose={() => setSelectedBid(null)}
        />
      )}
    </div>
  );
});

// Bid Details Modal Component
const BidDetailsModal: React.FC<{
  bid: ContractorBid;
  onClose: () => void;
}> = ({ bid, onClose }) => {
  const propertyCoords = bid.jobRequest.property?.location?.coordinates;
  const { address: propertyAddress, loading: addressLoading } = useGeocoding(
    propertyCoords ? [propertyCoords[0], propertyCoords[1]] : null
  );

  const handleCopyLocation = () => {
    if (propertyCoords) {
      const locationText = `${propertyCoords[1].toFixed(
        6
      )}, ${propertyCoords[0].toFixed(6)}`;
      navigator.clipboard.writeText(locationText);
      showToast.success("Location coordinates copied to clipboard!");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            Pending Review
          </span>
        );
      case "accepted":
        return (
          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            Accepted ✓
          </span>
        );
      case "rejected":
        return (
          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-60 p-2 sm:p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto relative my-4">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-accent-600 text-white p-4 sm:p-6 rounded-t-lg z-10">
          <button
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white hover:text-gray-200 text-3xl font-bold leading-none"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
          <h2 className="text-xl sm:text-2xl font-bold pr-8 mb-3">
            {bid.jobRequest.title}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {getStatusBadge(bid.status)}
            <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
              {bid.jobRequest.service}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Bid Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <div className="text-sm text-gray-600 font-medium mb-2">
                Your Bid
              </div>
              <div className="text-3xl font-bold text-gray-900">
                ${(bid.bidAmount / 100).toLocaleString()}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <div className="text-sm text-gray-600 font-medium mb-2">
                Customer Estimate
              </div>
              <div className="text-3xl font-bold text-gray-900">
                ${(bid.jobRequest.estimate / 100).toLocaleString()}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <div className="text-sm text-gray-600 font-medium mb-2">
                Timeline
              </div>
              <div className="text-base font-semibold text-gray-900">
                {new Date(bid.timeline.startDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}{" "}
                -{" "}
                {new Date(bid.timeline.endDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>

          {/* Job Description */}
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Job Description
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {bid.jobRequest.description}
            </p>
          </div>

          {/* Your Proposal */}
          <div className="bg-accent-50 rounded-lg p-5 border border-accent-200">
            <h3 className="text-lg font-semibold text-accent-900 mb-4">
              Your Proposal
            </h3>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm font-semibold text-accent-700 mb-2">
                  Message
                </div>
                <p className="text-gray-700 leading-relaxed">{bid.message}</p>
              </div>
              {bid.materials && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-sm font-semibold text-accent-700 mb-2">
                    Materials
                  </div>
                  {typeof bid.materials === "object" ? (
                    <div className="text-gray-700">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                          bid.materials.included
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {bid.materials.included
                          ? "✓ Included"
                          : "✗ Not Included"}
                      </div>
                      {bid.materials.description && (
                        <p className="mt-2 text-gray-700">
                          {bid.materials.description}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-700">{bid.materials}</p>
                  )}
                </div>
              )}
              {bid.warranty && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-sm font-semibold text-accent-700 mb-2">
                    Warranty
                  </div>
                  {typeof bid.warranty === "object" ? (
                    <div className="text-gray-700">
                      {bid.warranty.period ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {bid.warranty.period}{" "}
                          {bid.warranty.period === 1 ? "year" : "years"}
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                          No warranty period specified
                        </div>
                      )}
                      {bid.warranty.description && (
                        <p className="mt-2 text-gray-700">
                          {bid.warranty.description}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-700">{bid.warranty}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Property Information */}
          {bid.jobRequest.property && (
            <div className="bg-primary-50 rounded-lg p-5 border border-primary-200">
              <h3 className="text-lg font-semibold text-primary-900 mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-primary-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                Property Information
              </h3>
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-xs font-medium text-primary-600 mb-1.5">
                    Property Name
                  </div>
                  <div className="text-base font-semibold text-primary-900">
                    {bid.jobRequest.property.title}
                  </div>
                </div>

                {bid.jobRequest.property.area && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-xs font-medium text-primary-600 mb-1.5">
                      Property Size
                    </div>
                    <div className="text-base font-semibold text-primary-900">
                      {bid.jobRequest.property.area}{" "}
                      {bid.jobRequest.property.areaUnit || "sqft"}
                    </div>
                  </div>
                )}

                {bid.jobRequest.property.location && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-medium text-primary-600">
                        Location
                      </div>
                      <button
                        onClick={handleCopyLocation}
                        className="text-primary-600 hover:text-primary-800 transition-colors p-1.5 hover:bg-primary-50 rounded"
                        title="Copy coordinates"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                    </div>
                    {addressLoading ? (
                      <div className="text-sm text-primary-700">
                        Loading address...
                      </div>
                    ) : propertyAddress ? (
                      <div className="text-sm text-primary-900 font-medium mb-2">
                        {propertyAddress}
                      </div>
                    ) : null}
                    <div className="text-xs text-primary-700 font-mono bg-primary-50 px-2 py-1 rounded">
                      {bid.jobRequest.property.location.coordinates[1].toFixed(
                        6
                      )}
                      °N,{" "}
                      {bid.jobRequest.property.location.coordinates[0].toFixed(
                        6
                      )}
                      °E
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-4 sm:px-6 py-4 border-t border-gray-200 rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

MyBids.displayName = "MyBids";

export default MyBids;
