import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../store";
import {
  fetchJobRequestsThunk,
  setJobFilters,
} from "../../store/slices/jobRequestsSlice";
import { Plus } from "lucide-react";
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
    dispatch(fetchJobRequestsThunk(filters));
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
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Job Management</h2>
        <div className="flex items-center space-x-3">
          {/* Search */}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="pl-3 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Search
            </button>
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
          {/* Create Job Button (admin/customer) */}
          {(isAdmin || isCustomer) && (
            <button
              className="flex items-center px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition"
              onClick={() => setShowCreateModal(true)}
              title={"Create Job"}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create
            </button>
          )}
          {/* Job Create Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-lg shadow-lg px-24 py-8 w-full max-w-2xl relative">
                <button
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                  onClick={() => setShowCreateModal(false)}
                  aria-label="Close"
                >
                  &times;
                </button>
                <JobCreate />
              </div>
            </div>
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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {jobsLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex items-center justify-center">
                    <Loader size="medium" color="primary" />
                    <span className="ml-3 text-primary-600">
                      Loading jobs...
                    </span>
                  </div>
                </td>
              </tr>
            ) : jobs.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No jobs found
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {job.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {job.description?.slice(0, 60)}
                      {job.description?.length > 60 ? "..." : ""}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {job.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {/* TODO: Add actions (view, edit, etc.) */}
                    <button className="text-blue-600 hover:text-blue-900">
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
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
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage || jobsLoading}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              &lt;
            </button>
            <span className="px-3 py-1 text-sm">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage || jobsLoading}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              &gt;
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {jobsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
          <p className="text-red-700">Error loading jobs: {jobsError}</p>
        </div>
      )}
    </div>
  );
};

export default JobManagementTable;
