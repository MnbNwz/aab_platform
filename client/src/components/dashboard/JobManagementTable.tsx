import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../store";
import type { Job } from "../../store/slices/jobSlice";
import { getJobsThunk, cancelJobThunk } from "../../store/thunks/jobThunks";
import { setJobFilters } from "../../store/slices/jobSlice";
import { getMyPropertiesThunk } from "../../store/thunks/propertyThunks";
import Loader from "../ui/Loader";
import JobCreate from "../JobCreate";
import JobViewEditModal from "../JobViewEditModal";
import JobDetailsModal from "../JobDetailsModal";
import { showToast } from "../../utils/toast";
import ConfirmModal from "../ui/ConfirmModal";

const JobManagementTable: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    jobs,
    loading: jobsLoading,
    error: jobsError,
    pagination,
    filters,
  } = useSelector((state: RootState) => state.job);
  const { properties } = useSelector((state: RootState) => state.property);
  const user = useSelector((state: RootState) => state.auth.user);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewEditModalOpen, setViewEditModalOpen] = useState(false);
  const [jobDetailsModalOpen, setJobDetailsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [jobToCancel, setJobToCancel] = useState<any>(null);
  const [noPropertyConfirmOpen, setNoPropertyConfirmOpen] = useState(false);
  const [acceptingBid, setAcceptingBid] = useState<string | null>(null);
  const [rejectingBid, setRejectingBid] = useState<string | null>(null);

  // Fetch jobs on mount and when filters change
  useEffect(() => {
    dispatch(getJobsThunk(filters));
  }, [dispatch, filters]);

  // Fetch properties on mount
  useEffect(() => {
    if (user) {
      dispatch(getMyPropertiesThunk());
    }
  }, [user, dispatch]);

  // Handle search
  const handleSearch = () => {
    dispatch(setJobFilters({ search: searchTerm, page: 1 }));
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: any) => {
    dispatch(setJobFilters({ ...newFilters, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    dispatch(setJobFilters({ page }));
  };

  // Handle job view/edit
  const handleViewJob = (job: any) => {
    setSelectedJob(job);
    setViewEditModalOpen(true);
  };

  const handleCloseViewEditModal = () => {
    setViewEditModalOpen(false);
    setSelectedJob(null);
  };

  // Handle job details with bids
  const handleViewJobDetails = (job: any) => {
    setSelectedJob(job);
    setJobDetailsModalOpen(true);
  };

  const handleCloseJobDetailsModal = () => {
    setJobDetailsModalOpen(false);
    setSelectedJob(null);
  };

  // Handle accept bid
  const handleAcceptBid = async (bidId: string) => {
    setAcceptingBid(bidId);
    try {
      // TODO: Implement accept bid API call
      // await dispatch(acceptBidThunk({ jobId: selectedJob._id, bidId }));
      showToast.success("Bid accepted successfully!");

      // Refresh jobs to get updated data
      dispatch(getJobsThunk(filters));

      // Close modal after short delay
      setTimeout(() => {
        setJobDetailsModalOpen(false);
        setSelectedJob(null);
      }, 1000);
    } catch (error) {
      showToast.error("Failed to accept bid");
    } finally {
      setAcceptingBid(null);
    }
  };

  // Handle reject bid
  const handleRejectBid = async (bidId: string) => {
    setRejectingBid(bidId);
    try {
      // TODO: Implement reject bid API call
      // await dispatch(rejectBidThunk({ jobId: selectedJob._id, bidId }));
      showToast.success("Bid rejected successfully!");

      // Refresh jobs to get updated data
      dispatch(getJobsThunk(filters));
    } catch (error) {
      showToast.error("Failed to reject bid");
    } finally {
      setRejectingBid(null);
    }
  };

  // Handle cancel job
  const handleCancelJob = (job: Job, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    setJobToCancel(job);
    setCancelConfirmOpen(true);
  };

  const confirmCancelJob = async () => {
    if (!jobToCancel) return;

    try {
      const result = await dispatch(cancelJobThunk(jobToCancel._id));
      if (cancelJobThunk.fulfilled.match(result)) {
        showToast.success("Job cancelled successfully!");
        setCancelConfirmOpen(false);
        setJobToCancel(null);
      }
    } catch (error) {
      showToast.error("Failed to cancel job");
    }
  };

  const cancelCancelJob = () => {
    setCancelConfirmOpen(false);
    setJobToCancel(null);
  };

  // Handle create job button click
  const handleCreateJobClick = () => {
    // Check if user has any properties
    if (properties.length === 0) {
      setNoPropertyConfirmOpen(true);
    } else {
      setShowCreateModal(true);
    }
  };

  const handleNoPropertyConfirm = () => {
    setNoPropertyConfirmOpen(false);
    // You can redirect to property creation page here if needed
    // For now, just close the modal
  };

  const handleNoPropertyCancel = () => {
    setNoPropertyConfirmOpen(false);
  };

  // Show filters for admin, minimal for customer
  const isAdmin = user?.role === "admin";
  const isCustomer = user?.role === "customer";

  // Check if user can cancel a job
  const canCancelJob = (job: Job) => {
    if (!user) return false;
    if (isAdmin) return true; // Admin can cancel any job
    if (isCustomer && user._id === job.createdBy) return true; // Customer can cancel their own jobs
    return false;
  };

  return (
    <div className="bg-white rounded-lg shadow w-full max-w-full overflow-x-hidden">
      {/* Controls Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search & Create Button Combined */}
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
            {(isAdmin || isCustomer) && (
              <button
                className="flex-shrink-0 flex items-center px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition"
                onClick={() => {
                  if (searchTerm.trim()) {
                    handleSearch();
                  } else {
                    handleCreateJobClick();
                  }
                }}
                title={searchTerm.trim() ? "Search Jobs" : "Create Job"}
              >
                {searchTerm.trim() ? "Search" : "Create"}
              </button>
            )}
          </div>
          {/* Filters Toggle (admin only) */}
          {isAdmin && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex-shrink-0 flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <span>Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Panel (admin only) */}
      {isAdmin && showFilters && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status || ""}
                onChange={(e) => handleFilterChange({ status: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service
              </label>
              <select
                value={filters.category || ""}
                onChange={(e) =>
                  handleFilterChange({ category: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All Categories</option>
                <option value="painting">Painting</option>
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="cleaning">Cleaning</option>
                <option value="renovation">Renovation</option>
                <option value="hvac">HVAC</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={filters.sortBy || "createdAt"}
                onChange={(e) => handleFilterChange({ sortBy: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="createdAt">Created Date</option>
                <option value="updatedAt">Updated Date</option>
                <option value="title">Title</option>
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
            {jobs.map((job: Job) => (
              <div
                key={job._id}
                className={`bg-white border rounded-lg p-4 shadow-sm transition-shadow w-full ${
                  job.status === "open"
                    ? "border-gray-200 hover:shadow-md"
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
                  {job.status !== "open" && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      Read Only
                    </span>
                  )}
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold flex-shrink-0 ${
                      job.status === "open"
                        ? "bg-accent-100 text-accent-800"
                        : job.status === "in_progress"
                        ? "bg-primary-200 text-primary-800"
                        : job.status === "completed"
                        ? "bg-primary-100 text-primary-600"
                        : job.status === "cancelled"
                        ? "bg-primary-200 text-primary-800"
                        : "bg-primary-100 text-primary-600"
                    }`}
                  >
                    {job.status}
                  </span>
                </div>

                <div className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Service:</span>{" "}
                  <span className="truncate block" title={job.service}>
                    {job.service}
                  </span>
                </div>

                <div className="text-sm text-gray-600 mb-3">
                  <span className="font-medium">Description:</span>{" "}
                  <span className="truncate block" title={job.description}>
                    {job.description?.length > 40
                      ? `${job.description.substring(0, 40)}...`
                      : job.description}
                  </span>
                </div>

                <div className="text-sm text-gray-500 mb-3">
                  <span className="font-medium">Created:</span>{" "}
                  {new Date(job.createdAt).toLocaleDateString()}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewJob(job)}
                      className="flex-1 bg-primary-50 text-primary-600 px-3 py-2 rounded text-sm font-medium hover:bg-primary-100 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleViewJobDetails(job)}
                      className="flex-1 bg-accent-50 text-accent-600 px-3 py-2 rounded text-sm font-medium hover:bg-accent-100 transition"
                    >
                      Bids ({job.bids?.length || 0})
                    </button>
                  </div>
                  {job.status === "open" && canCancelJob(job) && (
                    <button
                      onClick={(e) => handleCancelJob(job, e)}
                      className="w-full bg-red-500 text-white px-3 py-2 rounded text-sm font-medium hover:bg-red-600 transition"
                    >
                      Cancel Job
                    </button>
                  )}
                </div>
              </div>
            ))}
            {jobs.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No jobs found.
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
                <td colSpan={5} className="py-12">
                  <div className="flex justify-center items-center w-full h-full">
                    <Loader size="large" color="accent" />
                  </div>
                </td>
              </tr>
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-gray-500 py-8">
                  No jobs found.
                </td>
              </tr>
            ) : (
              jobs.map((job: Job) => (
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
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-gray-700">
                    {job.service}
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        job.status === "open"
                          ? "bg-yellow-100 text-yellow-800"
                          : job.status === "in_progress"
                          ? "bg-blue-100 text-blue-800"
                          : job.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : job.status === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-gray-500">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-center">
                    <div className="flex justify-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleViewJob(job)}
                        className="text-primary-600 hover:underline text-sm font-medium"
                      >
                        Edit
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={() => handleViewJobDetails(job)}
                        className="text-accent-600 hover:underline text-sm font-medium"
                      >
                        Bids ({job.bids?.length || 0})
                      </button>
                      {job.status === "open" && canCancelJob(job) && (
                        <>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={(e) => handleCancelJob(job, e)}
                            className="text-red-600 hover:underline text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalCount > 0 && (
        <div className="px-4 sm:px-3 lg:px-6 py-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-gray-700 order-2 sm:order-1">
              {(() => {
                const currentPage = pagination.currentPage ?? 0;
                const limit = pagination.limit ?? 0;
                const totalCount = pagination.totalCount ?? 0;
                const start = (currentPage - 1) * limit + 1;
                const end = Math.min(currentPage * limit, totalCount);
                return `Showing ${start} to ${end} of ${totalCount} jobs`;
              })()}
            </div>
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={
                  !pagination.hasPrevPage ||
                  jobsLoading ||
                  pagination.totalPages <= 1
                }
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
                      } else if (pagination.currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (
                        pagination.currentPage >=
                        pagination.totalPages - 2
                      ) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg min-w-[40px] ${
                            pagination.currentPage === pageNum
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
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={
                  !pagination.hasNextPage ||
                  jobsLoading ||
                  pagination.totalPages <= 1
                }
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

      {/* Job Create Modal - Rendered as Portal */}
      {showCreateModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-60 p-4"
            style={{
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100vw",
              height: "100vh",
            }}
          >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold z-10"
                onClick={() => setShowCreateModal(false)}
                aria-label="Close"
              >
                &times;
              </button>
              <div className="p-4 sm:p-6 lg:p-8">
                <JobCreate
                  properties={properties}
                  onClose={() => setShowCreateModal(false)}
                />
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Job View/Edit Modal */}
      {viewEditModalOpen && (
        <JobViewEditModal
          isOpen={viewEditModalOpen}
          onClose={handleCloseViewEditModal}
          job={selectedJob}
          properties={properties}
        />
      )}

      {/* Job Details with Bids Modal */}
      {jobDetailsModalOpen && selectedJob && (
        <JobDetailsModal
          isOpen={jobDetailsModalOpen}
          onClose={handleCloseJobDetailsModal}
          job={selectedJob}
          onAcceptBid={handleAcceptBid}
          onRejectBid={handleRejectBid}
          acceptingBid={acceptingBid}
          rejectingBid={rejectingBid}
        />
      )}

      {/* Cancel Job Confirmation Modal */}
      <ConfirmModal
        isOpen={cancelConfirmOpen}
        onCancel={cancelCancelJob}
        onConfirm={confirmCancelJob}
        title="Cancel Job"
        message={`Are you sure you want to cancel the job "${jobToCancel?.title}"? This action cannot be undone.`}
        confirmText="Cancel Job"
        cancelText="Keep Job"
      />

      {/* No Property Confirmation Modal */}
      <ConfirmModal
        isOpen={noPropertyConfirmOpen}
        onCancel={handleNoPropertyCancel}
        onConfirm={handleNoPropertyConfirm}
        title="No Properties Found"
        message="You need to create at least one property before creating a job request. Please create a property first and then try creating a job."
        default={true}
      />
    </div>
  );
};

export default JobManagementTable;
