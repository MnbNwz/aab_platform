import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../store";
import type { ContractorJob, ContractorJobDetails } from "../../types";
import {
  getContractorJobsThunk,
  getContractorJobByIdThunk,
} from "../../store/thunks/contractorJobThunks";
import { setContractorJobFilters } from "../../store/slices/contractorJobSlice";
import Loader from "../ui/Loader";
import { showToast } from "../../utils/toast";
import ContractorJobDetailsModal from "../ContractorJobDetailsModal";

const ContractorJobRequestsTable: React.FC = () => {
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
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ContractorJobDetails | null>(
    null
  );
  const [selectedJobLeadInfo, setSelectedJobLeadInfo] = useState<any>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);

  // Fetch jobs on mount and when filters change
  useEffect(() => {
    dispatch(getContractorJobsThunk(filters));
  }, [dispatch, filters]);

  // Handle search
  const handleSearch = () => {
    dispatch(setContractorJobFilters({ search: searchTerm, page: 1 }));
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: any) => {
    dispatch(setContractorJobFilters({ ...newFilters, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    dispatch(setContractorJobFilters({ page }));
  };

  // Handle job view (consumes a lead)
  const handleViewJob = async (job: ContractorJob) => {
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
  };

  const handleCloseJobDetails = () => {
    setShowJobDetails(false);
    setSelectedJob(null);
    setSelectedJobLeadInfo(null);
  };

  const handleBidSubmitted = () => {
    // Refresh job list after bid submission to update bid counts
    dispatch(getContractorJobsThunk(filters));
  };

  // Get membership tier color
  const getMembershipTierColor = (tier: string) => {
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
  };

  // Format date as "X days ago" or full date
  const formatPostedDate = (dateString: string) => {
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
  };

  return (
    <div className="bg-white rounded-lg shadow w-full max-w-full overflow-x-hidden">
      {/* Header with Membership Info */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
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

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && searchTerm.trim()) handleSearch();
              }}
              className="flex-1 min-w-0 pl-3 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              className="flex-shrink-0 flex items-center px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition"
              onClick={() => {
                if (searchTerm.trim()) {
                  handleSearch();
                }
              }}
              title="Search Jobs"
            >
              Search
            </button>
          </div>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex-shrink-0 flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service
              </label>
              <select
                value={filters.service || ""}
                onChange={(e) =>
                  handleFilterChange({ service: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All Services</option>
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="hvac">HVAC</option>
                <option value="painting">Painting</option>
                <option value="cleaning">Cleaning</option>
                <option value="renovation">Renovation</option>
                <option value="solar">Solar</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Card View */}
      <div className="block lg:hidden w-full overflow-x-hidden">
        {jobsLoading ? (
          <div className="py-12">
            <div className="flex justify-center items-center w-full h-full">
              <Loader size="large" color="accent" />
            </div>
          </div>
        ) : (
          <div className="space-y-3 p-4 w-full">
            {jobs.map((job: ContractorJob) => (
              <div
                key={job._id}
                onClick={() => handleViewJob(job)}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow w-full cursor-pointer"
              >
                <h3
                  className="font-semibold text-gray-900 text-base mb-3 truncate"
                  title={job.title}
                >
                  {job.title}
                </h3>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service:</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {job.service}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimate:</span>
                    <span className="font-semibold text-primary-700">
                      ${(job.estimate / 100).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Timeline:</span>
                    <span className="font-medium text-gray-900">
                      {job.timeline} days
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Posted:</span>
                    <span className="text-gray-900">
                      {formatPostedDate(job.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {jobs.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No job requests found.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Job Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estimate
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timeline
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Posted
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {jobsLoading ? (
              <tr>
                <td colSpan={5} className="py-12">
                  <div className="flex justify-center items-center w-full h-full">
                    <Loader size="large" color="accent" />
                  </div>
                </td>
              </tr>
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-gray-500 py-8">
                  No job requests found.
                </td>
              </tr>
            ) : (
              jobs.map((job: ContractorJob) => (
                <tr
                  key={job._id}
                  onClick={() => handleViewJob(job)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div
                      className="font-medium text-gray-900 truncate max-w-xs"
                      title={job.title}
                    >
                      {job.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700 capitalize">
                    {job.service}
                  </td>
                  <td className="px-6 py-4 text-center font-semibold text-primary-700">
                    ${(job.estimate / 100).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-700">
                    {job.timeline} days
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">
                    {formatPostedDate(job.createdAt)}
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
              {(() => {
                const currentPage = pagination.page;
                const limit = pagination.limit;
                const total = pagination.total;
                const start = (currentPage - 1) * limit + 1;
                const end = Math.min(currentPage * limit, total);
                return `Showing ${start} to ${end} of ${total} jobs`;
              })()}
            </div>
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrevPage || jobsLoading}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm font-medium min-w-[44px]"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {pagination.totalPages > 1 ? (
                  Array.from(
                    { length: Math.min(5, pagination.totalPages) },
                    (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg min-w-[40px] ${
                            pagination.page === pageNum
                              ? "bg-accent-500 text-white"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                  )
                ) : (
                  <span className="px-3 py-2 text-sm font-medium text-gray-500">
                    Page 1 of 1
                  </span>
                )}
              </div>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNextPage || jobsLoading}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm font-medium min-w-[44px]"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {jobsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
          <p className="text-red-700">Error loading jobs: {jobsError}</p>
        </div>
      )}

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
};

export default ContractorJobRequestsTable;
