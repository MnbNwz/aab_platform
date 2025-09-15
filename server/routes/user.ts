import { Router } from "express";
import * as userController from "../controllers/user";

const router = Router();

router.post("/", userController.createUser);
router.get("/get-admins", userController.getAdminUsers);
router.get("/:id", userController.getUser);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);
router.get("/", userController.listUsers);

export default router;
