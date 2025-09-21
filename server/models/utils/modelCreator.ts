import mongoose from "mongoose";
import { Schema, Model, Document } from "@models/types";

/**
 * Centralized Model Creation Service
 *
 * This service provides a consistent way to create Mongoose models
 * across the application. It handles common configurations and
 * provides a unified interface for model creation.
 */

export interface ModelCreatorOptions {
  collection?: string;
  timestamps?: boolean;
  versionKey?: boolean;
  strict?: boolean;
  validateBeforeSave?: boolean;
}

export interface ModelCreatorConfig {
  schema: Schema;
  modelName: string;
  options?: ModelCreatorOptions;
}

/**
 * Create a Mongoose model with consistent configuration
 *
 * @param config - Configuration object containing schema, modelName, and options
 * @returns Created Mongoose model
 */
export function createModel<T extends Document>(config: ModelCreatorConfig): Model<T> {
  const { schema, modelName, options = {} } = config;

  // Apply default options
  const defaultOptions: ModelCreatorOptions = {
    timestamps: true,
    versionKey: false,
    strict: true,
    validateBeforeSave: true,
    ...options,
  };

  // Apply timestamps if enabled
  if (defaultOptions.timestamps) {
    schema.set("timestamps", true);
  }

  // Apply version key setting
  if (defaultOptions.versionKey === false) {
    schema.set("versionKey", false);
  }

  // Apply strict mode
  schema.set("strict", defaultOptions.strict);

  // Apply validation before save
  if (defaultOptions.validateBeforeSave) {
    schema.set("validateBeforeSave", true);
  }

  // Add common middleware
  addCommonMiddleware(schema);

  // Create and return the model
  return mongoose.model<T>(modelName, schema);
}

/**
 * Add common middleware to all schemas
 *
 * @param schema - Mongoose schema to add middleware to
 */
function addCommonMiddleware(schema: Schema): void {
  // Pre-save middleware for validation
  schema.pre("save", function (next) {
    // Add any common pre-save logic here
    // For example: data sanitization, validation, etc.
    next();
  });

  // Post-save middleware for logging
  schema.post("save", function (doc) {
    // Add any common post-save logic here
    // For example: logging, notifications, etc.
  });

  // Pre-deleteOne middleware (replaces deprecated 'remove')
  schema.pre("deleteOne", function (next) {
    // Add any common pre-delete logic here
    // For example: cascade deletes, cleanup, etc.
    next();
  });
}

/**
 * Create a model with a specific collection name
 *
 * @param config - Configuration object
 * @returns Created Mongoose model
 */
export function createModelWithCollection<T extends Document>(
  config: ModelCreatorConfig & { collectionName: string },
): Model<T> {
  return createModel<T>({
    ...config,
    options: {
      ...config.options,
      collection: config.collectionName,
    },
  });
}

/**
 * Create a model without timestamps
 *
 * @param config - Configuration object
 * @returns Created Mongoose model
 */
export function createModelWithoutTimestamps<T extends Document>(
  config: ModelCreatorConfig,
): Model<T> {
  return createModel<T>({
    ...config,
    options: {
      ...config.options,
      timestamps: false,
    },
  });
}

/**
 * Create a model with version key enabled
 *
 * @param config - Configuration object
 * @returns Created Mongoose model
 */
export function createModelWithVersionKey<T extends Document>(
  config: ModelCreatorConfig,
): Model<T> {
  return createModel<T>({
    ...config,
    options: {
      ...config.options,
      versionKey: true,
    },
  });
}

/**
 * Model creation constants for consistency
 */
export const MODEL_DEFAULTS = {
  TIMESTAMPS: true,
  VERSION_KEY: false,
  STRICT: true,
  VALIDATE_BEFORE_SAVE: true,
} as const;

/**
 * Common schema options
 */
export const SCHEMA_OPTIONS = {
  DEFAULT: {
    timestamps: true,
    versionKey: false,
    strict: true,
  },
  NO_TIMESTAMPS: {
    timestamps: false,
    versionKey: false,
    strict: true,
  },
  WITH_VERSION_KEY: {
    timestamps: true,
    versionKey: true,
    strict: true,
  },
} as const;
