import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../store";
import type { ContractorJob } from "../../types";
import {
  getContractorJobsThunk,
  getContractorJobByIdThunk,
  checkContractorJobAccessThunk,
} from "../../store/thunks/contractorJobThunks";
import {
  setContractorJobFilters,
  clearAccessCheck,
} from "../../store/slices/contractorJobSlice";
import Loader from "../ui/Loader";
import { showToast } from "../../utils/toast";
import ConfirmModal from "../ui/ConfirmModal";

const ContractorJobRequestsTable: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    jobs,
    loading: jobsLoading,
    error: jobsError,
    pagination,
    filters,
    membershipInfo,
    leadInfo,
    accessCheck,
  } = useSelector((state: RootState) => state.contractorJob);
  const user = useSelector((state: RootState) => state.auth.user);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ContractorJob | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [accessCheckModal, setAccessCheckModal] = useState(false);
  const [jobToCheck, setJobToCheck] = useState<ContractorJob | null>(null);

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
    if (!leadInfo?.canAccess) {
      showToast.error(
        "You have reached your monthly lead limit. Please upgrade your membership."
      );
      return;
    }

    if (!job.canAccessNow) {
      showToast.error(
        `This job will be available at ${new Date(
          job.accessTime
        ).toLocaleString()}`
      );
      return;
    }

    try {
      const result = await dispatch(getContractorJobByIdThunk(job._id));
      if (getContractorJobByIdThunk.fulfilled.match(result)) {
        setSelectedJob(result.payload.job);
        setShowJobDetails(true);
        showToast.success("Job details loaded successfully!");
        // Refresh the job list to update lead count
        dispatch(getContractorJobsThunk(filters));
      }
    } catch (error) {
      showToast.error("Failed to load job details");
    }
  };

  // Handle access check (without consuming lead)
  const handleCheckAccess = async (job: ContractorJob) => {
    setJobToCheck(job);
    setAccessCheckModal(true);
    dispatch(clearAccessCheck());

    try {
      await dispatch(checkContractorJobAccessThunk(job._id));
    } catch (error) {
      showToast.error("Failed to check job access");
    }
  };

  const handleCloseJobDetails = () => {
    setShowJobDetails(false);
    setSelectedJob(null);
  };

  const handleCloseAccessCheck = () => {
    setAccessCheckModal(false);
    setJobToCheck(null);
    dispatch(clearAccessCheck());
  };

  // Format time remaining until access
  const formatTimeRemaining = (accessTime: string) => {
    const now = new Date();
    const access = new Date(accessTime);
    const diff = access.getTime() - now.getTime();

    if (diff <= 0) return "Available now";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
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
                className={`bg-white border rounded-lg p-4 shadow-sm transition-shadow w-full ${
                  job.canAccessNow
                    ? "border-green-200 hover:shadow-md"
                    : "border-gray-300 hover:shadow-sm"
                }`}
              >
                <div className="flex justify-between items-start mb-3 gap-2">
                  <h3 className="font-semibold text-gray-900 text-sm flex-1 min-w-0">
                    <span className="block truncate" title={job.title}>
                      {job.title.length > 30
                        ? `${job.title.substring(0, 30)}...`
                        : job.title}
                    </span>
                  </h3>
                  <div className="flex flex-col gap-1">
                    {job.type === "off_market" && (
                      <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                        Off-Market
                      </span>
                    )}
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        job.canAccessNow
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {job.canAccessNow ? "Available" : "Locked"}
                    </span>
                  </div>
                </div>

                <div className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Service:</span> {job.service}
                </div>

                <div className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Estimate:</span> $
                  {job.estimate.toLocaleString()}
                </div>

                <div className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Distance:</span>{" "}
                  {job.distance.toFixed(1)}km
                </div>

                <div className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Bids:</span> {job.bidCount}
                </div>

                {!job.canAccessNow && (
                  <div className="text-sm text-yellow-600 mb-3">
                    <span className="font-medium">Available in:</span>{" "}
                    {formatTimeRemaining(job.accessTime)}
                  </div>
                )}

                <div className="text-sm text-gray-500 mb-3">
                  <span className="font-medium">Created:</span>{" "}
                  {new Date(job.createdAt).toLocaleDateString()}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewJob(job)}
                    disabled={!job.canAccessNow || !leadInfo?.canAccess}
                    className="flex-1 bg-accent-50 text-accent-600 px-3 py-2 rounded text-sm font-medium hover:bg-accent-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleCheckAccess(job)}
                    className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded text-sm font-medium hover:bg-blue-100 transition"
                  >
                    Check Access
                  </button>
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
              <th className="px-3 lg:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                Title
              </th>
              <th className="px-3 lg:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                Service
              </th>
              <th className="px-3 lg:px-6 py-3 text-center font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                Estimate
              </th>
              <th className="px-3 lg:px-6 py-3 text-center font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                Distance
              </th>
              <th className="px-3 lg:px-6 py-3 text-center font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                Status
              </th>
              <th className="px-3 lg:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                Created
              </th>
              <th className="px-3 lg:px-6 py-3 text-center font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {jobsLoading ? (
              <tr>
                <td colSpan={7} className="py-12">
                  <div className="flex justify-center items-center w-full h-full">
                    <Loader size="large" color="accent" />
                  </div>
                </td>
              </tr>
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-500 py-8">
                  No job requests found.
                </td>
              </tr>
            ) : (
              jobs.map((job: ContractorJob) => (
                <tr key={job._id} className="hover:bg-gray-50">
                  <td className="px-3 lg:px-6 py-4 font-semibold text-gray-900 max-w-xs">
                    <span className="block truncate" title={job.title}>
                      {job.title.length > 40
                        ? `${job.title.substring(0, 40)}...`
                        : job.title}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      {job.description?.slice(0, 60)}
                      {job.description?.length > 60 ? "..." : ""}
                    </div>
                    {job.type === "off_market" && (
                      <span className="inline-block text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded mt-1">
                        Off-Market
                      </span>
                    )}
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-gray-700">
                    {job.service}
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-center text-gray-700">
                    ${job.estimate.toLocaleString()}
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-center text-gray-700">
                    {job.distance.toFixed(1)}km
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        job.canAccessNow
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {job.canAccessNow ? "Available" : "Locked"}
                    </span>
                    {!job.canAccessNow && (
                      <div className="text-xs text-yellow-600 mt-1">
                        {formatTimeRemaining(job.accessTime)}
                      </div>
                    )}
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-gray-500">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleViewJob(job)}
                        disabled={!job.canAccessNow || !leadInfo?.canAccess}
                        className="text-blue-600 hover:underline text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        View
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={() => handleCheckAccess(job)}
                        className="text-green-600 hover:underline text-sm"
                      >
                        Check Access
                      </button>
                    </div>
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
      {showJobDetails && selectedJob && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-60 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold z-10"
              onClick={handleCloseJobDetails}
              aria-label="Close"
            >
              &times;
            </button>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {selectedJob.title}
              </h3>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">Description</h4>
                  <p className="text-gray-600">{selectedJob.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Service</h4>
                    <p className="text-gray-600">{selectedJob.service}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Estimate</h4>
                    <p className="text-gray-600">
                      ${selectedJob.estimate.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Timeline</h4>
                    <p className="text-gray-600">{selectedJob.timeline} days</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Distance</h4>
                    <p className="text-gray-600">
                      {selectedJob.distance.toFixed(1)}km
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900">
                    Customer Contact
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-600">
                      Email: {selectedJob.createdBy.email}
                    </p>
                    <p className="text-gray-600">
                      Phone: {selectedJob.createdBy.phone}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900">Property</h4>
                  <p className="text-gray-600">{selectedJob.property.title}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Access Check Modal */}
      <ConfirmModal
        isOpen={accessCheckModal}
        onCancel={handleCloseAccessCheck}
        onConfirm={handleCloseAccessCheck}
        title="Job Access Check"
        message={
          accessCheck ? (
            <div className="space-y-2">
              <p>
                <strong>Can Access:</strong>{" "}
                {accessCheck.canAccess ? "Yes" : "No"}
              </p>
              {accessCheck.accessTime && (
                <p>
                  <strong>Available at:</strong>{" "}
                  {new Date(accessCheck.accessTime).toLocaleString()}
                </p>
              )}
              {accessCheck.leadsUsed !== undefined && (
                <p>
                  <strong>Leads Used:</strong> {accessCheck.leadsUsed}/
                  {accessCheck.leadsLimit}
                </p>
              )}
            </div>
          ) : (
            "Checking access..."
          )
        }
        confirmText="Close"
        cancelText=""
        default={true}
      />
    </div>
  );
};

export default ContractorJobRequestsTable;
