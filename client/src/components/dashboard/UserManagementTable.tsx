import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { createPortal } from "react-dom";
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
  Mail,
  Phone,
  Calendar,
  User,
  MoreVertical,
  RotateCcw,
} from "lucide-react";
import type { RootState, AppDispatch } from "../../store";
import type { UserFilters } from "../../types";
import {
  fetchUsersThunk,
  approveUserThunk,
  rejectUserThunk,
  revokeUserThunk,
  updateUserThunk,
} from "../../store/thunks/userManagementThunks";
import { setFilters } from "../../store/slices/userManagementSlice";
import Loader from "../ui/Loader";
import ConfirmModal from "../ui/ConfirmModal";

// User Actions Dropdown Modal Component
interface UserActionsDropdownProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onRevoke: () => void;
  onUnrevoke: () => void;
  isUpdating: boolean;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const UserActionsDropdown: React.FC<UserActionsDropdownProps> = ({
  user,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onRevoke,
  onUnrevoke,
  isUpdating,
  triggerRef,
}) => {
  if (!isOpen || !triggerRef.current) return null;

  const canApprove = user.approval === "pending";
  const canReject = user.approval === "pending";
  const canRevoke = user.role !== "admin" && user.status !== "revoke";
  const canUnrevoke = user.role !== "admin" && user.status === "revoke";

  // Calculate position relative to trigger button
  const rect = triggerRef.current.getBoundingClientRect();
  const dropdownStyle = {
    position: "fixed" as const,
    top: rect.bottom + 8,
    left: rect.left - 150, // Offset to the left to avoid going off screen
    zIndex: 999999, // Very high z-index
  };

  const dropdown = (
    <div
      data-dropdown-portal
      className="w-48 bg-white rounded-lg shadow-2xl border border-gray-200 py-2"
      style={dropdownStyle}
      onClick={(e) => e.stopPropagation()}
    >
      {canApprove && (
        <button
          onClick={() => {
            onApprove();
            onClose();
          }}
          disabled={isUpdating}
          className="w-full flex items-center px-4 py-2 text-sm text-green-700 hover:bg-green-50 disabled:opacity-50 transition-colors"
        >
          <UserCheck className="h-4 w-4 mr-3" />
          Approve User
        </button>
      )}
      {canReject && (
        <button
          onClick={() => {
            onReject();
            onClose();
          }}
          disabled={isUpdating}
          className="w-full flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          <UserX className="h-4 w-4 mr-3" />
          Reject User
        </button>
      )}
      {canRevoke && (
        <button
          onClick={() => {
            onRevoke();
            onClose();
          }}
          disabled={isUpdating}
          className="w-full flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          <Trash2 className="h-4 w-4 mr-3" />
          Delete User
        </button>
      )}
      {canUnrevoke && (
        <button
          onClick={() => {
            onUnrevoke();
            onClose();
          }}
          disabled={isUpdating}
          className="w-full flex items-center px-4 py-2 text-sm text-green-700 hover:bg-green-50 disabled:opacity-50 transition-colors"
        >
          <RotateCcw className="h-4 w-4 mr-3" />
          Restore User
        </button>
      )}
      {!canApprove && !canReject && !canRevoke && !canUnrevoke && (
        <div className="px-4 py-2 text-sm text-gray-500">
          No actions available
        </div>
      )}
    </div>
  );

  // Render dropdown as portal to escape any z-index constraints
  return createPortal(dropdown, document.body);
};

