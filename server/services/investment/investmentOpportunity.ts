import { InvestmentOpportunity } from "@models/investment";
import { IInvestmentOpportunity } from "@models/types/investment";
import { Types } from "@models/types";

/**
 * Admin creates a new investment opportunity
 */
export const createInvestmentOpportunity = async (
  adminId: Types.ObjectId,
  data: Partial<IInvestmentOpportunity>,
) => {
  const opportunity = await InvestmentOpportunity.create({
    ...data,
    createdBy: adminId,
    status: data.status || "available",
    interests: [],
  });

  return opportunity;
};

/**
 * Get all investment opportunities with pagination and filters using aggregation
 * Role-based access:
 * - Admin: sees all opportunities (any status)
 * - Contractor: sees only available opportunities
 * @param page - Page number
 * @param limit - Items per page
 * @param filters - Filter options
 * @param userRole - User role ('admin' | 'contractor')
 */
export const getAllInvestmentOpportunities = async (
  page = 1,
  limit = 10,
  filters: any = {},
  userRole: "admin" | "contractor" = "contractor",
  userId?: Types.ObjectId,
) => {
  const matchStage: any = {};

  // Role-based filtering: contractors can only see available opportunities
  if (userRole === "contractor") {
    matchStage.status = "available";

    // Exclude opportunities where contractor has already expressed interest
    if (userId) {
      matchStage["interests.contractorId"] = { $ne: userId };
    }
  }

  // Status filter (only for admin, as contractors always see available)
  if (filters.status && userRole === "admin") {
    matchStage.status = filters.status;
  }

  // Property type filter
  if (filters.propertyType) {
    matchStage.propertyType = filters.propertyType;
  }

  // Self filter: Only opportunities where this contractor has expressed interest
  if (filters.self === "true" && userId) {
    matchStage["interests.contractorId"] = userId;
  }

  // Price range filter
  if (filters.maxPrice) {
    matchStage.askingPrice = { $lte: Number(filters.maxPrice) };
  }

  // ROI range filter
  if (filters.minROI || filters.maxROI) {
    matchStage.projectedROI = {};
    if (filters.minROI) matchStage.projectedROI.$gte = Number(filters.minROI);
    if (filters.maxROI) matchStage.projectedROI.$lte = Number(filters.maxROI);
  }

  // Renovation needed filter
  if (filters.renovationNeeded !== undefined) {
    matchStage.renovationNeeded =
      filters.renovationNeeded === "true" || filters.renovationNeeded === true;
  }

  // Province filter
  if (filters.province) {
    matchStage["location.province"] = filters.province;
  }

  // Use text search if search query provided
  if (filters.search) {
    matchStage.$text = { $search: filters.search };
  }

  const skip = (+page - 1) * +limit;

  const pipeline: any[] = [
    // Match stage
    { $match: matchStage },

    // Filter interests array if self=true (before counting)
    ...(filters.self === "true" && userId
      ? [
          {
            $addFields: {
              interests: {
                $filter: {
                  input: "$interests",
                  as: "interest",
                  cond: { $eq: ["$$interest.contractorId", userId] },
                },
              },
            },
          },
        ]
      : []),

    // Add interest count (only for admin)
    ...(userRole === "admin"
      ? [
          {
            $addFields: {
              interestCount: { $size: "$interests" },
            },
          },
        ]
      : []),

    // Sort: if self=true, sort by interest expressedAt, otherwise by createdAt
    ...(filters.self === "true"
      ? [
          {
            $addFields: {
              myInterestDate: {
                $arrayElemAt: ["$interests.expressedAt", 0],
              },
            },
          },
          { $sort: { myInterestDate: -1 } },
        ]
      : filters.search
        ? [{ $sort: { score: { $meta: "textScore" }, createdAt: -1 } }]
        : [{ $sort: { createdAt: -1 } }]),

    // Facet for pagination and total count
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $skip: skip },
          { $limit: +limit },
          // Lookup creator
          {
            $lookup: {
              from: "users",
              localField: "createdBy",
              foreignField: "_id",
              as: "createdBy",
              pipeline: [{ $project: { firstName: 1, lastName: 1, email: 1 } }],
            },
          },
          { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },
          // Lookup interest contractors (only for admin)
          ...(userRole === "admin"
            ? [
                {
                  $lookup: {
                    from: "users",
                    localField: "interests.contractorId",
                    foreignField: "_id",
                    as: "interestContractors",
                    pipeline: [
                      {
                        $project: {
                          _id: 1,
                          firstName: 1,
                          lastName: 1,
                          email: 1,
                          phone: 1,
                          profileImage: 1,
                          "contractor.companyName": 1,
                          "contractor.license": 1,
                          "contractor.services": 1,
                        },
                      },
                    ],
                  },
                },
                // Map contractors back to interests
                {
                  $addFields: {
                    interests: {
                      $map: {
                        input: "$interests",
                        as: "interest",
                        in: {
                          $mergeObjects: [
                            "$$interest",
                            {
                              contractorId: {
                                $arrayElemAt: [
                                  {
                                    $filter: {
                                      input: "$interestContractors",
                                      cond: { $eq: ["$$this._id", "$$interest.contractorId"] },
                                    },
                                  },
                                  0,
                                ],
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                },
                { $project: { interestContractors: 0, myInterestDate: 0 } },
              ]
            : [
                // For contractors, remove interests array
                { $project: { interests: 0, interestContractors: 0, myInterestDate: 0 } },
              ]),
        ],
      },
    },
  ];

  const [result] = await InvestmentOpportunity.aggregate(pipeline);

  const total = result.metadata[0]?.total || 0;
  const opportunities = result.data || [];

  return {
    opportunities,
    total,
    page: +page,
    pages: Math.ceil(total / +limit),
  };
};

/**
 * Get single investment opportunity by ID using aggregation
 * Role-based access:
 * - Admin: can view any opportunity
 * - Contractor: can only view available opportunities
 * @param id - Opportunity ID
 * @param userRole - User role ('admin' | 'contractor')
 */
export const getInvestmentOpportunityById = async (
  id: string,
  userRole: "admin" | "contractor" = "contractor",
) => {
  const matchCondition: any = { _id: new Types.ObjectId(id) };

  // Role-based filtering: contractors can only see available opportunities
  if (userRole === "contractor") {
    matchCondition.status = "available";
  }

  const pipeline = [
    { $match: matchCondition },

    // Add computed fields
    {
      $addFields: {
        ...(userRole === "admin" ? { interestCount: { $size: "$interests" } } : {}),
        totalRenovationCost: {
          $cond: {
            if: "$renovationNeeded",
            then: { $ifNull: ["$estimatedRenovationCost", 0] },
            else: 0,
          },
        },
        totalInvestment: {
          $add: [
            "$askingPrice",
            {
              $cond: {
                if: "$renovationNeeded",
                then: { $ifNull: ["$estimatedRenovationCost", 0] },
                else: 0,
              },
            },
          ],
        },
      },
    },

    // Lookup creator
    {
      $lookup: {
        from: "users",
        localField: "createdBy",
        foreignField: "_id",
        as: "createdBy",
        pipeline: [{ $project: { firstName: 1, lastName: 1, email: 1 } }],
      },
    },
    { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },

    // Lookup interest contractors with their details (only for admin)
    ...(userRole === "admin"
      ? [
          {
            $lookup: {
              from: "users",
              localField: "interests.contractorId",
              foreignField: "_id",
              as: "interestContractors",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    firstName: 1,
                    lastName: 1,
                    email: 1,
                    phone: 1,
                    profileImage: 1,
                    "contractor.companyName": 1,
                    "contractor.license": 1,
                    "contractor.services": 1,
                    "contractor.taxId": 1,
                  },
                },
              ],
            },
          },
          // Map contractors back to interests
          {
            $addFields: {
              interests: {
                $map: {
                  input: "$interests",
                  as: "interest",
                  in: {
                    $mergeObjects: [
                      "$$interest",
                      {
                        contractorId: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: "$interestContractors",
                                cond: { $eq: ["$$this._id", "$$interest.contractorId"] },
                              },
                            },
                            0,
                          ],
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
          { $project: { interestContractors: 0 } },
        ]
      : [
          // For contractors, remove interests array
          { $project: { interestContractors: 0, interests: 0 } },
        ]),
  ];

  const [opportunity] = await InvestmentOpportunity.aggregate(pipeline);

  if (!opportunity) {
    throw new Error("Investment opportunity not found");
  }

  return opportunity;
};

/**
 * Update investment opportunity (admin only)
 */
export const updateInvestmentOpportunity = async (
  id: string,
  data: Partial<IInvestmentOpportunity>,
) => {
  const opportunity = await InvestmentOpportunity.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true },
  )
    .populate("createdBy", "firstName lastName email")
    .populate("interests.contractorId", "firstName lastName email phone");

  if (!opportunity) {
    throw new Error("Investment opportunity not found");
  }

  return opportunity;
};

/**
 * Change status of investment opportunity (admin only)
 * Status options: available, under_offer, sold
 */
export const changeInvestmentOpportunityStatus = async (
  id: string,
  status: "available" | "under_offer" | "sold",
) => {
  const opportunity = await InvestmentOpportunity.findByIdAndUpdate(
    id,
    { $set: { status } },
    { new: true },
  )
    .populate("createdBy", "firstName lastName email")
    .populate("interests.contractorId", "firstName lastName email phone");

  if (!opportunity) {
    throw new Error("Investment opportunity not found");
  }

  return opportunity;
};

/**
 * Get investment opportunity statistics using aggregation
 * ADMIN ONLY - Provides comprehensive analytics dashboard
 */
export const getInvestmentStatistics = async () => {
  const pipeline: any[] = [
    {
      $facet: {
        statusBreakdown: [
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
              totalValue: { $sum: "$askingPrice" },
              avgROI: { $avg: "$projectedROI" },
            },
          },
        ],
        propertyTypeBreakdown: [
          {
            $group: {
              _id: "$propertyType",
              count: { $sum: 1 },
              avgPrice: { $avg: "$askingPrice" },
            },
          },
        ],
        overallStats: [
          {
            $group: {
              _id: null,
              totalOpportunities: { $sum: 1 },
              totalValue: { $sum: "$askingPrice" },
              avgPrice: { $avg: "$askingPrice" },
              avgROI: { $avg: "$projectedROI" },
              totalInterests: { $sum: { $size: "$interests" } },
            },
          },
        ],
        recentOpportunities: [
          { $sort: { createdAt: -1 } },
          { $limit: 5 },
          {
            $project: {
              title: 1,
              askingPrice: 1,
              status: 1,
              interestCount: { $size: "$interests" },
              createdAt: 1,
            },
          },
        ],
      },
    },
  ];

  const [stats] = await InvestmentOpportunity.aggregate(pipeline);
  return stats;
};

