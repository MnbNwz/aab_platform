import express from "express";
import * as bidController from "@controllers/bidController";
import { authenticate } from "@middlewares/auth";

const router = express.Router();

// General bid routes (accessible by all authenticated users)
router.use(authenticate);

// Get all bids for a specific job request (anyone can view bids)
router.get("/job/:jobRequestId", bidController.getJobBids);

// Accept a bid (job creator only)
router.put("/:bidId/accept", bidController.acceptBid);

export default router;
