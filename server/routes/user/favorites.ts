import { Router } from "express";
import { authenticate } from "@middlewares/auth";
import { requireCustomer } from "@middlewares/authorization/rbac";
import {
  addFavoriteContractor,
  removeFavoriteContractor,
  getFavoriteContractors,
} from "@controllers/user/favoriteController";

const router = Router();

// All favorite routes require authentication and customer role
router.use(authenticate);
router.use(requireCustomer);

// Get all favorite contractors with full details
router.get("/", getFavoriteContractors);

// Add contractor to favorites
router.post("/:contractorId", addFavoriteContractor);

// Remove contractor from favorites
router.delete("/:contractorId", removeFavoriteContractor);

export default router;
