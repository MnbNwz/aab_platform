import mongoose from "mongoose";
import { JobRequest } from "@models/job";
import { ContractorServices } from "@models/system";
import { FilterQuery } from "mongoose";
import { validateJobRequestCreation } from "@services/property/typeEnforcement";
import { VALID_SORT_FIELDS, ALLOWED_JOB_UPDATE_FIELDS } from "@services/constants/validation";
import { toObjectId } from "@utils/core";

// Helper function to get available services from database
export const getAvailableServices = async (): Promise<string[]> => {
  try {
    const latestServices = await ContractorServices.findOne()
      .sort({ version: -1 })
      .select("services");
    return latestServices ? latestServices.services : [];
  } catch (error) {
    console.error("Error fetching services:", error);
    return [];
  }
};

// Helper function to validate service against available services
export const validateService = async (service: string): Promise<boolean> => {
  const availableServices = await getAvailableServices();
  return availableServices.includes(service);
};

// Create a new job request
export const createJobRequest = async (jobData: any) => {
  // Validate property type enforcement for customers
  if (jobData.createdBy && jobData.property) {
    const propertyValidation = await validateJobRequestCreation(
      jobData.createdBy,
      jobData.property,
      jobData,
    );

    if (!propertyValidation.isValid) {
      throw new Error(propertyValidation.reason || "Property validation failed");
    }
  }

  // Validate service
  const availableServices = await getAvailableServices();
  if (!jobData.service || !availableServices.includes(jobData.service)) {
    throw new Error(`Invalid service. Available services: ${availableServices.join(", ")}`);
  }

  // Validate estimate
  if (!jobData.estimate || typeof jobData.estimate !== "number" || jobData.estimate <= 0) {
    throw new Error("Estimate must be a positive number");
  }

  // Validate title
  if (
    !jobData.title ||
    typeof jobData.title !== "string" ||
    jobData.title.length < 5 ||
    jobData.title.length > 100
  ) {
    throw new Error("Title must be 5-100 characters");
  }

  // Validate description
  if (
    !jobData.description ||
    typeof jobData.description !== "string" ||
    jobData.description.length < 10 ||
    jobData.description.length > 2000
  ) {
    throw new Error("Description must be 10-2000 characters");
  }

  // Validate timeline
  if (!jobData.timeline || typeof jobData.timeline !== "number" || jobData.timeline <= 0) {
    throw new Error("Timeline must be a positive number representing days (e.g., 7, 14, 30)");
  }

  // Validate property
  if (!jobData.property) {
    throw new Error("Property is required");
  }

  return await JobRequest.create(jobData);
};

