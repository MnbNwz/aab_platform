import { Router } from "express";
import { authenticate } from "@middlewares/auth";
import * as propertyController from "@controllers/property";
import { upload } from "@middlewares/storage";

const router = Router();

// Create new property (with up to 15 images)
router.post("/", authenticate, upload.array("images", 15), propertyController.createProperty);

// Get all properties for user (with pagination/filtering)
router.get("/", authenticate, propertyController.getUserProperties);

// Get single property by id
router.get("/:id", authenticate, propertyController.getPropertyById);

// Update property (with up to 15 images)
router.put("/:id", authenticate, upload.array("images", 15), propertyController.updateProperty);

// Toggle property status (deactivate/activate) - soft delete
router.patch("/:id/status", authenticate, propertyController.togglePropertyStatus);

export default router;
