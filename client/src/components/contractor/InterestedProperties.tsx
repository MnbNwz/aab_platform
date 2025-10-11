import React, { useEffect, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../store";
import { fetchMyInterestsThunk } from "../../store/slices/investmentOpportunitySlice";
import type { InvestmentStatus, ContactStatus } from "../../types";
import Loader from "../ui/Loader";
import {
  Building2,
  Heart,
  MapPin,
  CheckCircle,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Calendar,
  Filter,
} from "lucide-react";
import {
  formatInvestmentPrice,
  getContactStatusBadge,
  getInvestmentStatusBadge,
} from "../../utils/investmentOpportunity";

const InterestedProperties: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { myInterests, loading, interestsPagination } = useSelector(
    (state: RootState) => state.investmentOpportunity
  );
  const currentMembership = useSelector(
    (state: RootState) => state.membership.current
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  // Filter states - UI values (not yet applied)
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<InvestmentStatus | "">(
    ""
  );
  const [selectedContactStatus, setSelectedContactStatus] = useState<
    ContactStatus | ""
  >("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Applied filter states (used for API calls)
  const [appliedStatus, setAppliedStatus] = useState<InvestmentStatus | "">("");
  const [appliedContactStatus, setAppliedContactStatus] = useState<
    ContactStatus | ""
  >("");
  const [appliedSortOrder, setAppliedSortOrder] = useState<"asc" | "desc">(
    "desc"
  );

  // Check if user has standard or premium access (basic tier shows teaser)
  const hasAccess =
    currentMembership &&
    currentMembership.status === "active" &&
    (currentMembership.planId.tier === "standard" ||
      currentMembership.planId.tier === "premium");

  useEffect(() => {
    // Only fetch data if user has access (standard or premium)
    if (!hasAccess) {
      return;
    }

    const params: any = { page: currentPage, limit };
    if (appliedStatus) params.status = appliedStatus;
    if (appliedContactStatus) params.contactStatus = appliedContactStatus;
    params.sortOrder = appliedSortOrder;

    dispatch(fetchMyInterestsThunk(params));
  }, [
    dispatch,
    hasAccess,
    currentPage,
    limit,
    appliedStatus,
    appliedContactStatus,
    appliedSortOrder,
  ]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleApplyFilters = useCallback(() => {
    // Copy selected filters to applied filters
    setAppliedStatus(selectedStatus);
    setAppliedContactStatus(selectedContactStatus);
    setAppliedSortOrder(sortOrder);
    setCurrentPage(1); // Reset to first page when applying filters
    setShowFilters(false);
  }, [selectedStatus, selectedContactStatus, sortOrder]);

  const handleClearFilters = useCallback(() => {
    // Reset both selected and applied filters
    setSelectedStatus("");
    setSelectedContactStatus("");
    setSortOrder("desc");
    setAppliedStatus("");
    setAppliedContactStatus("");
    setAppliedSortOrder("desc");
    setCurrentPage(1);
  }, []);

  const renderContactStatusBadge = useCallback((status: string) => {
    const { className } = getContactStatusBadge(status as any);
    const icons = {
      pending: AlertCircle,
      accepted: CheckCircle,
      rejected: X,
    };
    const Icon = icons[status as keyof typeof icons] || AlertCircle;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      >
        <Icon className="h-3 w-3 mr-1" />
        {status.toUpperCase()}
      </span>
    );
  }, []);

  const getPropertyTypeBadge = (type: string) => {
    const badges: { [key: string]: string } = {
      house: "bg-blue-100 text-blue-800",
      duplex: "bg-green-100 text-green-800",
      triplex: "bg-yellow-100 text-yellow-800",
      sixplex: "bg-purple-100 text-purple-800",
      land: "bg-orange-100 text-orange-800",
      commercial: "bg-red-100 text-red-800",
    };
    return badges[type] || "bg-gray-100 text-gray-800";
  };

  // If no access, don't render anything (menu item is hidden in sidebar for basic tier)
  if (!hasAccess) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              My Interested Properties
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Track all properties you've expressed interest in
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-primary-800 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-900 transition flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 bg-gray-50 p-4 rounded-lg space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Property Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) =>
                    setSelectedStatus(e.target.value as InvestmentStatus | "")
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500"
                >
                  <option value="">All Statuses</option>
                  <option value="available">Available</option>
                  <option value="under_offer">Under Offer</option>
                  <option value="sold">Sold</option>
                </select>
              </div>

              {/* Contact Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Status
                </label>
                <select
                  value={selectedContactStatus}
                  onChange={(e) =>
                    setSelectedContactStatus(
                      e.target.value as ContactStatus | ""
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500"
                >
                  <option value="">All Contact Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort Order
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) =>
                    setSortOrder(e.target.value as "asc" | "desc")
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleApplyFilters}
                className="bg-accent-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-accent-600 transition"
              >
                Apply Filters
              </button>
              <button
                onClick={handleClearFilters}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-8 text-center">
          <div className="flex items-center justify-center">
            <Loader size="medium" color="primary" />
            <span className="ml-3 text-primary-600">Loading interests...</span>
          </div>
        </div>
      ) : !myInterests || myInterests.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg">No Interests Yet</p>
          <p className="text-sm">
            You haven't expressed interest in any off-market opportunities yet
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View - XL and above */}
          <div className="hidden xl:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ROI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expressed
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {myInterests.map((interest) => (
                  <tr key={interest.opportunityId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {interest.photos && interest.photos.length > 0 ? (
                          <img
                            src={interest.photos[0].url}
                            alt={interest.title}
                            className="h-12 w-12 rounded object-cover mr-3"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded bg-gray-200 flex items-center justify-center mr-3">
                            <Building2 className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {interest.title}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {interest.location.city &&
                            interest.location.province
                              ? `${interest.location.city}, ${interest.location.province}`
                              : interest.location.fullAddress ||
                                `${interest.location.coordinates[1]}, ${interest.location.coordinates[0]}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPropertyTypeBadge(
                          interest.propertyType
                        )}`}
                      >
                        {interest.propertyType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatInvestmentPrice(interest.askingPrice)}
                      </div>
                      {interest.totalInvestment && (
                        <div className="text-xs text-gray-500">
                          Total:{" "}
                          {formatInvestmentPrice(interest.totalInvestment)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {interest.projectedROI ? (
                        <div className="flex items-center text-sm font-medium text-green-600">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          {interest.projectedROI}%
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const { className, label } = getInvestmentStatusBadge(
                          interest.status
                        );
                        return (
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
                          >
                            {label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderContactStatusBadge(
                        interest.interest.contactStatus
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(
                          interest.interest.expressedAt
                        ).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tablet Table View - LG to XL */}
          <div className="hidden lg:block xl:hidden overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price / ROI
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {myInterests.map((interest) => (
                  <tr key={interest.opportunityId} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        {interest.photos && interest.photos.length > 0 ? (
                          <img
                            src={interest.photos[0].url}
                            alt={interest.title}
                            className="h-10 w-10 rounded object-cover mr-2"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center mr-2">
                            <Building2 className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {interest.title}
                          </div>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPropertyTypeBadge(
                              interest.propertyType
                            )}`}
                          >
                            {interest.propertyType}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatInvestmentPrice(interest.askingPrice)}
                      </div>
                      {interest.projectedROI && (
                        <div className="text-xs text-green-600 font-medium">
                          ROI: {interest.projectedROI}%
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {(() => {
                        const { className, label } = getInvestmentStatusBadge(
                          interest.status
                        );
                        return (
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${className}`}
                          >
                            {label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {renderContactStatusBadge(
                        interest.interest.contactStatus
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden">
            <div className="p-4 space-y-4">
              {myInterests.map((interest) => (
                <div
                  key={interest.opportunityId}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  {/* Image */}
                  <div className="relative h-48 bg-gray-200">
                    {interest.photos && interest.photos.length > 0 ? (
                      <img
                        src={interest.photos[0].url}
                        alt={interest.title}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Building2 className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                    {/* Status Badge Overlay */}
                    <div className="absolute top-2 right-2">
                      {renderContactStatusBadge(
                        interest.interest.contactStatus
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {/* Title & Type */}
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-primary-900 mb-2">
                        {interest.title}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPropertyTypeBadge(
                          interest.propertyType
                        )}`}
                      >
                        {interest.propertyType}
                      </span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span className="truncate">
                        {interest.location.city && interest.location.province
                          ? `${interest.location.city}, ${interest.location.province}`
                          : interest.location.fullAddress ||
                            `${interest.location.coordinates[1]}, ${interest.location.coordinates[0]}`}
                      </span>
                    </div>

                    {/* Property Status */}
                    {interest.status && (
                      <div className="mb-3">
                        {(() => {
                          const { className, label } = getInvestmentStatusBadge(
                            interest.status
                          );
                          return (
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${className}`}
                            >
                              {label}
                            </span>
                          );
                        })()}
                      </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <span className="text-xs text-gray-600">Price</span>
                        <div className="text-base font-bold text-primary-900">
                          {formatInvestmentPrice(interest.askingPrice)}
                        </div>
                      </div>
                      {interest.projectedROI && (
                        <div>
                          <span className="text-xs text-gray-600">ROI</span>
                          <div className="text-base font-semibold text-green-600">
                            {interest.projectedROI}%
                          </div>
                        </div>
                      )}
                      {interest.totalInvestment && (
                        <div className="col-span-2">
                          <span className="text-xs text-gray-600">
                            Total Investment
                          </span>
                          <div className="text-base font-medium text-gray-700">
                            {formatInvestmentPrice(interest.totalInvestment)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Message */}
                    {interest.interest.message && (
                      <div className="mb-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <span className="text-xs font-medium text-gray-700">
                          Your Message:
                        </span>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {interest.interest.message}
                        </p>
                      </div>
                    )}

                    {/* Admin Notes (if any) */}
                    {(interest.interest as any).adminNotes && (
                      <div className="mb-3 bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <span className="text-xs font-medium text-blue-700">
                          Admin Notes:
                        </span>
                        <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                          {(interest.interest as any).adminNotes}
                        </p>
                      </div>
                    )}

                    {/* Expressed Date */}
                    <div className="text-xs text-gray-500 border-t border-gray-200 pt-3 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Expressed on{" "}
                      {new Date(
                        interest.interest.expressedAt
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Pagination */}
      {interestsPagination && interestsPagination.total > 0 && (
        <div className="px-4 sm:px-6 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-700">
            Showing {(currentPage - 1) * limit + 1} to{" "}
            {Math.min(currentPage * limit, interestsPagination.total)} of{" "}
            {interestsPagination.total} properties
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 py-1 text-sm">
              Page {currentPage} of {interestsPagination.pages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= interestsPagination.pages || loading}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterestedProperties;
