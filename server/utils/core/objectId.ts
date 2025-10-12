import { Types } from "mongoose";

/**
 * Convert a string ID to MongoDB ObjectId
 * Uses the recommended createFromHexString method to avoid deprecation warnings
 *
 * @param id - String representation of ObjectId (24 character hex string)
 * @returns MongoDB ObjectId
 */
export function toObjectId(id: string | Types.ObjectId): Types.ObjectId {
  // If already an ObjectId, return as is
  if (id instanceof Types.ObjectId) {
    return id;
  }

  // Convert string to ObjectId using the new recommended method
  return Types.ObjectId.createFromHexString(id);
}

/**
 * Convert multiple string IDs to MongoDB ObjectIds
 *
 * @param ids - Array of string IDs
 * @returns Array of MongoDB ObjectIds
 */
export function toObjectIds(ids: string[]): Types.ObjectId[] {
  return ids.map((id) => toObjectId(id));
}
