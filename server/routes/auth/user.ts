import { Router } from "express";
import * as userController from "@controllers/auth";
import { authenticate } from "@middlewares/auth";
import { requireAdminOrSelf, requireAdmin } from "@middlewares/authorization";
import { upload } from "@middlewares/storage";
import { USER_ROUTES } from "@routes/constants/routes";

const router = Router();

// Basic CRUD routes (using "/" directly)
router.post("/", userController.createUser); // Public - for user registration
router.get("/", authenticate, userController.listUsers); // Protected - list users

// Specific routes using constants
router.get(USER_ROUTES.GET_ADMINS, userController.getAdminUsers); // Public - to show admin contacts
router.put(USER_ROUTES.CHANGE_PASSWORD, authenticate, userController.changePassword);
router.get(USER_ROUTES.GET_BY_ID, authenticate, requireAdminOrSelf, userController.getUser);
router.put(
  USER_ROUTES.UPDATE,
  authenticate,
  requireAdminOrSelf,
  upload.single("profileImage"),
  userController.updateUser,
);
router.delete(USER_ROUTES.DELETE, authenticate, requireAdmin, userController.deleteUser);

export default router;
