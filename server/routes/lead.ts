import { Router } from "express";
import { authenticate } from "@middlewares/auth";
import { requireContractor } from "@middlewares/rbac";
import {
  getContractorLeads,
  accessJobRequest,
  getLeadUsage,
  checkJobAccess,
} from "@controllers/leadController";

const router = Router();

// All routes require authentication and contractor role
router.use(authenticate);
router.use(requireContractor);

// Get contractor's available leads with filtering and pagination
router.get("/", getContractorLeads);

// Get contractor's lead usage statistics
router.get("/usage", getLeadUsage);

// Check if contractor can access a specific job request
router.get("/check/:jobRequestId", checkJobAccess);

// Access a specific job request (deduct lead credit)
router.post("/access/:jobRequestId", accessJobRequest);

export default router;
