import { Router } from "express";
import {
  createJobRequest,
  getJobRequests,
  getJobRequestById,
  updateJobRequest,
  cancelJobRequest,
} from "@controllers/jobRequestController";
import { authenticate } from "@middlewares/auth";

const router = Router();
router.use(authenticate);

router.post("/", createJobRequest);
router.get("/", getJobRequests);
router.get("/:id", getJobRequestById);
router.put("/:id", updateJobRequest);
router.put("/:id/cancel", cancelJobRequest);

export default router;
