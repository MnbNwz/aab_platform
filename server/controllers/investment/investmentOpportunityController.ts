import { Response } from "express";
import { AuthenticatedRequest } from "@middlewares/types";
import * as investmentService from "@services/investment/investmentOpportunity";
import { Types } from "@models/types";
import { uploadInvestmentPhoto, uploadInvestmentDocument } from "@utils/storage/s3Upload";
import { IInvestmentPhoto, IInvestmentDocument } from "@models/types/investment";
export const createInvestmentOpportunity = async (
  req: AuthenticatedRequest & { files?: any },
  res: Response,
) => {
  try {
    const adminId = new Types.ObjectId(req.user!._id);

    // Parse the form data
    const data = { ...req.body };

    // Parse JSON fields that were stringified in FormData
    if (typeof data.location === "string") {
      data.location = JSON.parse(data.location);
    }
    if (typeof data.highlights === "string") {
      data.highlights = JSON.parse(data.highlights);
    }

    // Handle file uploads
    const photoUrls: IInvestmentPhoto[] = [];
    const documentUrls: IInvestmentDocument[] = [];

    if (req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      // Upload photos (images only)
      if (files.photos) {
        for (let i = 0; i < files.photos.length; i++) {
          const file = files.photos[i];
          const url = await uploadInvestmentPhoto({
            buffer: file.buffer,
            mimetype: file.mimetype,
            originalname: file.originalname,
          });

          // Get caption from form data
          const caption = data[`photoCaption_${i}`] || undefined;
          photoUrls.push({ url, caption });
        }
      }

      // Upload documents (PDFs, Word, Excel)
      if (files.documents) {
        for (let i = 0; i < files.documents.length; i++) {
          const file = files.documents[i];
          const url = await uploadInvestmentDocument({
            buffer: file.buffer,
            mimetype: file.mimetype,
            originalname: file.originalname,
          });

          // Get metadata from form data
          const name = data[`documentName_${i}`] || file.originalname;
          const type = data[`documentType_${i}`] || file.mimetype.split("/")[1];
          documentUrls.push({ url, name, type });
        }
      }
    }

    // Add uploaded file URLs to data
    if (photoUrls.length > 0) {
      data.photos = photoUrls;
    }
    if (documentUrls.length > 0) {
      data.documents = documentUrls;
    }

    const opportunity = await investmentService.createInvestmentOpportunity(adminId, data);

    res.status(201).json({
      success: true,
      message: "Investment opportunity created successfully",
      data: opportunity,
    });
  } catch (error: any) {
    console.error("Error creating investment opportunity:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create investment opportunity",
    });
  }
};

export const getAllInvestmentOpportunities = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, ...filters } = req.query as any;
    const userRole = req.user?.role === "admin" ? "admin" : "contractor";
    const userId = req.user?._id ? new Types.ObjectId(req.user._id) : undefined;

    const result = await investmentService.getAllInvestmentOpportunities(
      +page,
      +limit,
      filters,
      userRole,
      userId,
    );

    res.status(200).json({
      success: true,
      data: result.opportunities,
      pagination: {
        total: result.total,
        page: result.page,
        pages: result.pages,
        limit: +limit,
      },
    });
  } catch (error: any) {
    console.error("Error fetching investment opportunities:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch investment opportunities",
    });
  }
};

export const getInvestmentOpportunityById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role === "admin" ? "admin" : "contractor";
    const opportunity = await investmentService.getInvestmentOpportunityById(id, userRole);

    res.status(200).json({
      success: true,
      data: opportunity,
    });
  } catch (error: any) {
    console.error("Error fetching investment opportunity:", error);
    const statusCode = error.message.includes("not found") ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to fetch investment opportunity",
    });
  }
};