/**
 * Express interest in an investment opportunity
 * CONTRACTOR ONLY - Contractor expresses interest in an opportunity
 * @param opportunityId - The opportunity ID
 * @param contractorId - The contractor's user ID
 * @param message - Optional message from contractor
 */
export const expressInterest = async (
  opportunityId: string,
  contractorId: Types.ObjectId,
  message?: string,
) => {
  const opportunity = await InvestmentOpportunity.findOne({
    _id: new Types.ObjectId(opportunityId),
    status: "available", // Can only express interest in available opportunities
  });

  if (!opportunity) {
    throw new Error("Investment opportunity not found or not available");
  }

  // Check if contractor already expressed interest
  const alreadyInterested = opportunity.interests.some(
    (interest) => interest.contractorId.toString() === contractorId.toString(),
  );

  if (alreadyInterested) {
    throw new Error("You have already expressed interest in this opportunity");
  }

  // Add interest
  opportunity.interests.push({
    contractorId,
    expressedAt: new Date(),
    message,
    status: "pending",
    contactStatus: "pending",
  } as any);

  await opportunity.save();

  return opportunity;
};

/**
 * Withdraw interest from an investment opportunity
 * CONTRACTOR ONLY - Contractor withdraws their interest
 * @param opportunityId - The opportunity ID
 * @param contractorId - The contractor's user ID
 */
