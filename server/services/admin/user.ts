import { User } from "@models/user";
import { UserRole, UserStatus, ApprovalStatus } from "@models/types/user";

// Interface for user filtering
export interface UserFilters {
  role?: UserRole;
  status?: UserStatus;
  approval?: ApprovalStatus;
  search?: string; // Email or phone search
  startDate?: Date;
  endDate?: Date;
}

// Interface for pagination
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Interface for user update
export interface UserUpdateData {
  status?: UserStatus;
  approval?: ApprovalStatus;
  // Note: subscriptionId and membershipId removed - now handled via Payment/Membership models
}

// Get all users with filtering and pagination
export async function getAllUsers(filters: UserFilters = {}, pagination: PaginationOptions) {
  const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = pagination;
  const skip = (page - 1) * limit;

  // Build query
  const query: any = {};

  // Role filter
  if (filters.role) {
    query.role = filters.role;
  }

  // Status filter
  if (filters.status) {
    query.status = filters.status;
  }

  // Approval filter (now at user level)
  if (filters.approval) {
    query.approval = filters.approval;
  }

  // Search filter (email or phone)
  if (filters.search) {
    query.$or = [
      { email: { $regex: filters.search, $options: "i" } },
      { phone: { $regex: filters.search, $options: "i" } },
    ];
  }

  // Date range filter
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) {
      query.createdAt.$gte = filters.startDate;
    }
    if (filters.endDate) {
      query.createdAt.$lte = filters.endDate;
    }
  }

  // Sort options
  const sortOptions: any = {};
  sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

  // Execute query
  const [users, totalCount] = await Promise.all([
    User.find(query)
      .select("-passwordHash") // Exclude password hash
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query),
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    users,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      hasNextPage,
      hasPrevPage,
      limit,
    },
  };
}

// Get user by ID
export async function getUserById(userId: string) {
  const user = await User.findById(userId).select("-passwordHash").lean();
  if (!user) {
    throw new Error("User not found");
  }
  return user;
}

// Update user status or approval
export async function updateUser(userId: string, updateData: UserUpdateData) {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Update user-level fields
  if (updateData.status) {
    user.status = updateData.status;
  }

  // Update user-level approval (moved from profile level)
  if (updateData.approval) {
    user.approval = updateData.approval;
  }

  // Note: subscriptionId and membershipId are now handled via Payment model
  // These fields have been removed from user profiles

  await user.save();

  // Return user without password hash
  const updatedUser = await User.findById(userId).select("-passwordHash").lean();
  return updatedUser;
}

// Revoke user (change status to revoke)
export async function deleteUser(userId: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Revoke user - set status to revoke
  user.status = "revoke";
  await user.save();

  return { message: "User revoked successfully" };
}

// Get user statistics
export async function getUserStats() {
  const stats = await User.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: {
          $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
        },
        pendingUsers: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
        },
        revokedUsers: {
          $sum: { $cond: [{ $eq: ["$status", "revoke"] }, 1, 0] },
        },
        customers: {
          $sum: { $cond: [{ $eq: ["$role", "customer"] }, 1, 0] },
        },
        contractors: {
          $sum: { $cond: [{ $eq: ["$role", "contractor"] }, 1, 0] },
        },
        admins: {
          $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] },
        },
      },
    },
  ]);

  return (
    stats[0] || {
      totalUsers: 0,
      activeUsers: 0,
      pendingUsers: 0,
      revokedUsers: 0,
      customers: 0,
      contractors: 0,
      admins: 0,
    }
  );
}

// Bulk approve users
export async function bulkApproveUsers(userIds: string[]) {
  const result = await User.updateMany(
    { _id: { $in: userIds } },
    {
      $set: {
        status: "active",
        approval: "approved", // Now at user level
      },
    },
  );

  return {
    message: `${result.modifiedCount} users approved successfully`,
    modifiedCount: result.modifiedCount,
  };
}

// Bulk reject users
export async function bulkRejectUsers(userIds: string[]) {
  const result = await User.updateMany(
    { _id: { $in: userIds } },
    {
      $set: {
        status: "revoke",
        approval: "rejected", // Now at user level
      },
    },
  );

  return {
    message: `${result.modifiedCount} users rejected successfully`,
    modifiedCount: result.modifiedCount,
  };
}
