import { Router } from "express";
import * as authController from "../controllers/auth";
import { authenticate } from "../middlewares/auth";
import upload from "../middlewares/multer";

const router = Router();

// Public routes
router.post("/signup", upload.array("docs"), authController.signupController);
router.post("/signin", authController.signinController);

// Protected routes
router.get("/profile", authenticate, authController.getProfile);
router.post("/logout", authenticate, authController.logout);

export default router;