export const withdrawInterest = async (opportunityId: string, contractorId: Types.ObjectId) => {
  const opportunity = await InvestmentOpportunity.findByIdAndUpdate(
    new Types.ObjectId(opportunityId),
    {
      $pull: {
        interests: { contractorId },
      },
    },
    { new: true },
  );

  if (!opportunity) {
    throw new Error("Investment opportunity not found");
  }

  return opportunity;
};

/**
 * Update interest status and/or contact status
 * ADMIN ONLY - Admin updates the status and/or contact status of an interest
 * @param opportunityId - The opportunity ID
 * @param contractorId - The contractor's user ID
 * @param status - New interest status (optional)
 * @param contactStatus - New contact status (optional)
 * @param adminNotes - Optional admin notes
 */
export const updateInterestStatus = async (
  opportunityId: string,
  contractorId: Types.ObjectId,
  status?: "pending" | "accepted" | "rejected",
  contactStatus?: "pending" | "accepted" | "rejected",
  adminNotes?: string,
) => {
  const updateFields: any = {};

  if (status) {
    updateFields["interests.$.status"] = status;
  }
  if (contactStatus) {
    updateFields["interests.$.contactStatus"] = contactStatus;
  }
  if (adminNotes) {
    updateFields["interests.$.adminNotes"] = adminNotes;
  }

  const opportunity = await InvestmentOpportunity.findOneAndUpdate(
    {
      _id: new Types.ObjectId(opportunityId),
      "interests.contractorId": contractorId,
    },
    {
      $set: updateFields,
    },
    { new: true },
  )
    .populate("createdBy", "firstName lastName email")
    .populate("interests.contractorId", "firstName lastName email phone");

  if (!opportunity) {
    throw new Error("Investment opportunity or interest not found");
  }

  return opportunity;
};