// Get job requests with filtering and pagination
export const getJobRequests = async (filters: any, user: any) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    service,
    type,
    createdAfter,
    createdBefore,
    estimateMin,
    estimateMax,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = filters;

  const query: FilterQuery<any> = {};

  // OPTIMIZATION: Fetch available services once per request
  const availableServices =
    search || service || (user.role === "contractor" && user.contractor?.services)
      ? await getAvailableServices()
      : [];

  // Customer: only their jobs
  if (user.role === "customer") {
    query.createdBy = toObjectId(user._id);
  }

  // Contractor: filter by their services (use database services for validation)
  if (user.role === "contractor" && user.contractor && user.contractor.services) {
    const contractorServices = user.contractor.services as string[];
    const validContractorServices = contractorServices.filter((service) =>
      availableServices.includes(service),
    );
    if (validContractorServices.length > 0) {
      query.service = { $in: validContractorServices };
    } else {
      query.service = { $in: [] };
    }
  }

  // Search functionality - search in title, description, and valid services
  if (search) {
    const searchConditions: any[] = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];

    // Only search in service field if the search term matches a valid service
    const matchingServices = availableServices.filter((s) =>
      s.toLowerCase().includes(search.toLowerCase()),
    );
    if (matchingServices.length > 0) {
      searchConditions.push({ service: { $in: matchingServices } });
    }

    query.$or = searchConditions;
  }

  // Status filtering
  if (status) {
    if (Array.isArray(status)) {
      query.status = { $in: status };
    } else {
      query.status = status;
    }
  }

  // Service filtering - validate against available services
  if (service) {
    if (Array.isArray(service)) {
      // Filter to only include valid services
      const validServices = service.filter((s) => availableServices.includes(s));
      if (validServices.length > 0) {
        query.service = { $in: validServices };
      } else {
        // If no valid services, return empty result
        query.service = { $in: [] };
      }
    } else {
      // Single service - validate it exists
      if (availableServices.includes(service)) {
        query.service = service;
      } else {
        // Invalid service, return empty result
        query.service = { $in: [] };
      }
    }
  }

  // Type filtering
  if (type) {
    if (Array.isArray(type)) {
      query.type = { $in: type };
    } else {
      query.type = type;
    }
  }

  // Date range filtering
  if (createdAfter || createdBefore) {
    query.createdAt = {};
    if (createdAfter) {
      query.createdAt.$gte = new Date(createdAfter);
    }
    if (createdBefore) {
      query.createdAt.$lte = new Date(createdBefore);
    }
  }

  // Estimate range filtering
  if (estimateMin || estimateMax) {
    query.estimate = {};
    if (estimateMin) {
      query.estimate.$gte = Number(estimateMin);
    }
    if (estimateMax) {
      query.estimate.$lte = Number(estimateMax);
    }
  }

  // OPTIMIZATION: Sort options - use single field for better index usage
  const sortOptions: any = {};
  const validSortFields = VALID_SORT_FIELDS;
  const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  // Single field sort for optimal index usage
  sortOptions[sortField] = sortDirection;

  // Calculate pagination
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit))); // Max 100 items per page
  const skip = (pageNum - 1) * limitNum;

  // OPTIMIZATION: Optimized aggregation pipeline
  // Sort and paginate BEFORE expensive lookups
  const pipeline = [
    // 1. Match stage - filter documents (uses indexes)
    { $match: query },

    // 2. Sort stage - sort before lookups (can use indexes)
    { $sort: sortOptions },

    // 3. Facet stage - split into count and data pipelines
    {
      $facet: {
        // Get total count (no lookups needed)
        count: [{ $count: "total" }],

        // Get paginated data with lookups
        data: [
          // Paginate first
          { $skip: skip },
          { $limit: limitNum },

          // Add computed fields early
          {
            $addFields: {
              bidCount: { $size: "$bids" },
            },
          },

          // Remove heavy fields before lookups
          {
            $project: {
              bids: 0,
              acceptedBid: 0,
            },
          },

          // Lookup user info
          {
            $lookup: {
              from: "users",
              localField: "createdBy",
              foreignField: "_id",
              as: "createdBy",
              pipeline: [{ $project: { name: 1, email: 1, phone: 1 } }],
            },
          },

          // Lookup property info
          {
            $lookup: {
              from: "properties",
              localField: "property",
              foreignField: "_id",
              as: "property",
              pipeline: [
                {
                  $project: {
                    title: 1,
                    location: 1,
                    area: 1,
                    areaUnit: 1,
                    totalRooms: 1,
                    bedrooms: 1,
                    bathrooms: 1,
                    kitchens: 1,
                    description: 1,
                  },
                },
              ],
            },
          },

          // Transform arrays to objects
          {
            $addFields: {
              createdBy: { $arrayElemAt: ["$createdBy", 0] },
              property: { $arrayElemAt: ["$property", 0] },
            },
          },
        ],
      },
    },
  ];

  const [result] = await JobRequest.aggregate(pipeline as any);
  const jobs = result.data;
  const total = result.count[0]?.total || 0;

  // Calculate pagination info
  const totalPages = Math.ceil(total / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPrevPage = pageNum > 1;

  return {
    jobs,
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalItems: total,
      itemsPerPage: limitNum,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? pageNum + 1 : null,
      prevPage: hasPrevPage ? pageNum - 1 : null,
    },
    filters: {
      search: search || null,
      status: status || null,
      service: service || null,
      type: type || null,
      createdAfter: createdAfter || null,
      createdBefore: createdBefore || null,
      estimateMin: estimateMin || null,
      estimateMax: estimateMax || null,
      sortBy: sortField,
      sortOrder: sortOrder,
    },
  };
};

