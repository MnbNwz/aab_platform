import { Router } from "express";
import * as authController from "@controllers/auth";
import { authenticate } from "@middlewares/auth";
import { upload } from "@middlewares/storage";

const router = Router();

// Public routes
router.post("/signup", upload.array("docs"), authController.signupController);
router.post("/signin", authController.signinController);
router.post("/verify-otp", authController.verifyOTPController);
router.post("/resend-otp", authController.resendOTPController);
router.get("/verification-state", authController.getVerificationStateController);
router.post("/forgot-password", authController.forgotPasswordController);
router.post("/reset-password", authController.resetPasswordController);

// Protected routes
router.get("/profile", authenticate, authController.getProfile);
router.post("/logout", authenticate, authController.logout);

export default router;
