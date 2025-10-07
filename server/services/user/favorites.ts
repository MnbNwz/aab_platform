import { User } from "@models/user";
import { Types } from "mongoose";

// Add contractor to user's favorites (optimized with atomic operations)
export const addFavoriteContractor = async (userId: string, contractorId: string) => {
  // Verify contractor exists and is a contractor (single query with lean)
  const contractor = await User.findById(contractorId).select("role").lean();
  if (!contractor) {
    throw new Error("Contractor not found");
  }

  if (contractor.role !== "contractor") {
    throw new Error("User is not a contractor");
  }

  // Get current user to check role and favorites count
  const user = await User.findById(userId).select("role favoriteContractors").lean();
  if (!user) {
    throw new Error("User not found");
  }

  // Verify user is a customer
  if (user.role !== "customer") {
    throw new Error("Only customers can add favorite contractors");
  }

  // Check if already favorited
  const favorites = user.favoriteContractors || [];
  if (favorites.some((id) => id.toString() === contractorId)) {
    throw new Error("Contractor already in favorites");
  }

  // Check max limit (10)
  if (favorites.length >= 10) {
    const error: any = new Error(
      "Maximum 10 favorite contractors allowed. Please remove one to add another.",
    );
    error.maxReached = true;
    throw error;
  }

  // Atomic operation: Add to favorites using $addToSet (prevents duplicates)
  const updated = await User.findByIdAndUpdate(
    userId,
    { $addToSet: { favoriteContractors: new Types.ObjectId(contractorId) } },
    { new: true, select: "favoriteContractors" },
  );

  if (!updated) {
    throw new Error("Failed to update favorites");
  }

  return {
    favoriteContractors: updated.favoriteContractors || [],
    totalFavorites: (updated.favoriteContractors || []).length,
  };
};

// Remove contractor from user's favorites (optimized with atomic operations)
export const removeFavoriteContractor = async (userId: string, contractorId: string) => {
  // Get current user to verify role and check if contractor is in favorites
  const user = await User.findById(userId).select("role favoriteContractors").lean();
  if (!user) {
    throw new Error("User not found");
  }

  // Verify user is a customer
  if (user.role !== "customer") {
    throw new Error("Only customers can manage favorite contractors");
  }

  // Check if contractor is in favorites
  const favorites = user.favoriteContractors || [];
  if (!favorites.some((id) => id.toString() === contractorId)) {
    throw new Error("Contractor not in favorites");
  }

  // Atomic operation: Remove from favorites using $pull
  const updated = await User.findByIdAndUpdate(
    userId,
    { $pull: { favoriteContractors: new Types.ObjectId(contractorId) } },
    { new: true, select: "favoriteContractors" },
  );

  if (!updated) {
    throw new Error("Failed to update favorites");
  }

  return {
    favoriteContractors: updated.favoriteContractors || [],
    totalFavorites: (updated.favoriteContractors || []).length,
  };
};

// Get user's favorite contractors with full details (sanitized)
export const getFavoriteContractors = async (userId: string) => {
  // Get current user with populated favorites
  const user = await User.findById(userId).populate({
    path: "favoriteContractors",
    select: "firstName lastName email phone geoHome contractor profileImage approval",
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Verify user is a customer
  if (user.role !== "customer") {
    throw new Error("Only customers can view favorite contractors");
  }

  // Sanitize contractor data (remove sensitive fields)
  const sanitizedContractors = (user.favoriteContractors || []).map((contractor: any) => {
    const contractorObj = contractor.toObject ? contractor.toObject() : contractor;
    // Remove sensitive fields
    delete contractorObj.passwordHash;
    delete contractorObj.stripeCustomerId;
    delete contractorObj.stripeConnectAccountId;
    delete contractorObj.stripeConnectStatus;
    delete contractorObj.userVerification;
    delete contractorObj.passwordReset;
    return contractorObj;
  });

  return {
    favoriteContractors: sanitizedContractors,
    totalFavorites: sanitizedContractors.length,
    maxFavorites: 10,
    canAddMore: sanitizedContractors.length < 10,
  };
};