export const updateInvestmentOpportunity = async (
  req: AuthenticatedRequest & { files?: any },
  res: Response,
) => {
  try {
    const { id } = req.params;

    // Parse the form data
    const data = { ...req.body };

    // Parse JSON fields that were stringified in FormData
    if (typeof data.location === "string") {
      data.location = JSON.parse(data.location);
    }
    if (typeof data.highlights === "string") {
      data.highlights = JSON.parse(data.highlights);
    }

    // Parse existing photos and documents if they exist
    if (typeof data.existingPhotos === "string") {
      data.existingPhotos = JSON.parse(data.existingPhotos);
    }
    if (typeof data.existingDocuments === "string") {
      data.existingDocuments = JSON.parse(data.existingDocuments);
    }

    // Handle file uploads
    const newPhotoUrls: IInvestmentPhoto[] = [];
    const newDocumentUrls: IInvestmentDocument[] = [];

    if (req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      // Upload new photos
      if (files.photos) {
        for (let i = 0; i < files.photos.length; i++) {
          const file = files.photos[i];
          const url = await uploadInvestmentPhoto({
            buffer: file.buffer,
            mimetype: file.mimetype,
            originalname: file.originalname,
          });

          const caption = data[`photoCaption_${i}`] || undefined;
          newPhotoUrls.push({ url, caption });
        }
      }

      // Upload new documents
      if (files.documents) {
        for (let i = 0; i < files.documents.length; i++) {
          const file = files.documents[i];
          const url = await uploadInvestmentDocument({
            buffer: file.buffer,
            mimetype: file.mimetype,
            originalname: file.originalname,
          });

          const name = data[`documentName_${i}`] || file.originalname;
          const type = data[`documentType_${i}`] || file.mimetype.split("/")[1];
          newDocumentUrls.push({ url, name, type });
        }
      }
    }

    // Combine existing and new files
    const allPhotos = [...(data.existingPhotos || []), ...newPhotoUrls];
    const allDocuments = [...(data.existingDocuments || []), ...newDocumentUrls];

    if (allPhotos.length > 0) {
      data.photos = allPhotos;
    }
    if (allDocuments.length > 0) {
      data.documents = allDocuments;
    }

    // Remove temporary fields
    delete data.existingPhotos;
    delete data.existingDocuments;

    // Handle status change if provided
    let opportunity;
    if (data.status && ["available", "under_offer", "sold"].includes(data.status)) {
      opportunity = await investmentService.changeInvestmentOpportunityStatus(id, data.status);
    } else {
      opportunity = await investmentService.updateInvestmentOpportunity(id, data);
    }

    res.status(200).json({
      success: true,
      message: "Investment opportunity updated successfully",
      data: opportunity,
    });
  } catch (error: any) {
    console.error("Error updating investment opportunity:", error);
    const statusCode = error.message.includes("not found") ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to update investment opportunity",
    });
  }
};

export const updateInterestStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, contractorId } = req.params;
    const { status, contactStatus, adminNotes } = req.body;

    // Validate status if provided
    if (status && !["pending", "accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be one of: pending, accepted, rejected",
      });
    }

    // Validate contactStatus if provided
    if (contactStatus && !["pending", "accepted", "rejected"].includes(contactStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact status. Must be one of: pending, accepted, rejected",
      });
    }

    // At least one status field must be provided
    if (!status && !contactStatus && !adminNotes) {
      return res.status(400).json({
        success: false,
        message: "At least one of status, contactStatus, or adminNotes must be provided",
      });
    }

    const opportunity = await investmentService.updateInterestStatus(
      id,
      new Types.ObjectId(contractorId),
      status,
      contactStatus,
      adminNotes,
    );

    res.status(200).json({
      success: true,
      message: "Interest status updated successfully",
      data: opportunity,
    });
  } catch (error: any) {
    console.error("Error updating interest status:", error);
    const statusCode = error.message.includes("not found") ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to update interest status",
    });
  }
};

export const getInvestmentStatistics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await investmentService.getInvestmentStatistics();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error("Error fetching investment statistics:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch investment statistics",
    });
  }
};

export const expressInterest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { action, message } = req.body;
    const contractorId = new Types.ObjectId(req.user!._id);

    if (!action || !["express", "withdraw"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Must be 'express' or 'withdraw'",
      });
    }

    let opportunity;
    let message_text;

    if (action === "express") {
      opportunity = await investmentService.expressInterest(id, contractorId, message);
      message_text = "Interest expressed successfully";
    } else {
      opportunity = await investmentService.withdrawInterest(id, contractorId);
      message_text = "Interest withdrawn successfully";
    }

    res.status(201).json({
      success: true,
      message: message_text,
      data: opportunity,
    });
  } catch (error: any) {
    console.error("Error managing interest:", error);
    const statusCode =
      error.message.includes("already expressed") || error.message.includes("not found")
        ? 400
        : 404;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to manage interest",
    });
  }
};

export const getMyInterests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contractorId = new Types.ObjectId(req.user!._id);
    const { page = 1, limit = 10, status, contactStatus, sortOrder = "desc" } = req.query as any;

    // Build filters object
    const filters: any = {};
    if (status) {
      filters.status = status;
    }
    if (contactStatus) {
      filters.contactStatus = contactStatus;
    }
    if (sortOrder) {
      filters.sortOrder = sortOrder;
    }

    const result = await investmentService.getContractorInterests(
      contractorId,
      +page,
      +limit,
      filters,
    );

    res.status(200).json({
      success: true,
      data: result.opportunities,
      pagination: {
        total: result.total,
        page: result.page,
        pages: result.pages,
        limit: +limit,
      },
    });
  } catch (error: any) {
    console.error("Error fetching my interests:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch interests",
    });
  }
};
