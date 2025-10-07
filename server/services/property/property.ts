import { Property, IProperty } from "@models/property";
import { Types } from "@models/types";
import S3Upload from "@utils/storage";
import { PropertyInput } from "@services/types/property";

export const createProperty = async ({ userId, body, files }: PropertyInput) => {
  const {
    title,
    propertyType,
    location,
    area,
    areaUnit,
    totalRooms,
    bedrooms,
    bathrooms,
    kitchens,
    description,
    isActive,
  } = body;
  let parsedLocation = location;
  if (typeof location === "string") {
    try {
      parsedLocation = JSON.parse(location);
    } catch (e) {
      /* ignore parse error */
    }
  }
  // Handle image uploads (max 15)
  const imageUrls: string[] = [];
  if (files && Array.isArray(files) && files.length > 0) {
    if (files.length > 15) {
      throw new Error("Maximum 15 images allowed");
    }
    const s3 = S3Upload;
    for (const file of files) {
      const key = `property_${userId}_${Date.now()}_${file.originalname}`;
      const url = await s3.uploadFile(key, file.buffer, file.mimetype);
      imageUrls.push(url);
    }
  }
  const data = {
    userId,
    title,
    propertyType,

    location: parsedLocation,
    area: Number(area),
    areaUnit,
    totalRooms: Number(totalRooms),
    bedrooms: Number(bedrooms),
    bathrooms: Number(bathrooms),
    kitchens: Number(kitchens),
    description,
    images: imageUrls,
    isActive: isActive !== undefined ? isActive : true,
  };
  return Property.create(data);
};

export const getUserProperties = async (
  userId: Types.ObjectId,
  page = 1,
  limit = 10,
  filters: any = {},
) => {
  const query: any = { userId };

  // Handle property type filter
  if (filters.propertyType) query.propertyType = filters.propertyType;

  // Handle search filter - search across multiple fields
  if (filters.search) {
    const searchRegex = { $regex: filters.search, $options: "i" };
    query.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { propertyType: searchRegex },
      { areaUnit: searchRegex },
    ];
  }

  // Handle specific title filter (for backward compatibility)
  if (filters.title) query.title = { $regex: filters.title, $options: "i" };

  // Optimized aggregation for properties with job statistics
  const pipeline = [
    { $match: query },

    // Add job statistics for each property
    {
      $lookup: {
        from: "jobrequests",
        localField: "_id",
        foreignField: "property",
        as: "jobStats",
        pipeline: [
          {
            $group: {
              _id: null,
              totalJobs: { $sum: 1 },
              openJobs: { $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] } },
              completedJobs: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
              totalValue: { $sum: "$estimate" },
            },
          },
        ],
      },
    },

    // Transform job stats
    {
      $addFields: {
        jobStats: { $arrayElemAt: ["$jobStats", 0] },
      },
    },

    // Sort
    { $sort: { createdAt: -1 } },

    // Facet for pagination and count
    {
      $facet: {
        properties: [{ $skip: (+page - 1) * +limit }, { $limit: +limit }],
        total: [{ $count: "count" }],
      },
    },
  ];

  const [result] = await Property.aggregate(pipeline as any);
  const properties = result.properties;
  const total = result.total[0]?.count || 0;

  return { properties, total };
};

export const getPropertyById = async (userId: Types.ObjectId, id: string) => {
  return Property.findOne({ _id: id, userId });
};

export const updateProperty = async (
  userId: Types.ObjectId,
  id: string,
  body: any,
  files?: any[],
) => {
  const {
    title,
    propertyType,
    location,
    area,
    areaUnit,
    totalRooms,
    bedrooms,
    bathrooms,
    kitchens,
    description,
    isActive,
  } = body;
  let parsedLocation = location;
  if (typeof location === "string") {
    try {
      parsedLocation = JSON.parse(location);
    } catch (e) {
      /* ignore parse error */
    }
  }
  let images = undefined;
  if (files && Array.isArray(files) && files.length > 0) {
    if (files.length > 15) {
      throw new Error("Maximum 15 images allowed");
    }
    const s3 = S3Upload;
    images = [];
    for (const file of files) {
      const key = `property_images/${userId}_${Date.now()}_${file.originalname}`;
      const url = await s3.uploadFile(key, file.buffer, file.mimetype);
      images.push(url);
    }
  }
  const data: any = {
    ...(title !== undefined && { title }),
    ...(propertyType !== undefined && { propertyType }),
    ...(location !== undefined && { location: parsedLocation }),
    ...(area !== undefined && { area: Number(area) }),
    ...(areaUnit !== undefined && { areaUnit }),
    ...(totalRooms !== undefined && { totalRooms: Number(totalRooms) }),
    ...(bedrooms !== undefined && { bedrooms: Number(bedrooms) }),
    ...(bathrooms !== undefined && { bathrooms: Number(bathrooms) }),
    ...(kitchens !== undefined && { kitchens: Number(kitchens) }),
    ...(description !== undefined && { description }),
    ...(isActive !== undefined && { isActive }),
    ...(images !== undefined && { images }),
  };
  return Property.findOneAndUpdate({ _id: id, userId }, data, { new: true });
};
