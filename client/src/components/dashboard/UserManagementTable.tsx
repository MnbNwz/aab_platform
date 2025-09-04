import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { RootState, AppDispatch } from "../../store";
import type { UserFilters } from "../../types";
import {
  fetchUsersThunk,
  approveUserThunk,
  rejectUserThunk,
  revokeUserThunk,
} from "../../store/thunks/userManagementThunks";
import { setFilters } from "../../store/slices/userManagementSlice";
import Loader from "../ui/Loader";

export const UserManagementTable: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    users,
    pagination,
    usersLoading,
    usersError,
    filters,
    updatingUsers,
    updateErrors,
  } = useSelector((state: RootState) => state.userManagement);

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Load users on component mount and when filters change
  useEffect(() => {
    dispatch(fetchUsersThunk(filters));
  }, [dispatch, filters]);

  // Handle search
  const handleSearch = () => {
    dispatch(setFilters({ ...filters, search: searchTerm, page: 1 }));
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<UserFilters>) => {
    dispatch(setFilters({ ...filters, ...newFilters, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    dispatch(setFilters({ ...filters, page }));
  };

  // Handle user actions
  const handleApproveUser = (userId: string) => {
    dispatch(approveUserThunk(userId));
  };

  const handleRejectUser = (userId: string) => {
    dispatch(rejectUserThunk(userId));
  };

  const handleRevokeUser = (userId: string) => {
    if (
      window.confirm(
        "Are you sure you want to revoke this user? This action cannot be undone."
      )
    ) {
      dispatch(revokeUserThunk(userId));
    }
  };

  // Get status badge color
  const getStatusBadge = (status: string, approval: string) => {
    if (status === "revoke") {
      return "bg-red-100 text-red-800";
    }
    if (approval === "pending") {
      return "bg-yellow-100 text-yellow-800";
    }
    if (approval === "approved" && status === "active") {
      return "bg-green-100 text-green-800";
    }
    if (approval === "rejected") {
      return "bg-red-100 text-red-800";
    }
    return "bg-gray-100 text-gray-800";
  };

  // Get role badge color
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800";
      case "contractor":
        return "bg-blue-100 text-blue-800";
      case "customer":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (usersError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Error loading users: {usersError}</p>
        <button
          onClick={() => dispatch(fetchUsersThunk(filters))}
          className="mt-2 text-red-600 hover:text-red-800 font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            User Management
          </h2>
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Search
              </button>
            </div>

            {/* Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={filters.role || ""}
                  onChange={(e) =>
                    handleFilterChange({ role: e.target.value as any })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="customer">Customer</option>
                  <option value="contractor">Contractor</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status || ""}
                  onChange={(e) =>
                    handleFilterChange({ status: e.target.value as any })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="revoke">Revoked</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Approval
                </label>
                <select
                  value={filters.approval || ""}
                  onChange={(e) =>
                    handleFilterChange({ approval: e.target.value as any })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">All Approvals</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <select
                  value={filters.sortBy || "createdAt"}
                  onChange={(e) =>
                    handleFilterChange({ sortBy: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="createdAt">Created Date</option>
                  <option value="updatedAt">Updated Date</option>
                  <option value="email">Email</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Approval
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
            {usersLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex items-center justify-center">
                    <Loader size="medium" color="primary" />
                    <span className="ml-3 text-primary-600">Loading users...</span>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      {user.phone && (
                        <div className="text-sm text-gray-500">
                          {user.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                        user.status,
                        user.approval
                      )}`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {user.approval === "pending" && (
                        <Clock className="h-4 w-4 text-yellow-500 mr-1" />
                      )}
                      {user.approval === "approved" && (
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                      )}
                      {user.approval === "rejected" && (
                        <XCircle className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <span className="text-sm text-gray-900">
                        {user.approval}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {user.approval === "pending" && (
                        <>
                          <button
                            onClick={() => handleApproveUser(user._id)}
                            disabled={updatingUsers[user._id]}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            title="Approve user"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRejectUser(user._id)}
                            disabled={updatingUsers[user._id]}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="Reject user"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {user.status !== "revoke" && (
                        <button
                          onClick={() => handleRevokeUser(user._id)}
                          disabled={updatingUsers[user._id]}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="Revoke user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      {updatingUsers[user._id] && (
                        <Loader size="small" color="primary" />
                      )}
                      {updateErrors[user._id] && (
                        <span
                          className="text-red-500 text-xs"
                          title={updateErrors[user._id]}
                        >
                          Error
                        </span>
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
      {pagination && (
        <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{" "}
            {Math.min(
              pagination.currentPage * pagination.limit,
              pagination.totalCount
            )}{" "}
            of {pagination.totalCount} users
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage || usersLoading}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 py-1 text-sm">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage || usersLoading}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementTable;
