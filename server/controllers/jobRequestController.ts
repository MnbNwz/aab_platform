import { Request, Response } from "express";
import JobRequest from "../models/jobRequest";
import { AuthenticatedRequest } from "../middlewares/types";
import S3Service from "../services/s3Service";

const ALLOWED_CATEGORIES = [
  "painting",
  "plumbing",
  "electrical",
  "cleaning",
  "renovation",
  "hvac",
  "other",
];

// Create a new job request (regular or off-market)
export const createJobRequest = async (req: Request & { files?: any[] }, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest & { files?: any[] };
    const userId = authReq.user?._id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    // Parse form fields (multer does not parse nested objects)
    const property = req.body.property;
    const title = req.body.title;
    const description = req.body.description;
    const category = req.body.category;
    const budget = req.body.budget ? Number(req.body.budget) : undefined;
    const type = req.body.type;

    // Validate title/description
    if (!title || typeof title !== "string" || title.length < 5 || title.length > 100) {
      return res.status(400).json({ success: false, message: "Title must be 5-100 characters" });
    }
    if (
      !description ||
      typeof description !== "string" ||
      description.length < 10 ||
      description.length > 2000
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Description must be 10-2000 characters" });
    }
    // Validate category
    if (category && !ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: "Invalid category" });
    }
    // Validate budget
    if (budget !== undefined && (typeof budget !== "number" || budget < 0)) {
      return res.status(400).json({ success: false, message: "Budget must be a positive number" });
    }
    // For regular jobs, property is required
    if (type !== "off_market" && !property) {
      return res
        .status(400)
        .json({ success: false, message: "Property is required for regular jobs" });
    }
    // Only admin can create off_market jobs
    if (type === "off_market" && authReq.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Only admin can create off-market jobs" });
    }

    // Handle image uploads (max 5)
    const imageUrls: string[] = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      if (req.files.length > 5) {
        return res.status(400).json({ success: false, message: "Maximum 5 images allowed" });
      }
      const s3 = new S3Service();
      for (const file of req.files) {
        const key = `job_${userId}_${Date.now()}_${file.originalname}`;
        const url = await s3.uploadFile(key, file.buffer, file.mimetype);
        imageUrls.push(url);
      }
    }

    const job = await JobRequest.create({
      createdBy: userId,
      property: property || undefined,
      title,
      description,
      category,
      budget,
      type: type || "regular",
      images: imageUrls,
    });
    res.json({ success: true, job });
  } catch (error) {
    console.error("Error creating job request:", error);
    res.status(500).json({ success: false, message: "Failed to create job request" });
  }
};

// Get all job requests (admin: all, user: own, contractor: visible)
export const getJobRequests = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;
    const { page = 1, limit = 10, ...filters } = req.query as any;
    const query: any = {};

    // Customer: only their jobs
    if (user.role === "customer") {
      query.createdBy = user._id;
    }

    // Contractor: filter by their services as categories
    if (user.role === "contractor" && user.contractor && user.contractor.services) {
      query.category = { $in: user.contractor.services };
    }

    // Flexible filtering
    if (filters.status) query.status = filters.status;
    if (filters.category) query.category = filters.category;
    if (filters.type) query.type = filters.type;
    if (filters.createdAfter) query.createdAt = { $gte: new Date(filters.createdAfter) };
    if (filters.createdBefore) {
      query.createdAt = query.createdAt || {};
      query.createdAt.$lte = new Date(filters.createdBefore);
    }

    const jobs = await JobRequest.find(query)
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .sort({ createdAt: -1 })
      .populate("createdBy property assignedContractor acceptedBid bids");

    const total = await JobRequest.countDocuments(query);

    res.json({
      success: true,
      jobs,
      total,
      page: +page,
      pages: Math.ceil(total / +limit),
    });
  } catch (error) {
    console.error("Error fetching job requests:", error);
    res.status(500).json({ success: false, message: "Failed to fetch job requests" });
  }
};

// Get a single job request by ID
export const getJobRequestById = async (req: Request, res: Response) => {
  try {
    const job = await JobRequest.findById(req.params.id).populate(
      "createdBy property assignedContractor acceptedBid bids",
    );
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    res.json({ success: true, job });
  } catch (error) {
    console.error("Error fetching job request:", error);
    res.status(500).json({ success: false, message: "Failed to fetch job request" });
  }
};

// Update a job request (only by creator or admin)
export const updateJobRequest = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;
    const job = await JobRequest.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    if (user.role !== "admin" && String(job.createdBy) !== String(user._id)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    // Only allow certain fields to be updated
    const allowedFields = ["title", "description", "category", "budget", "status", "property"];
    for (const key of Object.keys(req.body)) {
      if (!allowedFields.includes(key)) continue;
      // Validate updates
      if (
        key === "title" &&
        (typeof req.body.title !== "string" ||
          req.body.title.length < 5 ||
          req.body.title.length > 100)
      ) {
        return res.status(400).json({ success: false, message: "Title must be 5-100 characters" });
      }
      if (
        key === "description" &&
        (typeof req.body.description !== "string" ||
          req.body.description.length < 10 ||
          req.body.description.length > 2000)
      ) {
        return res
          .status(400)
          .json({ success: false, message: "Description must be 10-2000 characters" });
      }
      if (
        key === "category" &&
        req.body.category &&
        !ALLOWED_CATEGORIES.includes(req.body.category)
      ) {
        return res.status(400).json({ success: false, message: "Invalid category" });
      }
      if (key === "budget" && (typeof req.body.budget !== "number" || req.body.budget < 0)) {
        return res
          .status(400)
          .json({ success: false, message: "Budget must be a positive number" });
      }
      job[key] = req.body[key];
    }
    // Validate status transitions (e.g., only assigned contractor or admin can mark as completed)
    if (req.body.status) {
      if (
        req.body.status === "completed" &&
        user.role !== "admin" &&
        String(job.assignedContractor) !== String(user._id)
      ) {
        return res.status(403).json({
          success: false,
          message: "Only assigned contractor or admin can mark as completed",
        });
      }
    }
    await job.save();
    res.json({ success: true, job });
  } catch (error) {
    console.error("Error updating job request:", error);
    res.status(500).json({ success: false, message: "Failed to update job request" });
  }
};

// Delete a job request (only by creator or admin)
export const deleteJobRequest = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;
    const job = await JobRequest.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    if (user.role !== "admin" && String(job.createdBy) !== String(user._id)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    await job.deleteOne();
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting job request:", error);
    res.status(500).json({ success: false, message: "Failed to delete job request" });
  }
};
