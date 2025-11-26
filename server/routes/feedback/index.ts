import { Router } from "express";
import {
  createFeedback,
  getUserFeedback,
  getPendingFeedbackJobs,
} from "@controllers/feedback/feedbackController";
import { requireRole } from "@middlewares/authorization/rbac";

const router = Router();

const customerOrContractor = requireRole(["customer", "contractor"]);
const anyAuthenticated = requireRole(["customer", "contractor", "admin"]);

// 1) Create feedback for a completed job (customer or contractor)
router.post("/", customerOrContractor, createFeedback);

// 2) Get all feedback entries for a specific user (self or any user)
router.get("/user/:userId", anyAuthenticated, getUserFeedback);

// 3) Jobs completed by contractor or created by customer and completed by contractor with no feedback
router.get("/pending", customerOrContractor, getPendingFeedbackJobs);

export default router;
