import { useEffect, useState, useCallback, useMemo, memo, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  User,
  MoreVertical,
  RotateCcw,
} from "lucide-react";
import type { RootState, AppDispatch } from "../../store";
import type { UserFilters } from "../../types";
import {
  fetchUsersThunk,
  fetchUserThunk,
  approveUserThunk,
  rejectUserThunk,
  revokeUserThunk,
  updateUserThunk,
} from "../../store/thunks/userManagementThunks";
import { setFilters } from "../../store/slices/userManagementSlice";
import ConfirmModal from "../ui/ConfirmModal";
import ProfileModal from "../ProfileModal";
import ProfileViewModal from "../ProfileViewModal";
import ActionDropdown, { ActionItem } from "../ui/ActionDropdown";
import FilterPanel from "../ui/FilterPanel";
import {
  FilterConfigs,
  createSelectFieldWithAll,
} from "../ui/FilterPanel.utils";
import { USER_STATUSES, SORT_OPTIONS } from "../../constants";
import DataTable, { TableColumn } from "../ui/DataTable";
import type { PaginationInfo } from "../ui/DataTable";

// User type for table
interface TableUser extends Record<string, unknown> {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  approval: string;
  createdAt: string;
}

// User Actions Dropdown Component using generic ActionDropdown
interface UserActionsDropdownProps {
  user: any;
  onApprove: () => void;
  onReject: () => void;
  onRevoke: () => void;
  onUnrevoke: () => void;
  isUpdating: boolean;
  isLastRow?: boolean;
}

const UserActionsDropdown = memo<UserActionsDropdownProps>(
  ({
    user,
    onApprove,
    onReject,
    onRevoke,
    onUnrevoke,
    isUpdating,
    isLastRow = false,
  }) => {
    const canApprove = user.approval === "pending";
    const canReject = user.approval === "pending";
    const canRevoke = user.role !== "admin" && user.status !== "revoke";
    const canUnrevoke = user.role !== "admin" && user.status === "revoke";

    const actionItems: ActionItem[] = useMemo(
      () => [
        ...(canApprove
          ? [
              {
                id: "approve",
                label: "Approve User",
                icon: <UserCheck />,
                onClick: onApprove,
                disabled: isUpdating,
                variant: "success" as const,
              },
            ]
          : []),
        ...(canReject
          ? [
              {
                id: "reject",
                label: "Reject User",
                icon: <UserX />,
                onClick: onReject,
                disabled: isUpdating,
                variant: "danger" as const,
              },
            ]
          : []),
        ...(canRevoke
          ? [
              {
                id: "revoke",
                label: "Revoke Access",
                icon: <RotateCcw />,
                onClick: onRevoke,
                disabled: isUpdating,
                variant: "warning" as const,
              },
            ]
          : []),
        ...(canUnrevoke
          ? [
              {
                id: "unrevoke",
                label: "Restore Access",
                icon: <CheckCircle />,
                onClick: onUnrevoke,
                disabled: isUpdating,
                variant: "success" as const,
              },
            ]
          : []),
      ],
      [
        canApprove,
        canReject,
        canRevoke,
        canUnrevoke,
        onApprove,
        onReject,
        onRevoke,
        onUnrevoke,
        isUpdating,
      ]
    );

    return (
      <ActionDropdown
        items={actionItems}
        disabled={isUpdating}
        trigger={<MoreVertical className="h-4 w-4" />}
        forceUpward={isLastRow}
      />
    );
  }
);

