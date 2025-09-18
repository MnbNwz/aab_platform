import express from "express";
import * as bidController from "@controllers/bidController";
import { authenticate, requireContractor } from "@middlewares/auth";

const router = express.Router();

// All contractor routes require authentication and contractor role
router.use(authenticate);
router.use(requireContractor);

// Contractor-specific bidding routes
router.post("/bid", bidController.createBid);
router.get("/bids", bidController.getContractorBids);
router.get("/bids/job/:jobRequestId", bidController.getJobBids);

export default router;
