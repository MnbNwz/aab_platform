import { Router } from "express";
import { authenticate } from "@middlewares/auth";
import * as propertyController from "@controllers/property";
import upload from "@middlewares/multer";

const router = Router();

// Create new property
// Create new property (with up to 15 images)
router.post("/", authenticate, upload.array("images", 15), propertyController.createProperty);
// Get all properties for user (with pagination/filtering)
router.get("/", authenticate, propertyController.getUserProperties);
// Get single property by id
router.get("/:id", authenticate, propertyController.getPropertyById);
// Update property
// Update property (with up to 15 images)
router.put("/:id", authenticate, upload.array("images", 15), propertyController.updateProperty);

export default router;
