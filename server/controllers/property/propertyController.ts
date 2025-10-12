import { Response } from "express";
import { AuthenticatedRequest } from "@middlewares/types";
import * as propertyService from "@services/property/property";
import { Types } from "@models/types";
import S3Upload from "@utils/storage";
import { toObjectId } from "@utils/core";

// Create new property
export const createProperty = async (
  req: AuthenticatedRequest & { files?: any[] },
  res: Response,
) => {
  try {
    const userId = toObjectId(req.user!._id);
    const property = await propertyService.createProperty({
      userId,
      body: req.body,
      files: req.files,
    });
    res.status(201).json({ success: true, property });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get all properties for a user (with pagination & filtering)
export const getUserProperties = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = toObjectId(req.user!._id);
    const { page = 1, limit = 10, ...filters } = req.query as any;
    const { properties, total } = await propertyService.getUserProperties(
      userId,
      page,
      limit,
      filters,
    );
    res.json({
      success: true,
      properties,
      total,
      page: +page,
      pages: Math.ceil(total / +limit),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get single property by id (must belong to user)
export const getPropertyById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = toObjectId(req.user!._id);
    const property = await propertyService.getPropertyById(userId, req.params.id);
    if (!property) return res.status(404).json({ success: false, message: "Property not found" });
    res.json({ success: true, property });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update property (must belong to user)
export const updateProperty = async (
  req: AuthenticatedRequest & { files?: any[] },
  res: Response,
) => {
  try {
    const userId = toObjectId(req.user!._id);
    const property = await propertyService.updateProperty(
      userId,
      req.params.id,
      req.body,
      req.files,
    );
    if (!property) return res.status(404).json({ success: false, message: "Property not found" });
    res.json({ success: true, property });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Toggle property status (deactivate/activate)
export const togglePropertyStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = toObjectId(req.user!._id);
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive field is required and must be a boolean",
      });
    }

    const property = await propertyService.togglePropertyStatus(userId, req.params.id, isActive);

    res.json({
      success: true,
      message: `Property ${isActive ? "activated" : "deactivated"} successfully`,
      property,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};