// Get job request by ID (optimized with aggregation)
export const getJobRequestById = async (id: string) => {
  const pipeline = [
    { $match: { _id: toObjectId(id) } },

    // Lookup related collections
    {
      $lookup: {
        from: "users",
        localField: "createdBy",
        foreignField: "_id",
        as: "createdBy",
        pipeline: [{ $project: { name: 1, email: 1, phone: 1 } }],
      },
    },
    {
      $lookup: {
        from: "properties",
        localField: "property",
        foreignField: "_id",
        as: "property",
        pipeline: [
          {
            $project: {
              title: 1,
              location: 1,
              area: 1,
              areaUnit: 1,
              totalRooms: 1,
              bedrooms: 1,
              bathrooms: 1,
              kitchens: 1,
              description: 1,
            },
          },
        ],
      },
    },

    // Transform arrays to single objects
    {
      $addFields: {
        createdBy: { $arrayElemAt: ["$createdBy", 0] },
        property: { $arrayElemAt: ["$property", 0] },
      },
    },

    // Remove bid-related fields from contractor view
    {
      $project: {
        bids: 0,
        acceptedBid: 0,
      },
    },
  ];

  const [result] = await JobRequest.aggregate(pipeline as any);
  return result;
};

// Update job request
export const updateJobRequest = async (id: string, updateData: any, user: any) => {
  const job = await JobRequest.findById(id);
  if (!job) {
    throw new Error("Job not found");
  }

  // Check permissions
  if (user.role !== "admin" && String(job.createdBy) !== String(user._id)) {
    throw new Error("Forbidden");
  }

  // Prevent editing if bid has been accepted (unless admin)
  if (user.role !== "admin" && job.acceptedBid) {
    throw new Error(
      "Cannot edit job. A bid has already been accepted for this job. Please contact support if you need to make changes.",
    );
  }

  // Validate service if being updated
  if (updateData.service) {
    const isValidService = await validateService(updateData.service);
    if (!isValidService) {
      const availableServices = await getAvailableServices();
      throw new Error(`Invalid service. Available services: ${availableServices.join(", ")}`);
    }
  }

  // Validate other fields
  if (
    updateData.title &&
    (typeof updateData.title !== "string" ||
      updateData.title.length < 5 ||
      updateData.title.length > 100)
  ) {
    throw new Error("Title must be 5-100 characters");
  }

  if (
    updateData.description &&
    (typeof updateData.description !== "string" ||
      updateData.description.length < 10 ||
      updateData.description.length > 2000)
  ) {
    throw new Error("Description must be 10-2000 characters");
  }

  if (
    updateData.timeline &&
    (typeof updateData.timeline !== "number" || updateData.timeline <= 0)
  ) {
    throw new Error("Timeline must be a positive number representing days (e.g., 7, 14, 30)");
  }

  if (
    updateData.estimate &&
    (typeof updateData.estimate !== "number" || updateData.estimate <= 0)
  ) {
    throw new Error("Estimate must be a positive number");
  }

  // Only allow certain fields to be updated
  const allowedFields = ALLOWED_JOB_UPDATE_FIELDS;
  const filteredUpdate: any = {};

  for (const key of Object.keys(updateData)) {
    if (allowedFields.includes(key)) {
      filteredUpdate[key] = updateData[key];
    }
  }

  return await JobRequest.findByIdAndUpdate(id, filteredUpdate, { new: true });
};

// Cancel job request
export const cancelJobRequest = async (id: string, user: any) => {
  const job = await JobRequest.findById(id);

  if (!job) {
    throw new Error("Job not found");
  }

  // Check permissions - only job creator or admin can cancel
  if (user.role !== "admin" && String(job.createdBy) !== String(user._id)) {
    throw new Error("Only job creator or admin can cancel this job");
  }

  // Check if job can be cancelled
  if (job.status === "completed") {
    throw new Error("Cannot cancel a completed job");
  }

  if (job.status === "cancelled") {
    throw new Error("Job is already cancelled");
  }

  // Update job status to cancelled
  job.status = "cancelled";

  // Note: Timeline is now a string field, so we don't track status changes in timeline
  // Status changes are tracked through the status field itself

  return await job.save();
};
