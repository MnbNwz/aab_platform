import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
  memo,
} from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../store";
import type { ContractorJob, ContractorJobDetails } from "../../types";
import {
  getContractorJobsThunk,
  getContractorJobByIdThunk,
} from "../../store/thunks/contractorJobThunks";
import {
  setContractorJobFilters,
  clearContractorJobError,
} from "../../store/slices/contractorJobSlice";
import { getServicesThunk } from "../../store/thunks/servicesThunks";
import ContractorJobDetailsModal from "../ContractorJobDetailsModal";
import DataTable, { TableColumn } from "../ui/DataTable";
import type { PaginationInfo } from "../ui/DataTable";
import { Filter } from "lucide-react";

const AvailableJobs: React.FC = memo(() => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    jobs,
    loading: jobsLoading,
    jobDetailsLoading,
    error: jobsError,
    pagination,
    filters,
    membershipInfo,
    leadInfo,
  } = useSelector((state: RootState) => state.contractorJob);
  const { services: backendServices, isInitialized: servicesInitialized } =
    useSelector((state: RootState) => state.services);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJob, setSelectedJob] = useState<ContractorJobDetails | null>(
    null
  );
  const [selectedJobLeadInfo, setSelectedJobLeadInfo] = useState<any>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedRef = useRef(false);

  // Fetch services from backend if not already loaded
  useEffect(() => {
    if (!servicesInitialized && backendServices.length === 0) {
      dispatch(getServicesThunk());
    }
  }, [dispatch, servicesInitialized, backendServices.length]);

  // Get backend services for filter dropdown
  const availableServices = useMemo(() => {
    return backendServices || [];
  }, [backendServices]);

  // Initialize filters on mount only
  useEffect(() => {
    if (!hasInitializedRef.current) {
      dispatch(
        setContractorJobFilters({
          status: "open",
          page: 1,
        })
      );
      hasInitializedRef.current = true;
    }
  }, [dispatch]);

  // Fetch available jobs when filters change
  useEffect(() => {
    const apiFilters = {
      ...filters,
      status: "open", // Always use "open" for available jobs
    };
    dispatch(getContractorJobsThunk(apiFilters));
  }, [dispatch, filters]);

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
        dispatch(setContractorJobFilters({ search: value, page: 1 }));
      }, 500);
    },
    [dispatch]
  );

  // Handle filter changes
  const handleFilterChange = useCallback(
    (newFilters: any) => {
      dispatch(setContractorJobFilters({ ...newFilters, page: 1 }));
    },
    [dispatch]
  );

  // Handle pagination
  const handlePageChange = useCallback(
    (page: number) => {
      dispatch(setContractorJobFilters({ page }));
    },
    [dispatch]
  );

  const handleCloseJobDetails = useCallback(() => {
    setShowJobDetails(false);
    setSelectedJob(null);
    setSelectedJobLeadInfo(null);
  }, []);

  const handleViewJob = useCallback(
    async (job: ContractorJob) => {
      dispatch(clearContractorJobError());
      setSelectedJob(null);
      setSelectedJobLeadInfo(null);
      setShowJobDetails(true);

      try {
        const result = await dispatch(
          getContractorJobByIdThunk({ jobId: job._id })
        );
        if (getContractorJobByIdThunk.fulfilled.match(result)) {
          setSelectedJob(result.payload as ContractorJobDetails);
          setSelectedJobLeadInfo(null);
        } else if (getContractorJobByIdThunk.rejected.match(result)) {
          dispatch(clearContractorJobError());
          handleCloseJobDetails();
        }
      } catch (_error) {
        dispatch(clearContractorJobError());
        handleCloseJobDetails();
      }
    },
    [dispatch, handleCloseJobDetails]
  );

  const handleBidSubmitted = useCallback(() => {
    // Refresh job list after bid submission
    const apiFilters = {
      ...filters,
      status: "open",
    };
    dispatch(getContractorJobsThunk(apiFilters));
  }, [dispatch, filters]);

  // Get membership tier color
  const getMembershipTierColor = useCallback((tier: string) => {
    switch (tier) {
      case "basic":
        return "bg-gray-100 text-gray-800";
      case "standard":
        return "bg-blue-100 text-blue-800";
      case "premium":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }, []);

  // Memoized columns
  const columns = useMemo<
    TableColumn<ContractorJob & Record<string, unknown>>[]
  >(() => {
    return [
      {
        key: "title",
        header: "Job Title",
        render: (job) => (
          <div className="min-w-0 max-w-xs">
            <div
              className="font-medium text-gray-900 truncate"
              title={job.title}
            >
              {job.title}
            </div>
          </div>
        ),
        mobileLabel: "Job Title",
        mobileRender: (job) => (
          <div className="min-w-0 w-full overflow-hidden">
            <h3
              className="font-semibold text-gray-900 text-base mb-3 break-words"
              style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
              title={job.title}
            >
              {job.title}
            </h3>
          </div>
        ),
      },
      {
        key: "service",
        header: "Service",
        render: (job) => (
          <span className="text-gray-700 capitalize">{job.service}</span>
        ),
        mobileLabel: "Service",
        mobileRender: (job) => (
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
            <span className="text-gray-600 text-sm">Service:</span>
            <span className="font-medium text-gray-900 capitalize text-sm">
              {job.service}
            </span>
          </div>
        ),
      },
      {
        key: "estimate",
        header: "Estimate",
        render: (job) => {
          // Convert from cents to dollars
          const estimateInDollars = job.estimate ? job.estimate / 100 : 0;
          return (
            <span className="font-semibold text-primary-700">
              $
              {estimateInDollars.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          );
        },
        mobileLabel: "Estimate",
        mobileRender: (job) => {
          // Convert from cents to dollars
          const estimateInDollars = job.estimate ? job.estimate / 100 : 0;
          return (
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
              <span className="text-gray-600 text-sm">Estimate:</span>
              <span className="font-semibold text-primary-700 text-sm">
                $
                {estimateInDollars.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          );
        },
      },
      {
        key: "timeline",
        header: "Timeline",
        render: (job) => (
          <span className="text-gray-700">{job.timeline} days</span>
        ),
        mobileLabel: "Timeline",
        mobileRender: (job) => (
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
            <span className="text-gray-600 text-sm">Timeline:</span>
            <span className="font-medium text-gray-900 text-sm">
              {job.timeline} days
            </span>
          </div>
        ),
        hideOnMobile: true,
      },
    ];
  }, []);

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
    <div className="w-full space-y-4 sm:space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-lg shadow-sm border border-primary-200 overflow-hidden w-full">
        {/* Header */}
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 truncate">
                Available Jobs
              </h2>
              {membershipInfo && (
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                  <span
                    className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-medium whitespace-nowrap ${getMembershipTierColor(
                      membershipInfo.tier
                    )}`}
                  >
                    {membershipInfo.tier.toUpperCase()} PLAN
                  </span>
                  <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                    {leadInfo?.leadsUsed || 0}/{leadInfo?.leadsLimit || 0} leads
                    used
                  </span>
                </div>
              )}
              {!membershipInfo && (
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Browse available job requests
                </p>
              )}
            </div>
            {membershipInfo && (
              <div className="text-xs sm:text-sm text-gray-600 flex-shrink-0">
                <div className="whitespace-nowrap">
                  Access Delay: {membershipInfo.accessDelayHours}h
                </div>
                <div className="whitespace-nowrap">
                  Radius: {membershipInfo.radiusKm}km
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filters with Search */}
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200 bg-white">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                Filters:
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Service Filter */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Service
                </label>
                <select
                  value={filters.service || ""}
                  onChange={(e) =>
                    handleFilterChange({ service: e.target.value })
                  }
                  className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white transition-colors"
                  disabled={availableServices.length === 0}
                >
                  <option value="">All</option>
                  {availableServices.length > 0 ? (
                    availableServices.map((service) => (
                      <option key={service} value={service}>
                        {service.charAt(0).toUpperCase() + service.slice(1)}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      No services available
                    </option>
                  )}
                </select>
              </div>

              {/* Search Input */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 placeholder-gray-300 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Jobs List Card */}
        <div className="w-full">
          <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
            <DataTable<ContractorJob & Record<string, unknown>>
              data={jobs as (ContractorJob & Record<string, unknown>)[]}
              columns={columns}
              loading={jobsLoading}
              error={jobsError}
              emptyMessage="No available jobs found."
              onRowClick={handleViewJob}
              pagination={paginationInfo}
              onPageChange={handlePageChange}
              paginationLabel={({ startItem, endItem, totalCount }) =>
                `Showing ${startItem} to ${endItem} of ${totalCount} jobs`
              }
              getRowKey={(job) => job._id}
              hoverable
            />
          </div>
        </div>
      </div>

      {/* Job Details Modal */}
      <ContractorJobDetailsModal
        job={selectedJob}
        isOpen={showJobDetails}
        onClose={handleCloseJobDetails}
        loading={jobDetailsLoading}
        leadInfo={selectedJobLeadInfo}
        onBidSubmitted={handleBidSubmitted}
        activeTab="available"
      />
    </div>
  );
});

AvailableJobs.displayName = "AvailableJobs";

export default AvailableJobs;
