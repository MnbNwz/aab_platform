import { Router } from "express";
import { authenticate } from "@middlewares/auth";
import { requireContractor } from "@middlewares/authorization/rbac";
import {
  getContractorJobs,
  getContractorJobById,
  checkContractorJobAccess,
} from "@controllers/job/contractorJobController";

const router = Router();

// All routes require authentication and contractor authorization
router.use(authenticate);
router.use(requireContractor);

// Get jobs for contractor with membership-based filtering
router.get("/jobs", getContractorJobs);

// Check if contractor can access a specific job (without consuming lead)
router.get("/jobs/:id/access", checkContractorJobAccess);

// Get a specific job for contractor (consumes lead if accessible)
router.get("/jobs/:id", getContractorJobById);

export default router;
