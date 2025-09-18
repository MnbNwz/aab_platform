import { Response } from "express";
import { AuthenticatedRequest } from "@middlewares/types/middleware";
import * as propertyService from "@services/propertyService";
import { Types } from "mongoose";
import S3Upload from "@utils/s3Upload";

// Create new property
export const createProperty = async (
  req: AuthenticatedRequest & { files?: any[] },
  res: Response,
) => {
  try {
    const userId = new Types.ObjectId(req.user!._id);
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
    const userId = new Types.ObjectId(req.user!._id);
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
    const userId = new Types.ObjectId(req.user!._id);
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
    const userId = new Types.ObjectId(req.user!._id);
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
