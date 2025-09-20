import { Request, Response } from "express";
import { Bid } from "@models/bid";
import { JobRequest } from "@models/jobRequest";
import { authenticate, requireContractor } from "@middlewares/auth";

// Create a new bid
export const createBid = async (req: Request & { user?: any }, res: Response) => {
  try {
    const { jobRequestId, bidAmount, message, timeline, materials, warranty } = req.body;
    const contractorId = req.user?._id;

    if (!contractorId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    // Validate required fields
    if (!jobRequestId || !bidAmount || !message || !timeline) {
      return res.status(400).json({
        success: false,
        message: "Job request ID, bid amount, message, and timeline are required",
      });
    }

    // Validate bid amount
    if (typeof bidAmount !== "number" || bidAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Bid amount must be a positive number",
      });
    }

    // Validate timeline
    if (!timeline.startDate || !timeline.endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    // Check if job request exists and is open
    const jobRequest = await JobRequest.findById(jobRequestId);
    if (!jobRequest) {
      return res.status(404).json({ success: false, message: "Job request not found" });
    }

    if (jobRequest.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "Job request is no longer accepting bids",
      });
    }

    // Check if contractor already bid on this job
    const existingBid = await Bid.findOne({
      jobRequest: jobRequestId,
      contractor: contractorId,
    });

    if (existingBid) {
      return res.status(400).json({
        success: false,
        message: "You have already placed a bid on this job",
      });
    }

    // Create the bid
    const bid = await Bid.create({
      jobRequest: jobRequestId,
      contractor: contractorId,
      bidAmount,
      message,
      timeline,
      materials: materials || { included: false },
      warranty: warranty || { period: undefined, description: undefined },
    });

    // Add bid to job request
    await JobRequest.findByIdAndUpdate(jobRequestId, {
      $push: { bids: bid._id },
    });

    res.status(201).json({ success: true, data: bid });
  } catch (error) {
    console.error("Error creating bid:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get all bids for a job request
export const getJobBids = async (req: Request, res: Response) => {
  try {
    const { jobRequestId } = req.params;

    const bids = await Bid.find({ jobRequest: jobRequestId })
      .populate("contractor", "name email phone")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: bids });
  } catch (error) {
    console.error("Error fetching bids:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Accept a bid
export const acceptBid = async (req: Request & { user?: any }, res: Response) => {
  try {
    const { bidId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    // Find the bid
    const bid = await Bid.findById(bidId).populate("jobRequest");
    if (!bid) {
      return res.status(404).json({ success: false, message: "Bid not found" });
    }

    const jobRequest = bid.jobRequest as any; // Type assertion for populated field

    // Check if user is the job creator
    if (jobRequest.createdBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only the job creator can accept bids",
      });
    }

    // Check if job is still open
    if (jobRequest.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "Job is no longer accepting bids",
      });
    }

    // Update bid status to accepted
    await Bid.findByIdAndUpdate(bidId, { status: "accepted" });

    // Reject all other bids for this job
    await Bid.updateMany(
      {
        jobRequest: jobRequest._id,
        _id: { $ne: bidId },
      },
      { status: "rejected" },
    );

    // Update job request
    await JobRequest.findByIdAndUpdate(jobRequest._id, {
      acceptedBid: bidId,
      status: "inprogress",
      $push: {
        timelineHistory: {
          status: "accepted",
          date: new Date(),
          by: userId,
        },
      },
    });

    res.json({ success: true, message: "Bid accepted successfully" });
  } catch (error) {
    console.error("Error accepting bid:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get contractor's bids
export const getContractorBids = async (req: Request & { user?: any }, res: Response) => {
  try {
    const contractorId = req.user?._id;

    if (!contractorId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const bids = await Bid.find({ contractor: contractorId })
      .populate("jobRequest", "title description status")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: bids });
  } catch (error) {
    console.error("Error fetching contractor bids:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
