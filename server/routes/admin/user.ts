import { Router } from "express";
import { authenticate } from "@middlewares/auth";
import { requireAdmin, requireAdminOrSelf } from "@middlewares/admin";
import {
  getUsersController,
  getUserController,
  updateUserController,
  deleteUserController,
  getUserStatsController,
} from "@controllers/admin/user";

const router = Router();

// All admin routes require authentication
router.use(authenticate);

// Get all users with filtering and pagination (admin only)
router.get("/", requireAdmin, getUsersController);
// Get user statistics (admin only)

router.get("/stats", requireAdmin, getUserStatsController);

// Get user by ID (admin or self)
router.get("/:userId", requireAdminOrSelf, getUserController);

// Update user (admin only)
router.put("/:userId", requireAdmin, updateUserController);

// Revoke user (admin only)
router.delete("/:userId", requireAdmin, deleteUserController);

export default router;