/**
 * Get contractor's expressed interests using aggregation
 * CONTRACTOR ONLY - View their own expressed interests
 * @param contractorId - The contractor's user ID
 * @param page - Page number
 * @param limit - Items per page
 * @param filters - Filter options (status, contactStatus, sortOrder)
 */
export const getContractorInterests = async (
  contractorId: Types.ObjectId,
  page = 1,
  limit = 10,
  filters: any = {},
) => {
  const skip = (+page - 1) * +limit;

  // Build match conditions for filters
  const interestMatchConditions: any = {
    "interests.contractorId": contractorId,
  };

  // Add status filter if provided
  if (filters.status) {
    interestMatchConditions["interests.status"] = filters.status;
  }

  // Add contactStatus filter if provided
  if (filters.contactStatus) {
    interestMatchConditions["interests.contactStatus"] = filters.contactStatus;
  }

  // Build sort object - always sort by expressedAt
  const sortOrder = filters.sortOrder === "asc" ? 1 : -1;
  const sortObject: any = { "interests.expressedAt": sortOrder };

  const pipeline: any[] = [
    {
      $match: {
        "interests.contractorId": contractorId,
      },
    },
    { $unwind: "$interests" },
    {
      $match: interestMatchConditions,
    },

    // Add computed fields
    {
      $addFields: {
        totalInvestment: {
          $add: [
            "$askingPrice",
            {
              $cond: {
                if: "$renovationNeeded",
                then: { $ifNull: ["$estimatedRenovationCost", 0] },
                else: 0,
              },
            },
          ],
        },
      },
    },

    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $sort: sortObject },
          { $skip: skip },
          { $limit: +limit },
          {
            $project: {
              opportunityId: "$_id",
              title: 1,
              propertyType: 1,
              location: 1,
              askingPrice: 1,
              projectedROI: 1,
              totalInvestment: 1,
              status: 1,
              photos: { $slice: ["$photos", 1] },
              interest: {
                expressedAt: "$interests.expressedAt",
                message: "$interests.message",
                status: "$interests.status",
                contactStatus: "$interests.contactStatus",
              },
            },
          },
        ],
      },
    },
  ];

  const [result] = await InvestmentOpportunity.aggregate(pipeline);

  const total = result.metadata[0]?.total || 0;
  const opportunities = result.data || [];

  return {
    opportunities,
    total,
    page: +page,
    pages: Math.ceil(total / +limit),
  };
};