const UserManagementTable = memo(() => {
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
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    userId: string | null;
    action: null | "approve" | "reject" | "revoke" | "unrevoke";
  }>({ open: false, userId: null, action: null });

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedUserForProfile, setSelectedUserForProfile] =
    useState<any>(null);

  const [profileViewModalOpen, setProfileViewModalOpen] = useState(false);
  const [selectedUserForView, setSelectedUserForView] = useState<any>(null);
  const [loadingUserProfile, setLoadingUserProfile] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    dispatch(fetchUsersThunk(filters));
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
        dispatch(setFilters({ ...filters, search: value, page: 1 }));
      }, 500);
    },
    [dispatch, filters]
  );

  const handleFilterChange = useCallback(
    (newFilters: Partial<UserFilters>) => {
      dispatch(setFilters({ ...filters, ...newFilters, page: 1 }));
    },
    [dispatch, filters]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      dispatch(setFilters({ ...filters, page }));
    },
    [dispatch, filters]
  );

  const handleApproveUser = useCallback((userId: string) => {
    setConfirmModal({ open: true, userId, action: "approve" });
  }, []);

  const handleRejectUser = useCallback((userId: string) => {
    setConfirmModal({ open: true, userId, action: "reject" });
  }, []);

  const handleRevokeUser = useCallback((userId: string) => {
    setConfirmModal({ open: true, userId, action: "revoke" });
  }, []);

  const handleUnrevokeUser = useCallback((userId: string) => {
    setConfirmModal({ open: true, userId, action: "unrevoke" });
  }, []);

  const handleRowClick = useCallback(
    async (user: any) => {
      // Open modal immediately with basic user data
      setSelectedUserForView(user);
      setProfileViewModalOpen(true);

      try {
        setLoadingUserProfile(true);

        // Fetch full user data by ID
        const resultAction = await dispatch(fetchUserThunk(user._id));

        if (fetchUserThunk.fulfilled.match(resultAction)) {
          const fullUserData = resultAction.payload;
          setSelectedUserForView(fullUserData);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoadingUserProfile(false);
      }
    },
    [dispatch]
  );

  const handleSwitchToEdit = useCallback(() => {
    if (selectedUserForView) {
      setProfileViewModalOpen(false);
      setSelectedUserForProfile(selectedUserForView);
      setProfileModalOpen(true);
    }
  }, [selectedUserForView]);

  const handleProfileSave = useCallback(
    async (updated: Partial<any>) => {
      if (!selectedUserForProfile) return;

      try {
        await dispatch(
          updateUserThunk({
            userId: selectedUserForProfile._id,
            updateData: updated,
          })
        ).unwrap();
        setProfileModalOpen(false);
        setSelectedUserForProfile(null);
      } catch (error) {
        console.error("Failed to update user profile:", error);
      }
    },
    [dispatch, selectedUserForProfile]
  );

  const handleProfileClose = useCallback(() => {
    setProfileModalOpen(false);
    setSelectedUserForProfile(null);
  }, []);

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
  };

  const getStatusBadge = useCallback((status: string, approval: string) => {
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
  }, []);

  const getRoleBadge = useCallback((role: string) => {
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
  }, []);

  const getRoleIcon = useCallback((role: string) => {
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
  }, []);

  const confirmModalConfig = useMemo(() => {
    if (!confirmModal.action) return null;

    const configs = {
      approve: {
        title: "Approve User",
        message: "Are you sure you want to approve this user?",
        confirmText: "Yes, Approve",
      },
      reject: {
        title: "Reject User",
        message: "Are you sure you want to reject this user?",
        confirmText: "Yes, Reject",
      },
      revoke: {
        title: "Delete User",
        message:
          "Are you sure you want to delete this user? This action cannot be undone.",
        confirmText: "Yes, Delete",
      },
      unrevoke: {
        title: "Restore User",
        message:
          "Are you sure you want to restore this user? This will reactivate their account.",
        confirmText: "Yes, Restore",
      },
    };

    return configs[confirmModal.action];
  }, [confirmModal.action]);

  // Memoized table columns
  const columns = useMemo<TableColumn<TableUser>[]>(
    () => [
      {
        key: "user",
        header: "User",
        render: (user) => (
          <div>
            <div className="text-sm font-medium text-primary-900">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-sm text-primary-600">{user.email}</div>
            {user.phone && (
              <div className="text-sm text-primary-600">{user.phone}</div>
            )}
          </div>
        ),
        mobileLabel: "User",
        mobileRender: (user) => (
          <div>
            <div className="font-medium text-primary-900">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-sm text-primary-600">{user.email}</div>
            {user.phone && (
              <div className="text-sm text-primary-600">{user.phone}</div>
            )}
          </div>
        ),
      },
      {
        key: "role",
        header: "Role",
        render: (user) => (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(
              user.role
            )}`}
          >
            {getRoleIcon(user.role)} {user.role}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (user) => (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
              user.status,
              user.approval
            )}`}
          >
            {user.status}
          </span>
        ),
      },
      {
        key: "approval",
        header: "Approval",
        render: (user) => (
          <div className="flex items-center">
            {user.approval === "pending" && (
              <Clock className="h-4 w-4 text-accent-500 mr-1" />
            )}
            {user.approval === "approved" && (
              <CheckCircle className="h-4 w-4 text-primary-600 mr-1" />
            )}
            {user.approval === "rejected" && (
              <XCircle className="h-4 w-4 text-accent-600 mr-1" />
            )}
            <span className="text-sm text-primary-900">{user.approval}</span>
          </div>
        ),
      },
      {
        key: "createdAt",
        header: "Created",
        render: (user) => (
          <span className="text-sm text-primary-600">
            {new Date(user.createdAt).toLocaleDateString()}
          </span>
        ),
        hideOnMobile: true,
      },
      {
        key: "actions",
        header: "Actions",
        render: (user, index) => (
          <div
            className="flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {updateErrors[user._id] ? (
              <span
                className="text-accent-600 text-xs"
                title={updateErrors[user._id]}
              >
                Error
              </span>
            ) : (
              <UserActionsDropdown
                user={user}
                onApprove={() => handleApproveUser(user._id)}
                onReject={() => handleRejectUser(user._id)}
                onRevoke={() => handleRevokeUser(user._id)}
                onUnrevoke={() => handleUnrevokeUser(user._id)}
                isUpdating={updatingUsers[user._id]}
                isLastRow={index === users.length - 1}
              />
            )}
          </div>
        ),
        hideOnMobile: true,
      },
    ],
    [
      getRoleBadge,
      getRoleIcon,
      getStatusBadge,
      updateErrors,
      updatingUsers,
      users,
      handleApproveUser,
      handleRejectUser,
      handleRevokeUser,
      handleUnrevokeUser,
    ]
  );

  // Format pagination for DataTable
  const tablePagination = useMemo<PaginationInfo | undefined>(() => {
    if (!pagination) return undefined;
    const paginationAny = pagination as any;
    return {
      currentPage: paginationAny.currentPage || paginationAny.page || 1,
      totalPages: paginationAny.totalPages || paginationAny.pages || 1,
      totalCount:
        paginationAny.totalItems ||
        paginationAny.totalCount ||
        paginationAny.total ||
        0,
      limit: paginationAny.itemsPerPage || paginationAny.limit || 10,
      hasNextPage:
        paginationAny.hasNextPage ??
        (paginationAny.currentPage || paginationAny.page || 1) <
          (paginationAny.totalPages || paginationAny.pages || 1),
      hasPrevPage:
        paginationAny.hasPrevPage ??
        paginationAny.hasPreviousPage ??
        (paginationAny.currentPage || paginationAny.page || 1) > 1,
    };
  }, [pagination]);

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
    <div className="bg-white rounded-lg shadow-sm border border-primary-200">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              User Management
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage and filter system users
            </p>
          </div>
          {/* Search */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <FilterPanel
        mode="inline"
        fields={[
          FilterConfigs.userRole(filters.role || ""),
          createSelectFieldWithAll(
            "status",
            "Status",
            USER_STATUSES,
            filters.status || ""
          ),
          FilterConfigs.userApproval(filters.approval || ""),
          createSelectFieldWithAll(
            "sortBy",
            "Sort By",
            SORT_OPTIONS,
            filters.sortBy || "createdAt"
          ),
        ]}
        values={filters}
        onChange={(newFilters) =>
          handleFilterChange(newFilters as Partial<UserFilters>)
        }
        showFilterIcon={true}
        columns={{ mobile: 1, tablet: 2, desktop: 4 }}
      />

      {/* Content */}
      <DataTable<TableUser>
        data={users as unknown as TableUser[]}
        columns={columns}
        loading={usersLoading}
        error={usersError}
        emptyMessage="No users found"
        emptyIcon={<User className="h-12 w-12 mx-auto mb-4 text-primary-300" />}
        onRowClick={(user) => handleRowClick(user as unknown as any)}
        pagination={tablePagination}
        onPageChange={handlePageChange}
        paginationLabel={({ startItem, endItem, totalCount }) =>
          `Showing ${startItem} to ${endItem} of ${totalCount} users`
        }
        getRowKey={(user) => (user as TableUser)._id}
        hoverable
        striped
      />

      {/* Generic Confirm Modal for all actions */}
      <ConfirmModal
        isOpen={confirmModal.open}
        title={confirmModalConfig?.title || "Confirm Action"}
        message={
          confirmModalConfig?.message ||
          "Are you sure you want to perform this action?"
        }
        confirmText={confirmModalConfig?.confirmText || "Yes"}
        cancelText="Cancel"
        onConfirm={handleConfirmAction}
        onCancel={() =>
          setConfirmModal({ open: false, userId: null, action: null })
        }
        loading={
          confirmModal.userId ? updatingUsers[confirmModal.userId] : false
        }
      />

      {/* Profile Modal */}
      {selectedUserForProfile && (
        <ProfileModal
          isOpen={profileModalOpen}
          onClose={handleProfileClose}
          onSave={handleProfileSave}
          user={selectedUserForProfile}
          showAllFields={true}
        />
      )}

      {/* Profile View Modal */}
      {selectedUserForView && (
        <ProfileViewModal
          user={selectedUserForView}
          isOpen={profileViewModalOpen}
          onClose={() => {
            setProfileViewModalOpen(false);
            setSelectedUserForView(null);
          }}
          onEdit={handleSwitchToEdit}
          isLoading={loadingUserProfile}
          hideEditForAdmin={true}
        />
      )}
    </div>
  );
});

export default UserManagementTable;
