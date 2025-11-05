import { Router } from "express";
import { authenticate } from "@middlewares/auth";
import { requireContractor } from "@middlewares/authorization/rbac";
import {
  getContractorJobs,
  getContractorJobById,
  getContractorSelfJobs,
} from "@controllers/job/contractorJobController";

const router = Router();

router.use(authenticate);
router.use(requireContractor);

router.get("/jobs", getContractorJobs);

router.get("/jobs/self", getContractorSelfJobs);

router.get("/jobs/:id", getContractorJobById);

export default router;
