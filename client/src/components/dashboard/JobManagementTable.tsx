import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../store";
import {
  fetchJobRequestsThunk,
  setJobFilters,
} from "../../store/slices/jobRequestsSlice";
import Loader from "../ui/Loader";
import JobCreate from "../JobCreate";

const JobManagementTable: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { jobs, pagination, jobsLoading, jobsError, filters } = useSelector(
    (state: RootState) => state.jobRequests
  );
  const user = useSelector((state: RootState) => state.auth.user);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch jobs on mount and when filters change
  useEffect(() => {
    !(jobs.length > 0) && dispatch(fetchJobRequestsThunk(filters));
  }, [dispatch, filters]);

  // Handle search
  const handleSearch = () => {
    dispatch(setJobFilters({ ...filters, search: searchTerm, page: 1 }));
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: any) => {
    dispatch(setJobFilters({ ...filters, ...newFilters, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    dispatch(setJobFilters({ ...filters, page }));
  };

  // Show filters for admin, minimal for customer
  const isAdmin = user?.role === "admin";
  const isCustomer = user?.role === "customer";

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Controls Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          {/* Search & Create Button Combined */}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && searchTerm.trim()) handleSearch();
              }}
              className="pl-3 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {(isAdmin || isCustomer) && (
              <button
                className="flex items-center px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition"
                onClick={() => {
                  if (searchTerm.trim()) {
                    handleSearch();
                  } else {
                    setShowCreateModal(true);
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
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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
                Category
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
      <div className="block lg:hidden">
        {jobsLoading ? (
          <div className="py-12">
            <div className="flex justify-center items-center w-full h-full">
              <Loader size="large" color="accent" />
            </div>
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {jobs.map((job) => (
              <div
                key={job._id}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3 gap-2">
                  <h3 className="font-semibold text-gray-900 text-sm flex-1 min-w-0">
                    <span className="block truncate" title={job.title}>
                      {job.title.length > 30
                        ? `${job.title.substring(0, 30)}...`
                        : job.title}
                    </span>
                  </h3>
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold flex-shrink-0 ${
                      job.status === "pending"
                        ? "bg-accent-100 text-accent-800"
                        : job.status === "active"
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
                  <span className="font-medium">Category:</span>{" "}
                  <span className="truncate block" title={job.category}>
                    {job.category}
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

                <div className="flex gap-2">
                  <button className="flex-1 bg-accent-50 text-accent-600 px-3 py-2 rounded text-sm font-medium hover:bg-accent-100 transition">
                    View Details
                  </button>
                  <button className="flex-1 bg-primary-100 text-primary-600 px-3 py-2 rounded text-sm font-medium hover:bg-primary-200 transition">
                    Edit
                  </button>
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
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase tracking-wider">
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
              jobs.map((job) => (
                <tr key={job._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-gray-900 max-w-xs">
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
                  <td className="px-6 py-4 text-gray-700">{job.category}</td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        job.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : job.status === "active"
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
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button className="text-blue-600 hover:underline text-sm">
                        View
                      </button>
                      <span className="text-gray-300">|</span>
                      <button className="text-gray-600 hover:underline text-sm">
                        Edit
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
      {pagination && (
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-gray-700 order-2 sm:order-1">
              {(() => {
                const currentPage = pagination.currentPage ?? 0;
                const limit = pagination.limit ?? 0;
                const totalCount = pagination.totalCount ?? 0;
                if (totalCount === 0) {
                  return "No data to show";
                }
                const start = (currentPage - 1) * limit + 1;
                const end = Math.min(currentPage * limit, totalCount);
                return `Showing ${start} to ${end} of ${totalCount} jobs`;
              })()}
            </div>
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage || jobsLoading}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm font-medium min-w-[44px]"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from(
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
                )}
              </div>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
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
                <JobCreate />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default JobManagementTable;
