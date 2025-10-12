import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../store";
import { getMyBidsThunk } from "../store/thunks/contractorBidsThunks";
import { setBidFilters } from "../store/slices/contractorBidsSlice";
import type { ContractorBid } from "../services/contractorBidService";
import Loader from "./ui/Loader";
import { useGeocoding } from "../hooks/useGeocoding";
import { showToast } from "../utils/toast";

const MyBids: React.FC = () => {
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

  const handleFilterChange = (
    status: "all" | "pending" | "accepted" | "rejected"
  ) => {
    dispatch(setBidFilters({ status, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    dispatch(setBidFilters({ page }));
  };

  const getStatusColor = (status: string) => {
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
  };

  const getJobStatusColor = (status: string) => {
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
  };

  return (
    <div className="bg-white rounded-lg shadow w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">My Bids</h2>
            <p className="text-sm text-gray-500 mt-1">
              Track and manage your submitted bids
            </p>
          </div>
          {/* Lead Stats */}
          {leadStats && (
            <div className="bg-white rounded-xl px-4 sm:px-5 py-4 border-2 border-primary-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                {/* Lead Usage Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">
                      Monthly Leads
                    </span>
                    {/* Can Bid Badge - Mobile */}
                    <div
                      className={`sm:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold text-xs whitespace-nowrap ${
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
                      {leadStats.canBid ? "Can Bid" : "Limit Reached"}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative w-full h-2.5 bg-gray-200 rounded-full overflow-hidden mb-2">
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
                    <span className="text-sm text-gray-700">
                      <span className="font-bold text-primary-900">
                        {leadStats.used}
                      </span>
                      <span className="text-gray-500">
                        {" "}
                        / {leadStats.limit} used
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-accent-700">
                      {leadStats.remaining} left
                    </span>
                  </div>
                </div>

                {/* Can Bid Badge - Desktop */}
                <div
                  className={`hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm whitespace-nowrap flex-shrink-0 ${
                    leadStats.canBid
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      leadStats.canBid ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  {leadStats.canBid ? "Can Bid" : "Limit Reached"}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap gap-2">
          {["all", "pending", "accepted", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() =>
                handleFilterChange(
                  status as "all" | "pending" | "accepted" | "rejected"
                )
              }
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filters.status === status
                  ? "bg-accent-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block lg:hidden w-full overflow-x-hidden">
        {loading ? (
          <div className="py-12">
            <div className="flex justify-center items-center w-full h-full">
              <Loader size="large" color="accent" />
            </div>
          </div>
        ) : (
          <div className="space-y-3 p-4 w-full">
            {bids.map((bid) => (
              <BidCard
                key={bid._id}
                bid={bid}
                onViewDetails={() => setSelectedBid(bid)}
                getStatusColor={getStatusColor}
                getJobStatusColor={getJobStatusColor}
              />
            ))}
            {bids.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No bids found.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Job Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bid Amount
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submitted
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12">
                  <div className="flex justify-center items-center w-full h-full">
                    <Loader size="large" color="accent" />
                  </div>
                </td>
              </tr>
            ) : bids.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-gray-500 py-8">
                  No bids found.
                </td>
              </tr>
            ) : (
              bids.map((bid) => (
                <tr key={bid._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div
                      className="font-medium text-gray-900 truncate max-w-xs"
                      title={bid.jobRequest.title}
                    >
                      {bid.jobRequest.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700 capitalize">
                    {bid.jobRequest.service}
                  </td>
                  <td className="px-6 py-4 text-center font-semibold text-primary-700">
                    ${(bid.bidAmount / 100).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        bid.status
                      )}`}
                    >
                      {bid.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">
                    {new Date(bid.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => setSelectedBid(bid)}
                      className="text-accent-600 hover:text-accent-700 font-medium text-sm hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <div className="px-4 sm:px-3 lg:px-6 py-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-gray-700 order-2 sm:order-1">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} bids
            </div>
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrevPage || loading}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm font-medium"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNextPage || loading}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm font-medium"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
          <p className="text-red-700">Error: {error}</p>
        </div>
      )}

      {/* Bid Details Modal */}
      {selectedBid && (
        <BidDetailsModal
          bid={selectedBid}
          onClose={() => setSelectedBid(null)}
        />
      )}
    </div>
  );
};

// Mobile Bid Card Component
const BidCard: React.FC<{
  bid: ContractorBid;
  onViewDetails: () => void;
  getStatusColor: (status: string) => string;
  getJobStatusColor: (status: string) => string;
}> = ({ bid, onViewDetails, getStatusColor, getJobStatusColor }) => {
  return (
    <div
      onClick={onViewDetails}
      className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
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
  );
};

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
                  <p className="text-gray-700">{bid.materials}</p>
                </div>
              )}
              {bid.warranty && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-sm font-semibold text-accent-700 mb-2">
                    Warranty
                  </div>
                  <p className="text-gray-700">{bid.warranty}</p>
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

export default MyBids;
