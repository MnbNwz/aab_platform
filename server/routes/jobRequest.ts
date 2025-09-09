import { Router } from "express";
import {
  createJobRequest,
  getJobRequests,
  getJobRequestById,
  updateJobRequest,
  deleteJobRequest,
} from "../controllers/jobRequestController";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.post("/", authenticate, createJobRequest);
router.get("/", authenticate, getJobRequests);
router.get("/:id", authenticate, getJobRequestById);
router.put("/:id", authenticate, updateJobRequest);
router.delete("/:id", authenticate, deleteJobRequest);

export default router;
