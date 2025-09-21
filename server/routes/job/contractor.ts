import express from "express";
import * as bidController from "@controllers/job";
import { authenticate } from "@middlewares/auth";
import { requireContractor } from "@middlewares/authorization";

const router = express.Router();

// All contractor routes require authentication and contractor role
router.use(authenticate);
router.use(requireContractor);

// Contractor-specific bidding routes
router.post("/bid", bidController.createBid);
router.get("/bids", bidController.getContractorBids);
router.get("/bids/job/:jobRequestId", bidController.getJobBids);

export default router;