const UserManagementTable: React.FC = () => {
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
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    userId: string | null;
    action: null | "approve" | "reject" | "revoke" | "unrevoke";
  }>({ open: false, userId: null, action: null });

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownRefs] = useState<{
    [key: string]: React.RefObject<HTMLButtonElement | null>;
  }>({});

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        openDropdown &&
        !(event.target as Element).closest("[data-dropdown-portal]")
      ) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openDropdown]);

  useEffect(() => {
    dispatch(fetchUsersThunk(filters));
  }, [dispatch, filters]);

  const handleSearch = () => {
    dispatch(setFilters({ ...filters, search: searchTerm, page: 1 }));
  };

  const handleFilterChange = (newFilters: Partial<UserFilters>) => {
    dispatch(setFilters({ ...filters, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    dispatch(setFilters({ ...filters, page }));
  };

  const handleApproveUser = (userId: string) => {
    setConfirmModal({ open: true, userId, action: "approve" });
  };
  const handleRejectUser = (userId: string) => {
    setConfirmModal({ open: true, userId, action: "reject" });
  };
  const handleRevokeUser = (userId: string) => {
    setConfirmModal({ open: true, userId, action: "revoke" });
  };
  const handleUnrevokeUser = (userId: string) => {
    setConfirmModal({ open: true, userId, action: "unrevoke" });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.userId || !confirmModal.action) return;

    try {
      if (confirmModal.action === "approve") {
        await dispatch(approveUserThunk(confirmModal.userId)).unwrap();
      } else if (confirmModal.action === "reject") {
        await dispatch(rejectUserThunk(confirmModal.userId)).unwrap();
      } else if (confirmModal.action === "revoke") {
        await dispatch(revokeUserThunk(confirmModal.userId)).unwrap();
      } else if (confirmModal.action === "unrevoke") {
        await dispatch(
          updateUserThunk({
            userId: confirmModal.userId,
            updateData: { status: "active" },
          })
        ).unwrap();
      }
    } catch (error) {
      console.error(`${confirmModal.action} action failed:`, error);
    }

    setConfirmModal({ open: false, userId: null, action: null });
    setOpenDropdown(null); // Close any open dropdowns
  };

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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800";
      case "contractor":
        return "bg-primary-100 text-primary-800";
      case "customer":
        return "bg-accent-100 text-accent-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return "👑";
      case "contractor":
        return "🔧";
      case "customer":
        return "🏠";
      default:
        return "👤";
    }
  };

  if (usersError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
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
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            User Management
          </h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
            {/* Search */}
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200"
              >
                Search
              </button>
            </div>

            {/* Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={filters.role || ""}
                  onChange={(e) =>
                    handleFilterChange({ role: e.target.value as any })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Users</option>
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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

      {/* Content */}
      {usersLoading ? (
        <div className="p-8 text-center">
          <div className="flex items-center justify-center">
            <Loader size="medium" color="primary" />
            <span className="ml-3 text-primary-600">Loading users...</span>
          </div>
        </div>
      ) : users.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg">No users found</p>
          <p className="text-sm">
            Try adjusting your search or filter criteria
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View - XL and above */}
          <div className="hidden xl:block overflow-x-auto">
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
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
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
                        {getRoleIcon(user.role)} {user.role}
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
                      {updateErrors[user._id] ? (
                        <div className="flex items-center justify-center">
                          <span
                            className="text-red-500 text-xs"
                            title={updateErrors[user._id]}
                          >
                            Error
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <button
                            ref={(() => {
                              if (!dropdownRefs[user._id]) {
                                dropdownRefs[user._id] =
                                  React.createRef<HTMLButtonElement>();
                              }
                              return dropdownRefs[user._id];
                            })()}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdown(
                                openDropdown === user._id ? null : user._id
                              );
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            title="More actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          <UserActionsDropdown
                            user={user}
                            isOpen={openDropdown === user._id}
                            onClose={() => setOpenDropdown(null)}
                            onApprove={() => handleApproveUser(user._id)}
                            onReject={() => handleRejectUser(user._id)}
                            onRevoke={() => handleRevokeUser(user._id)}
                            onUnrevoke={() => handleUnrevokeUser(user._id)}
                            isUpdating={updatingUsers[user._id]}
                            triggerRef={dropdownRefs[user._id]}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tablet Table View - MD to XL */}
          <div className="hidden md:block xl:hidden overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approval
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 group">
                    <td className="px-4 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-[180px]">
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="text-xs text-gray-500">
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(
                          user.role
                        )}`}
                      >
                        {getRoleIcon(user.role)} {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                          user.status,
                          user.approval
                        )}`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.approval === "pending" && (
                          <Clock className="h-3 w-3 text-yellow-500 mr-1" />
                        )}
                        {user.approval === "approved" && (
                          <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                        )}
                        {user.approval === "rejected" && (
                          <XCircle className="h-3 w-3 text-red-500 mr-1" />
                        )}
                        <span className="text-xs text-gray-900">
                          {user.approval}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      {updateErrors[user._id] ? (
                        <div className="flex items-center justify-center">
                          <span
                            className="text-red-500 text-xs"
                            title={updateErrors[user._id]}
                          >
                            Error
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <button
                            ref={(() => {
                              if (!dropdownRefs[user._id]) {
                                dropdownRefs[user._id] =
                                  React.createRef<HTMLButtonElement>();
                              }
                              return dropdownRefs[user._id];
                            })()}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdown(
                                openDropdown === user._id ? null : user._id
                              );
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            title="More actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          <UserActionsDropdown
                            user={user}
                            isOpen={openDropdown === user._id}
                            onClose={() => setOpenDropdown(null)}
                            onApprove={() => handleApproveUser(user._id)}
                            onReject={() => handleRejectUser(user._id)}
                            onRevoke={() => handleRevokeUser(user._id)}
                            onUnrevoke={() => handleUnrevokeUser(user._id)}
                            isUpdating={updatingUsers[user._id]}
                            triggerRef={dropdownRefs[user._id]}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden">
            <div className="p-4 space-y-4">
              {users.map((user) => (
                <div
                  key={user._id}
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {user.firstName} {user.lastName}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Mail className="h-4 w-4 mr-1" />
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Phone className="h-4 w-4 mr-1" />
                          {user.phone}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(
                          user.role
                        )}`}
                      >
                        {getRoleIcon(user.role)} {user.role}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                          user.status,
                          user.approval
                        )}`}
                      >
                        {user.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
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
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      {user.approval === "pending" && (
                        <>
                          <button
                            onClick={() => handleApproveUser(user._id)}
                            disabled={updatingUsers[user._id]}
                            className="flex items-center space-x-1 px-3 py-1.5 text-green-600 hover:text-green-900 disabled:opacity-50 transition-colors duration-200"
                            title="Approve user"
                          >
                            <UserCheck className="h-4 w-4" />
                            <span className="text-sm">Approve</span>
                          </button>
                          <button
                            onClick={() => handleRejectUser(user._id)}
                            disabled={updatingUsers[user._id]}
                            className="flex items-center space-x-1 px-3 py-1.5 text-red-600 hover:text-red-900 disabled:opacity-50 transition-colors duration-200"
                            title="Reject user"
                          >
                            <UserX className="h-4 w-4" />
                            <span className="text-sm">Reject</span>
                          </button>
                        </>
                      )}
                      {user.role !== "admin" && user.status !== "revoke" && (
                        <button
                          onClick={() => handleRevokeUser(user._id)}
                          disabled={updatingUsers[user._id]}
                          className="flex items-center space-x-1 px-3 py-1.5 text-red-600 hover:text-red-900 disabled:opacity-50 transition-colors duration-200"
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="text-sm">Delete</span>
                        </button>
                      )}
                    </div>
                    <div className="flex items-center">
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Generic Confirm Modal for all actions */}
      <ConfirmModal
        isOpen={confirmModal.open}
        title={
          confirmModal.action === "approve"
            ? "Approve User"
            : confirmModal.action === "reject"
            ? "Reject User"
            : confirmModal.action === "revoke"
            ? "Delete User"
            : confirmModal.action === "unrevoke"
            ? "Restore User"
            : "Confirm Action"
        }
        message={
          confirmModal.action === "approve"
            ? "Are you sure you want to approve this user?"
            : confirmModal.action === "reject"
            ? "Are you sure you want to reject this user?"
            : confirmModal.action === "revoke"
            ? "Are you sure you want to delete this user? This action cannot be undone."
            : confirmModal.action === "unrevoke"
            ? "Are you sure you want to restore this user? This will reactivate their account."
            : "Are you sure you want to perform this action?"
        }
        confirmText={
          confirmModal.action === "approve"
            ? "Yes, Approve"
            : confirmModal.action === "reject"
            ? "Yes, Reject"
            : confirmModal.action === "revoke"
            ? "Yes, Delete"
            : confirmModal.action === "unrevoke"
            ? "Yes, Restore"
            : "Yes"
        }
        cancelText="Cancel"
        onConfirm={handleConfirmAction}
        onCancel={() =>
          setConfirmModal({ open: false, userId: null, action: null })
        }
        loading={
          confirmModal.userId ? updatingUsers[confirmModal.userId] : false
        }
      />

      {/* Pagination */}
      {pagination && pagination.totalCount > 0 && (
        <div className="px-4 sm:px-6 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
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
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 py-1 text-sm">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage || usersLoading}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
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
