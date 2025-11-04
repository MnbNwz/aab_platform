import React, { useEffect, useCallback, useState, useMemo, memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../store";
import { fetchMyInterestsThunk } from "../../store/slices/investmentOpportunitySlice";
import type {
  InvestmentStatus,
  ContactStatus,
  ContractorInvestmentInterest,
} from "../../types";
import FilterPanel from "../ui/FilterPanel";
import { FilterConfigs } from "../ui/FilterPanel.utils";
import DataTable, { TableColumn, PaginationInfo } from "../ui/DataTable";
import {
  Building2,
  Heart,
  MapPin,
  CheckCircle,
  AlertCircle,
  X,
  TrendingUp,
  Calendar,
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

  // Instant filtering - no apply/clear buttons needed
  const handleFilterChange = useCallback((newValues: any) => {
    setSelectedStatus(newValues.status || "");
    setSelectedContactStatus(newValues.contactStatus || "");
    setSortOrder((newValues.sortOrder as "asc" | "desc") || "desc");
    // Apply filters immediately
    setAppliedStatus(newValues.status || "");
    setAppliedContactStatus(newValues.contactStatus || "");
    setAppliedSortOrder((newValues.sortOrder as "asc" | "desc") || "desc");
    setCurrentPage(1);
  }, []);

  const renderContactStatusBadge = useCallback((status: ContactStatus) => {
    const { className, label } = getContactStatusBadge(status);
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
        {label}
      </span>
    );
  }, []);

  const getPropertyTypeBadge = useCallback((type: string) => {
    const badges: { [key: string]: string } = {
      house: "bg-blue-100 text-blue-800",
      duplex: "bg-green-100 text-green-800",
      triplex: "bg-yellow-100 text-yellow-800",
      sixplex: "bg-purple-100 text-purple-800",
      land: "bg-orange-100 text-orange-800",
      commercial: "bg-red-100 text-red-800",
    };
    return badges[type] || "bg-gray-100 text-gray-800";
  }, []);

  // Memoized columns
  const columns = useMemo<
    TableColumn<ContractorInvestmentInterest & Record<string, unknown>>[]
  >(
    () => [
      {
        key: "property",
        header: "Property",
        render: (interest) => (
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
                {interest.location.city && interest.location.province
                  ? `${interest.location.city}, ${interest.location.province}`
                  : interest.location.fullAddress ||
                    `${interest.location.coordinates[1]}, ${interest.location.coordinates[0]}`}
              </div>
            </div>
          </div>
        ),
        mobileLabel: "Property",
        mobileRender: (interest) => (
          <div className="p-4">
            {interest.photos && interest.photos.length > 0 ? (
              <div className="h-48 overflow-hidden mb-3 rounded-lg">
                <img
                  src={interest.photos[0].url}
                  alt={interest.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="h-48 bg-primary-100 flex items-center justify-center mb-3 rounded-lg">
                <Building2 className="h-16 w-16 text-primary-400" />
              </div>
            )}
            <h3 className="text-lg font-semibold text-primary-900 mb-2">
              {interest.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-primary-600 capitalize mb-3">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPropertyTypeBadge(
                  interest.propertyType
                )}`}
              >
                {interest.propertyType}
              </span>
            </div>
            {interest.location && (
              <div className="flex items-center text-sm text-primary-700 mb-3">
                <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="truncate">
                  {interest.location.city && interest.location.province
                    ? `${interest.location.city}, ${interest.location.province}`
                    : "Location available"}
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <span className="text-xs text-primary-700">Price</span>
                <div className="text-base font-bold text-primary-900">
                  {formatInvestmentPrice(interest.askingPrice)}
                </div>
              </div>
              {interest.projectedROI && (
                <div>
                  <span className="text-xs text-primary-700">ROI</span>
                  <div className="text-base font-semibold text-green-600">
                    {interest.projectedROI}%
                  </div>
                </div>
              )}
            </div>
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
            <div className="flex items-center justify-between pt-3 border-t border-primary-200">
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
              {renderContactStatusBadge(interest.interest.contactStatus)}
            </div>
            <div className="text-xs text-gray-500 border-t border-gray-200 pt-3 mt-3 flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              Expressed on{" "}
              {new Date(interest.interest.expressedAt).toLocaleDateString(
                "en-US",
                {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }
              )}
            </div>
          </div>
        ),
      },
      {
        key: "type",
        header: "Type",
        render: (interest) => (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPropertyTypeBadge(
              interest.propertyType
            )}`}
          >
            {interest.propertyType}
          </span>
        ),
        hideOnMobile: true,
      },
      {
        key: "price",
        header: "Price",
        render: (interest) => (
          <div>
            <div className="text-sm font-medium text-gray-900">
              {formatInvestmentPrice(interest.askingPrice)}
            </div>
            {interest.totalInvestment && (
              <div className="text-xs text-gray-500">
                Total: {formatInvestmentPrice(interest.totalInvestment)}
              </div>
            )}
          </div>
        ),
        hideOnMobile: true,
      },
      {
        key: "roi",
        header: "ROI",
        render: (interest) =>
          interest.projectedROI ? (
            <div className="flex items-center text-sm font-medium text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              {interest.projectedROI}%
            </div>
          ) : (
            <span className="text-sm text-gray-400">N/A</span>
          ),
        hideOnMobile: true,
      },
      {
        key: "status",
        header: "Status",
        render: (interest) => {
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
        },
        hideOnMobile: true,
      },
      {
        key: "contactStatus",
        header: "Contact Status",
        render: (interest) =>
          renderContactStatusBadge(
            interest.interest.contactStatus as ContactStatus
          ),
        hideOnMobile: true,
      },
      {
        key: "expressed",
        header: "Expressed",
        render: (interest) => (
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-1" />
            {new Date(interest.interest.expressedAt).toLocaleDateString()}
          </div>
        ),
        hideOnMobile: true,
      },
    ],
    [getPropertyTypeBadge, renderContactStatusBadge]
  );

  // Pagination info
  const paginationInfo = useMemo<PaginationInfo | undefined>(() => {
    if (!interestsPagination || interestsPagination.total === 0)
      return undefined;
    return {
      currentPage: interestsPagination.page || currentPage,
      totalPages: interestsPagination.pages || 1,
      totalCount: interestsPagination.total || 0,
      limit: limit,
      hasNextPage:
        (interestsPagination.page || currentPage) <
        (interestsPagination.pages || 1),
      hasPrevPage: (interestsPagination.page || currentPage) > 1,
    };
  }, [interestsPagination, currentPage, limit]);

  // If no access, don't render anything (menu item is hidden in sidebar for basic tier)
  if (!hasAccess) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-primary-200">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              My Interested Properties
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Track all properties you've expressed interest in
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <FilterPanel
        mode="inline"
        fields={[
          FilterConfigs.investmentStatus(selectedStatus),
          FilterConfigs.contactStatus(selectedContactStatus),
          FilterConfigs.sortOrder(sortOrder),
        ]}
        values={{
          status: selectedStatus,
          contactStatus: selectedContactStatus,
          sortOrder: sortOrder,
        }}
        onChange={handleFilterChange}
        showFilterIcon={true}
        columns={{ mobile: 1, tablet: 2, desktop: 3 }}
      />

      {/* DataTable */}
      <DataTable<ContractorInvestmentInterest & Record<string, unknown>>
        data={
          (myInterests || []) as (ContractorInvestmentInterest &
            Record<string, unknown>)[]
        }
        columns={columns}
        loading={loading}
        emptyMessage="You haven't expressed interest in any off-market opportunities yet"
        emptyIcon={<Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />}
        pagination={paginationInfo}
        onPageChange={handlePageChange}
        paginationLabel={({ startItem, endItem, totalCount }) =>
          `Showing ${startItem} to ${endItem} of ${totalCount} ${
            totalCount === 1 ? "interest" : "interests"
          }`
        }
        getRowKey={(interest) => interest.opportunityId}
        hoverable
      />
    </div>
  );
};

export default memo(InterestedProperties);
