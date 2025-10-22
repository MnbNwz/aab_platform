import { User } from "@models/user";
import { UserFilters, PaginationOptions, UserUpdateData } from "@services/types/admin";

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

  // Execute optimized aggregation pipeline - only essential fields
  const pipeline = [
    { $match: query },

    // Project only essential fields for admin users list (inclusion projection only)
    {
      $project: {
        _id: 1,
        firstName: 1,
        lastName: 1,
        email: 1,
        phone: 1,
        role: 1,
        status: 1,
        approval: 1,
        createdAt: 1,
      },
    },

    // Sort
    { $sort: sortOptions },

    // Facet for pagination and count
    {
      $facet: {
        users: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: "count" }],
      },
    },
  ];

  const [result] = await User.aggregate(pipeline as any);
  const users = result.users;
  const totalCount = result.totalCount[0]?.count || 0;

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

// Update user (admin can update all fields) - Optimized with single atomic operation
export async function updateUser(userId: string, updateData: UserUpdateData) {
  // Prevent updating sensitive fields
  const restrictedFields = ["_id", "passwordHash", "createdAt", "stripeCustomerId", "__v"];
  const safeUpdateData: any = {};

  // Filter out restricted fields
  Object.keys(updateData).forEach((key) => {
    if (!restrictedFields.includes(key)) {
      safeUpdateData[key] = updateData[key];
    }
  });

  // Single atomic operation: find, update, and return in one query
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: safeUpdateData },
    {
      new: true, // Return updated document
      runValidators: true, // Run Mongoose validators
      lean: true, // Return plain JavaScript object
    },
  ).select("-passwordHash");

  if (!updatedUser) {
    throw new Error("User not found");
  }

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
