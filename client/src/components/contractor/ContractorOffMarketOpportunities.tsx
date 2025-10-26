import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
  memo,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../store";
import {
  fetchInvestmentOpportunitiesThunk,
  setFilters,
  clearFilters,
} from "../../store/slices/investmentOpportunitySlice";
import type {
  InvestmentOpportunity,
  InvestmentPropertyType,
  InvestmentStatus,
} from "../../types";
import FilterPanel from "../ui/FilterPanel";
import {
  FilterConfigs,
  createSelectFieldWithAll,
  createNumberField,
} from "../ui/FilterPanel.utils";
import { Building2, Search, Lock, CheckCircle, MapPin } from "lucide-react";
import {
  formatInvestmentPrice,
  getInvestmentStatusBadge,
  getPropertyTypeIcon,
} from "../../utils/investmentOpportunity";
import { useProvinces } from "../../constants";
import InvestmentOpportunityDetailsModal from "../dashboard/InvestmentOpportunityDetailsModal";
import DataTable, { TableColumn } from "../ui/DataTable";
import type { PaginationInfo } from "../ui/DataTable";

const ContractorOffMarketOpportunities: React.FC = memo(() => {
  const dispatch = useDispatch<AppDispatch>();
  const { opportunities, loading, filters, pagination } = useSelector(
    (state: RootState) => state.investmentOpportunity
  );
  const currentMembership = useSelector(
    (state: RootState) => state.membership.current
  );

  // Use memoized provinces from constants
  const provinces = useProvinces(true); // common provinces only

  const [searchTerm, setSearchTerm] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<InvestmentOpportunity | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxPriceDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Check if user has standard or premium access (basic tier shows teaser)
  const hasAccess =
    currentMembership &&
    currentMembership.status === "active" &&
    (currentMembership.planId.tier === "standard" ||
      currentMembership.planId.tier === "premium");

  useEffect(() => {
    // Only fetch data if user has access (standard or premium)
    if (!hasAccess) return;

    dispatch(fetchInvestmentOpportunitiesThunk(filters));
  }, [dispatch, filters, hasAccess]);

  // Sync maxPriceInput with filters.maxPrice
  useEffect(() => {
    if (filters.maxPrice && filters.maxPrice > 0) {
      setMaxPriceInput(filters.maxPrice.toString());
    } else {
      setMaxPriceInput("");
    }
  }, [filters.maxPrice]);

  // Clear filters on unmount to prevent persistence
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (maxPriceDebounceRef.current) {
        clearTimeout(maxPriceDebounceRef.current);
      }
      dispatch(clearFilters());
      setSearchTerm("");
      setMaxPriceInput("");
    };
  }, [dispatch]);

  // Handle search input with debouncing
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer for debounced search
      debounceTimerRef.current = setTimeout(() => {
        dispatch(setFilters({ search: value, page: 1 }));
      }, 500);
    },
    [dispatch]
  );

  // Handle maxPrice input with debouncing
  const handleMaxPriceChange = useCallback(
    (value: any) => {
      // Update local state immediately for UI responsiveness
      setMaxPriceInput(value || "");

      // Parse the value
      const numValue =
        value === "" || value === undefined ? undefined : Number(value);

      // Clear existing timer
      if (maxPriceDebounceRef.current) {
        clearTimeout(maxPriceDebounceRef.current);
      }

      // Set new timer for debounced maxPrice update
      maxPriceDebounceRef.current = setTimeout(() => {
        const newFilters: any = { page: 1 };
        if (numValue !== undefined && numValue > 0) {
          newFilters.maxPrice = numValue;
        }
        dispatch(setFilters(newFilters));
      }, 500);
    },
    [dispatch]
  );

  const handleFilterChange = useCallback(
    (newFilters: Partial<typeof filters>) => {
      dispatch(setFilters({ ...newFilters, page: 1 }));
    },
    [dispatch]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      dispatch(setFilters({ page: newPage }));
    },
    [dispatch]
  );

  const handleViewDetails = useCallback(
    (opportunity: InvestmentOpportunity) => {
      setSelectedOpportunity(opportunity);
      setShowDetailsModal(true);
    },
    []
  );

  const renderStatusBadge = useCallback((status: InvestmentStatus) => {
    const { className, label } = getInvestmentStatusBadge(status);
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${className}`}
      >
        {label}
      </span>
    );
  }, []);

  const renderPropertyTypeIcon = useCallback((type: InvestmentPropertyType) => {
    const IconComponent = getPropertyTypeIcon(type);
    return <IconComponent className="h-4 w-4" />;
  }, []);

  // Memoize FilterPanel fields
  const filterFields = useMemo(
    () => [
      FilterConfigs.investmentStatus(filters.status || ""),
      FilterConfigs.propertyType(filters.propertyType || ""),
      createSelectFieldWithAll(
        "province",
        "Province",
        provinces,
        filters.province || ""
      ),
      createNumberField("maxPrice", "Max Price ($)", maxPriceInput, "∞"),
    ],
    [
      filters.status,
      filters.propertyType,
      filters.province,
      provinces,
      maxPriceInput,
    ]
  );

  // Memoize FilterPanel values
  const filterValues = useMemo(
    () => ({
      status: filters.status || "",
      propertyType: filters.propertyType || "",
      province: filters.province || "",
      maxPrice: maxPriceInput,
    }),
    [filters.status, filters.propertyType, filters.province, maxPriceInput]
  );

  // Memoize FilterPanel onChange handler
  const handleFilterPanelChange = useCallback(
    (newFilters: any) => {
      // Handle maxPrice separately with debouncing
      if (newFilters.maxPrice !== undefined) {
        handleMaxPriceChange(newFilters.maxPrice);
      }
      // Handle other filters immediately
      if (
        newFilters.status !== undefined ||
        newFilters.propertyType !== undefined ||
        newFilters.province !== undefined
      ) {
        const { maxPrice: _maxPrice, ...restFilters } = newFilters;
        handleFilterChange(restFilters as Partial<typeof filters>);
      }
    },
    [handleMaxPriceChange, handleFilterChange]
  );

  // Memoized columns
  const columns = useMemo<
    TableColumn<InvestmentOpportunity & Record<string, unknown>>[]
  >(
    () => [
      {
        key: "property",
        header: "Property",
        render: (opportunity) => (
          <div>
            <div className="text-sm font-medium text-gray-900">
              {opportunity.title}
            </div>
            <div className="text-xs text-gray-500 capitalize flex items-center gap-1">
              {renderPropertyTypeIcon(opportunity.propertyType)}
              {opportunity.propertyType}
            </div>
          </div>
        ),
        mobileLabel: "Property",
        mobileRender: (opportunity) => (
          <div>
            {/* Property Image */}
            {opportunity.photos && opportunity.photos.length > 0 ? (
              <div className="h-48 overflow-hidden mb-3 rounded-lg">
                <img
                  src={opportunity.photos[0].url}
                  alt={opportunity.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="h-48 bg-gray-200 flex items-center justify-center mb-3 rounded-lg">
                <Building2 className="h-16 w-16 text-gray-400" />
              </div>
            )}
            {/* Title and Type */}
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-primary-900 mb-2">
                {opportunity.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-gray-500 capitalize">
                {renderPropertyTypeIcon(opportunity.propertyType)}
                <span>{opportunity.propertyType}</span>
              </div>
            </div>
            {/* Location */}
            {opportunity.location && (
              <div className="flex items-center text-sm text-gray-600 mb-3">
                <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="truncate">
                  {opportunity.location.city && opportunity.location.province
                    ? `${opportunity.location.city}, ${opportunity.location.province}`
                    : "Location available"}
                </span>
              </div>
            )}
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <span className="text-xs text-gray-600">Price</span>
                <div className="text-base font-bold text-primary-900">
                  {formatInvestmentPrice(opportunity.askingPrice)}
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-600">ROI</span>
                <div className="text-base font-semibold text-green-600">
                  {opportunity.projectedROI
                    ? `${opportunity.projectedROI}%`
                    : "-"}
                </div>
              </div>
            </div>
            {/* Status and Interests */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              {renderStatusBadge(opportunity.status)}
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {opportunity.interestCount ||
                    opportunity.interests?.length ||
                    0}{" "}
                  Interests
                </span>
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "price",
        header: "Price",
        render: (opportunity) => (
          <div className="text-sm font-semibold text-gray-900">
            {formatInvestmentPrice(opportunity.askingPrice)}
          </div>
        ),
        hideOnMobile: true,
      },
      {
        key: "roi",
        header: "ROI",
        render: (opportunity) => (
          <div className="text-sm font-semibold text-green-600">
            {opportunity.projectedROI ? `${opportunity.projectedROI}%` : "-"}
          </div>
        ),
        hideOnMobile: true,
      },
      {
        key: "status",
        header: "Status",
        render: (opportunity) => renderStatusBadge(opportunity.status),
        hideOnMobile: true,
      },
      {
        key: "interests",
        header: "Interests",
        render: (opportunity) => (
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {opportunity.interestCount || opportunity.interests?.length || 0}
          </span>
        ),
        hideOnMobile: true,
      },
    ],
    [renderStatusBadge, renderPropertyTypeIcon]
  );

  // Pagination info
  const paginationInfo = useMemo<PaginationInfo | undefined>(() => {
    if (!pagination || pagination.total === 0) return undefined;
    return {
      currentPage: pagination.page,
      totalPages: pagination.pages,
      totalCount: pagination.total,
      limit: pagination.limit,
      hasNextPage: pagination.page < pagination.pages,
      hasPrevPage: pagination.page > 1,
    };
  }, [pagination]);

  // Access Gate - Only show teaser for basic tier
  if (!hasAccess) {
    return (
      <div className="space-y-6">
        {/* Upgrade Feature Banner */}
        <div className="bg-gradient-to-r from-primary-800 to-primary-900 rounded-lg shadow-lg p-6 text-white border border-accent-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-accent-500/20 p-3 rounded-full">
                <Lock className="h-8 w-8 text-accent-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-1 text-white">
                  Upgrade Required
                </h3>
                <p className="text-white/90">
                  Unlock exclusive off-market investment opportunities
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Teaser Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 text-center border border-primary-200">
            <div className="text-4xl font-bold text-accent-500 mb-2">15+</div>
            <p className="text-primary-800">Available Properties</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center border border-primary-200">
            <div className="text-4xl font-bold text-accent-500 mb-2">12%</div>
            <p className="text-primary-800">Average ROI</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center border border-primary-200">
            <div className="text-4xl font-bold text-accent-500 mb-2">$450K</div>
            <p className="text-primary-800">Average Price</p>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-primary-900 mb-4">
            Benefits of Off-Market Access
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-accent-500 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-primary-900">
                  Exclusive Properties
                </h4>
                <p className="text-sm text-primary-700">
                  Access investment opportunities before they hit the market
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-accent-500 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-primary-900">
                  High ROI Potential
                </h4>
                <p className="text-sm text-primary-700">
                  Properties with 10-15% projected return on investment
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-accent-500 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-primary-900">
                  Direct Communication
                </h4>
                <p className="text-sm text-primary-700">
                  Express interest and connect directly with property owners
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-accent-500 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-primary-900">
                  Detailed Information
                </h4>
                <p className="text-sm text-primary-700">
                  Full property details, photos, documents, and renovation needs
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-accent-500 to-accent-600 rounded-lg shadow-lg p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-3">
            Want to Access Off-Market Properties?
          </h3>
          <p className="text-white/90 mb-4 max-w-2xl mx-auto">
            To unlock exclusive off-market investment opportunities, priority
            job access, featured listings, and more, you'll need to upgrade your
            membership to Standard or Premium tier.
          </p>
          <p className="text-white/90 max-w-2xl mx-auto text-sm font-medium">
            Visit the Membership section in the sidebar to view available plans
            and upgrade your account.
          </p>
        </div>
      </div>
    );
  }

  // Premium Content
  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-lg shadow-sm border border-primary-200">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Off Market Properties
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Browse exclusive investment opportunities
              </p>
            </div>
            {/* Search */}
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title, description..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <FilterPanel
          mode="inline"
          fields={filterFields}
          values={filterValues}
          onChange={handleFilterPanelChange}
          showFilterIcon={true}
          columns={{ mobile: 1, tablet: 2, desktop: 4 }}
        />
      </div>

      {/* Opportunities List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <DataTable<InvestmentOpportunity & Record<string, unknown>>
          data={
            (opportunities || []) as (InvestmentOpportunity &
              Record<string, unknown>)[]
          }
          columns={columns}
          loading={loading}
          emptyMessage="No off-market properties available at the moment. Check back soon!"
          emptyIcon={
            <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          }
          onRowClick={handleViewDetails}
          pagination={paginationInfo}
          onPageChange={handlePageChange}
          paginationLabel={({ startItem, endItem, totalCount }) =>
            `Showing ${startItem} to ${endItem} of ${totalCount} ${
              totalCount === 1 ? "opportunity" : "opportunities"
            }`
          }
          getRowKey={(opportunity) => opportunity._id}
          hoverable
        />
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedOpportunity && (
        <InvestmentOpportunityDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedOpportunity(null);
          }}
          opportunityId={selectedOpportunity._id}
          isContractor={true}
          // Don't pass onEdit and onStatusChange for contractors (view-only)
        />
      )}
    </div>
  );
});

ContractorOffMarketOpportunities.displayName =
  "ContractorOffMarketOpportunities";

export default ContractorOffMarketOpportunities;
