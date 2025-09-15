import { Router } from "express";
import * as userController from "../controllers/user";
import { authenticate } from "../middlewares/auth";
import upload from "../middlewares/multer";

const router = Router();

router.post("/", userController.createUser);
router.get("/get-admins", userController.getAdminUsers);
router.put("/change-password", authenticate, userController.changePassword);
router.get("/:id", userController.getUser);
router.put("/:id", upload.single("profileImage"), userController.updateUser);
router.delete("/:id", userController.deleteUser);
router.get("/", userController.listUsers);

export default router;
