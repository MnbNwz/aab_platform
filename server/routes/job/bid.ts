import express from "express";
import * as bidController from "@controllers/job";
import { authenticate } from "@middlewares/auth";
import { requireContractor } from "@middlewares/authorization/rbac";

const router = express.Router();

// General bid routes (accessible by all authenticated users)
router.use(authenticate);

// Create a new bid (contractors only)
router.post("/", requireContractor, bidController.createBid);

// Get contractor's own bids (contractors only)
router.get("/contractor", requireContractor, bidController.getContractorBids);

// Get all bids for a specific job request (anyone can view bids)
router.get("/job/:jobRequestId", bidController.getJobBids);

// Accept a bid (job creator only)
router.put("/:bidId/accept", bidController.acceptBid);

export default router;
