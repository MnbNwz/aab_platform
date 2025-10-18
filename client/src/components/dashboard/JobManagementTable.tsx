import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../store";
import type { Job } from "../../store/slices/jobSlice";
import { getJobsThunk } from "../../store/thunks/jobThunks";
import { setJobFilters } from "../../store/slices/jobSlice";
import { getMyPropertiesThunk } from "../../store/thunks/propertyThunks";
import Loader from "../ui/Loader";
import JobCreate from "../JobCreate";
import JobDetailViewModal from "../JobDetailViewModal";
import JobViewEditModal from "../JobViewEditModal";
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
  const [jobDetailViewOpen, setJobDetailViewOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [noPropertyConfirmOpen, setNoPropertyConfirmOpen] = useState(false);
  const [editFromDetailView, setEditFromDetailView] = useState(false);
  const [shouldRefetchBids, setShouldRefetchBids] = useState(true);

  const isAdmin = user?.role === "admin";
  const isCustomer = user?.role === "customer";

  useEffect(() => {
    dispatch(getJobsThunk(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    if (user) {
      dispatch(getMyPropertiesThunk());
    }
  }, [user, dispatch]);

  const handleSearch = useCallback(() => {
    dispatch(setJobFilters({ search: searchTerm, page: 1 }));
  }, [dispatch, searchTerm]);

  const handleFilterChange = useCallback(
    (newFilters: Partial<typeof filters>) => {
      dispatch(setJobFilters({ ...newFilters, page: 1 }));
    },
    [dispatch]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      dispatch(setJobFilters({ page }));
    },
    [dispatch]
  );

  const handleViewJobDetails = useCallback((job: Job) => {
    setSelectedJob(job);
    setShouldRefetchBids(true);
    setJobDetailViewOpen(true);
  }, []);

  const handleCloseJobDetailView = useCallback(() => {
    setJobDetailViewOpen(false);
    setSelectedJob(null);
  }, []);

  const handleEditJobFromDetail = useCallback(() => {
    if (selectedJob) {
      setJobDetailViewOpen(false);
      setEditModalOpen(true);
      setEditFromDetailView(true);
    }
  }, [selectedJob]);

  const handleCloseEditModal = useCallback(
    async (wasSaved?: boolean) => {
      setEditModalOpen(false);

      if (wasSaved) {
        const result = await dispatch(getJobsThunk(filters));

        if (editFromDetailView && selectedJob) {
          if (getJobsThunk.fulfilled.match(result)) {
            const updatedJob = result.payload.jobs?.find(
              (j: Job) => j._id === selectedJob._id
            );

            if (updatedJob) {
              setSelectedJob(updatedJob);
              setShouldRefetchBids(true);
              setJobDetailViewOpen(true);
            }
          }
          setEditFromDetailView(false);
        } else {
          setSelectedJob(null);
        }
      } else {
        if (editFromDetailView && selectedJob) {
          setShouldRefetchBids(false);
          setJobDetailViewOpen(true);
          setEditFromDetailView(false);
        } else {
          setSelectedJob(null);
        }
      }
    },
    [dispatch, filters, editFromDetailView, selectedJob]
  );

  const handleRefreshJobs = useCallback(() => {
    dispatch(getJobsThunk(filters));
  }, [dispatch, filters]);

  const handleCreateJobClick = useCallback(() => {
    const hasActiveProperties = properties.some((p) => p.isActive);

    if (properties.length === 0 || !hasActiveProperties) {
      setNoPropertyConfirmOpen(true);
    } else {
      setShowCreateModal(true);
    }
  }, [properties]);

  const handleNoPropertyConfirm = useCallback(() => {
    setNoPropertyConfirmOpen(false);
  }, []);

  const handleNoPropertyCancel = useCallback(() => {
    setNoPropertyConfirmOpen(false);
  }, []);

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
            {isCustomer && (
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
            {isAdmin && searchTerm.trim() && (
              <button
                className="flex-shrink-0 flex items-center px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition"
                onClick={handleSearch}
                title="Search Jobs"
              >
                Search
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
                onClick={() => handleViewJobDetails(job)}
                className={`bg-white border rounded-lg p-4 shadow-sm transition-shadow w-full cursor-pointer ${
                  job.status === "open"
                    ? "border-gray-200 hover:shadow-md hover:border-primary-300"
                    : "border-gray-300 hover:shadow-sm hover:border-gray-400"
                }`}
              >
                <div className="flex justify-between items-start mb-3 gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm">
                      <span className="block truncate" title={job.title}>
                        {job.title.length > 30
                          ? `${job.title.substring(0, 30)}...`
                          : job.title}
                      </span>
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-accent-600 font-medium">
                        {job.bidCount || 0}{" "}
                        {job.bidCount === 1 ? "Bid" : "Bids"}
                      </span>
                    </div>
                  </div>
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
              <th className="px-3 lg:px-6 py-3 text-center font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                Bids
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {jobsLoading ? (
              <tr>
                <td colSpan={4} className="py-12">
                  <div className="flex justify-center items-center w-full h-full">
                    <Loader size="large" color="accent" />
                  </div>
                </td>
              </tr>
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-gray-500 py-8">
                  No jobs found.
                </td>
              </tr>
            ) : (
              jobs.map((job: Job) => (
                <tr
                  key={job._id}
                  onClick={() => handleViewJobDetails(job)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
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
                  <td className="px-3 lg:px-6 py-4 text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-accent-100 text-accent-800">
                      {job.bidCount || 0}
                    </span>
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

      {/* Job Detail View Modal with Bids Section */}
      {jobDetailViewOpen && selectedJob && (
        <JobDetailViewModal
          isOpen={jobDetailViewOpen}
          onClose={handleCloseJobDetailView}
          job={selectedJob}
          onRefreshJobs={handleRefreshJobs}
          onEditJob={handleEditJobFromDetail}
          shouldRefetch={shouldRefetchBids}
        />
      )}

      {/* Job Edit Modal */}
      {editModalOpen && selectedJob && (
        <JobViewEditModal
          isOpen={editModalOpen}
          onClose={handleCloseEditModal}
          job={selectedJob}
          properties={properties}
        />
      )}

      {/* No Property Confirmation Modal */}
      <ConfirmModal
        isOpen={noPropertyConfirmOpen}
        onCancel={handleNoPropertyCancel}
        onConfirm={handleNoPropertyConfirm}
        title="No Active Property"
        message="You need at least one active property to create a job request."
        default={true}
      />
    </div>
  );
};

export default JobManagementTable;
