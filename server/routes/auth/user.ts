import { Router } from "express";
import * as userController from "@controllers/auth";
import { authenticate } from "@middlewares/auth";
import { upload } from "@middlewares/storage";
import { USER_ROUTES } from "../constants/routes";

const router = Router();

// Basic CRUD routes (using "/" directly)
router.post("/", userController.createUser);
router.get("/", userController.listUsers);

// Specific routes using constants
router.get(USER_ROUTES.GET_ADMINS, userController.getAdminUsers);
router.put(USER_ROUTES.CHANGE_PASSWORD, authenticate, userController.changePassword);
router.get(USER_ROUTES.GET_BY_ID, userController.getUser);
router.put(USER_ROUTES.UPDATE, upload.single("profileImage"), userController.updateUser);
router.delete(USER_ROUTES.DELETE, userController.deleteUser);

export default router;
