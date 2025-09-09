import { Router } from "express";
import * as authController from "../controllers/auth";
import { authenticate } from "../middlewares/auth";

const router = Router();

// Public routes
router.post("/signup", authController.signupController);
router.post("/signin", authController.signinController);

// Protected routes
router.post("/logout", authenticate, authController.logout);

export default router;
