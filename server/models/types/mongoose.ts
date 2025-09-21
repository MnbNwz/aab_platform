// Centralized Mongoose type imports
// This file provides a single source of truth for all Mongoose-related imports
// across the models folder, ensuring consistency and maintainability

import { Document, Types, Schema, Model } from "mongoose";

// Re-export all commonly used Mongoose types
export { Document, Types, Schema, Model };

// Export commonly used type aliases for convenience
export type ObjectId = Types.ObjectId;
export type DocumentArray<T> = Types.DocumentArray<T>;
export type Subdocument = Types.Subdocument;
export type Array<T> = Types.Array<T>;

// Export commonly used schema types
export type SchemaType = typeof Schema.Types;
