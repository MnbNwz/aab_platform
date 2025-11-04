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
import { setContractorJobFilters } from "../../store/slices/contractorJobSlice";
import { showToast } from "../../utils/toast";
import ContractorJobDetailsModal from "../ContractorJobDetailsModal";
import DataTable, { TableColumn } from "../ui/DataTable";
import type { PaginationInfo } from "../ui/DataTable";
import { Filter } from "lucide-react";

const ContractorJobRequestsTable: React.FC = memo(() => {
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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJob, setSelectedJob] = useState<ContractorJobDetails | null>(
    null
  );
  const [selectedJobLeadInfo, setSelectedJobLeadInfo] = useState<any>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (filters.page !== 1) {
      dispatch(setContractorJobFilters({ page: 1 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch jobs when filters change
  useEffect(() => {
    dispatch(getContractorJobsThunk(filters));
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

  // Handle job view (consumes a lead)
  const handleViewJob = useCallback(
    async (job: ContractorJob) => {
      // Open modal immediately with loader (set to null, details will load)
      setSelectedJob(null);
      setSelectedJobLeadInfo(null);
      setShowJobDetails(true);

      try {
        const result = await dispatch(getContractorJobByIdThunk(job._id));
        if (getContractorJobByIdThunk.fulfilled.match(result)) {
          // New API response: job data is directly in payload (no nested .job)
          setSelectedJob(result.payload as ContractorJobDetails);
          // No leadInfo in new response
          setSelectedJobLeadInfo(null);
        }
      } catch (_error) {
        showToast.error("Failed to load job details");
        // Close modal on error
        handleCloseJobDetails();
      }
    },
    [dispatch, handleCloseJobDetails]
  );

  const handleBidSubmitted = useCallback(() => {
    // Refresh job list after bid submission to update bid counts
    dispatch(getContractorJobsThunk(filters));
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

  // Format date as "X days ago" or full date
  const formatPostedDate = useCallback((dateString: string) => {
    const postedDate = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - postedDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInMonths = Math.floor(diffInDays / 30);

    if (diffInMonths < 1) {
      if (diffInDays === 0) return "Today";
      if (diffInDays === 1) return "1 day ago";
      return `${diffInDays} days ago`;
    }

    return postedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  // Memoized columns
  const columns = useMemo<
    TableColumn<ContractorJob & Record<string, unknown>>[]
  >(
    () => [
      {
        key: "title",
        header: "Job Title",
        render: (job) => (
          <div
            className="font-medium text-gray-900 truncate max-w-xs"
            title={job.title}
          >
            {job.title}
          </div>
        ),
        mobileLabel: "Job Title",
        mobileRender: (job) => (
          <h3
            className="font-semibold text-gray-900 text-base mb-3 truncate"
            title={job.title}
          >
            {job.title}
          </h3>
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
          <div className="flex justify-between">
            <span className="text-gray-600">Service:</span>
            <span className="font-medium text-gray-900 capitalize">
              {job.service}
            </span>
          </div>
        ),
      },
      {
        key: "estimate",
        header: "Estimate",
        render: (job) => (
          <span className="font-semibold text-primary-700">
            $
            {job.estimate.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        ),
        mobileLabel: "Estimate",
        mobileRender: (job) => (
          <div className="flex justify-between">
            <span className="text-gray-600">Estimate:</span>
            <span className="font-semibold text-primary-700">
              $
              {job.estimate.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        ),
      },
      {
        key: "timeline",
        header: "Timeline",
        render: (job) => (
          <span className="text-gray-700">{job.timeline} days</span>
        ),
        mobileLabel: "Timeline",
        mobileRender: (job) => (
          <div className="flex justify-between">
            <span className="text-gray-600">Timeline:</span>
            <span className="font-medium text-gray-900">
              {job.timeline} days
            </span>
          </div>
        ),
        hideOnMobile: true,
      },
      {
        key: "posted",
        header: "Posted",
        render: (job) => (
          <span className="text-sm text-gray-600">
            {formatPostedDate(job.createdAt)}
          </span>
        ),
        mobileLabel: "Posted",
        mobileRender: (job) => (
          <div className="flex justify-between">
            <span className="text-gray-600">Posted:</span>
            <span className="text-gray-900">
              {formatPostedDate(job.createdAt)}
            </span>
          </div>
        ),
        hideOnMobile: true,
      },
    ],
    [formatPostedDate]
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
      {/* Header Card */}
      <div className="bg-white rounded-lg shadow-sm border border-primary-200">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Job Requests
              </h2>
              {membershipInfo && (
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getMembershipTierColor(
                      membershipInfo.tier
                    )}`}
                  >
                    {membershipInfo.tier.toUpperCase()} PLAN
                  </span>
                  <span className="text-sm text-gray-600">
                    {leadInfo?.leadsUsed || 0}/{leadInfo?.leadsLimit || 0} leads
                    used
                  </span>
                </div>
              )}
              {!membershipInfo && (
                <p className="text-sm text-gray-500 mt-1">
                  Browse available job requests
                </p>
              )}
            </div>
            {membershipInfo && (
              <div className="text-sm text-gray-600">
                <div>Access Delay: {membershipInfo.accessDelayHours}h</div>
                <div>Radius: {membershipInfo.radiusKm}km</div>
              </div>
            )}
          </div>
        </div>

        {/* Filters with Search */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                Filters:
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Service Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Service
                </label>
                <select
                  value={filters.service || ""}
                  onChange={(e) =>
                    handleFilterChange({ service: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white text-sm transition-colors"
                >
                  <option value="">All</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                  <option value="hvac">HVAC</option>
                  <option value="roofing">Roofing</option>
                  <option value="painting">Painting</option>
                  <option value="flooring">Flooring</option>
                  <option value="general">General</option>
                </select>
              </div>

              {/* Search Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white text-sm transition-colors placeholder-gray-300"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs List Card */}
      <div className="bg-white rounded-lg shadow-sm border border-primary-200">
        <DataTable<ContractorJob & Record<string, unknown>>
          data={jobs as (ContractorJob & Record<string, unknown>)[]}
          columns={columns}
          loading={jobsLoading}
          error={jobsError}
          emptyMessage="No job requests found."
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

      {/* Job Details Modal */}
      <ContractorJobDetailsModal
        job={selectedJob}
        isOpen={showJobDetails}
        onClose={handleCloseJobDetails}
        loading={jobDetailsLoading}
        leadInfo={selectedJobLeadInfo}
        onBidSubmitted={handleBidSubmitted}
      />
    </div>
  );
});

ContractorJobRequestsTable.displayName = "ContractorJobRequestsTable";

export default ContractorJobRequestsTable;
