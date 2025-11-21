import { Request, Response } from "express";
import { ContractorServices, ContractorServicesExtended } from "@models/system";
import { AuthenticatedRequest } from "@middlewares/types";

// Get current services (public)
export const getServices = async (req: Request, res: Response) => {
  try {
    // Get the latest services document
    const latestServices = await ContractorServices.findOne()
      .sort({ version: -1 })
      .select("services version updatedAt");

    // Get extended services
    const extendedServices = await ContractorServicesExtended.find()
      .select("name materialUnit laborUnit comment")
      .sort({ name: 1 });

    if (!latestServices) {
      return res.status(200).json({
        success: true,
        data: {
          services: [],
          version: 0,
          extended: extendedServices,
          message: "No services available yet",
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        services: latestServices.services,
        version: latestServices.version,
        lastUpdated: latestServices.updatedAt,
        extended: extendedServices,
      },
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch services",
    });
  }
};

// Create new services document (protected - admin only)
export const createServices = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, materialUnit, laborUnit, comment } = req.body;
    const userId = req.user?._id;

    // Validate required field
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Service name is required and must be a non-empty string",
      });
    }

    // Validate optional numeric fields
    if (materialUnit !== undefined && (typeof materialUnit !== "number" || materialUnit < 0)) {
      return res.status(400).json({
        success: false,
        error: "Material unit must be a non-negative number",
      });
    }

    if (laborUnit !== undefined && (typeof laborUnit !== "number" || laborUnit < 0)) {
      return res.status(400).json({
        success: false,
        error: "Labor unit must be a non-negative number",
      });
    }

    // Clean service name
    const cleanServiceName = name.trim();
    const normalizedServiceName = cleanServiceName.toLowerCase();

    // Get the latest services document to check if service already exists
    const latestServices = await ContractorServices.findOne()
      .sort({ version: -1 })
      .select("services version");

    // Check if service name already exists in legacy services
    const existingServiceNames =
      latestServices?.services?.map((s: string) => s.toLowerCase()) || [];
    if (existingServiceNames.includes(normalizedServiceName)) {
      return res.status(400).json({
        success: false,
        error: `Service "${cleanServiceName}" already exists`,
      });
    }

    // Check if service name already exists in extended services
    const existingExtendedService = await ContractorServicesExtended.findOne({
      name: { $regex: new RegExp(`^${cleanServiceName}$`, "i") },
    });

    if (existingExtendedService) {
      return res.status(400).json({
        success: false,
        error: `Service "${cleanServiceName}" already exists in extended services`,
      });
    }

    // Add to legacy ContractorServices (string array)
    const newVersion = latestServices ? latestServices.version + 1 : 1;
    const updatedServices = [...(latestServices?.services || []), normalizedServiceName];
    const uniqueServices = [...new Set(updatedServices)];

    // Create/Update legacy services document
    const contractorServices = new ContractorServices({
      services: uniqueServices,
      version: newVersion,
      createdBy: userId,
      updatedBy: userId,
    });

    await contractorServices.save();

    // Add to ContractorServicesExtended (full object)
    const contractorServicesExtended = new ContractorServicesExtended({
      name: cleanServiceName,
      materialUnit: materialUnit !== undefined ? materialUnit : undefined,
      laborUnit: laborUnit !== undefined ? laborUnit : undefined,
      comment: comment ? comment.trim() : undefined,
    });

    await contractorServicesExtended.save();

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: {
        legacy: {
          services: uniqueServices,
          version: newVersion,
          servicesCount: uniqueServices.length,
        },
        extended: {
          id: contractorServicesExtended._id,
          name: contractorServicesExtended.name,
          materialUnit: contractorServicesExtended.materialUnit,
          laborUnit: contractorServicesExtended.laborUnit,
          comment: contractorServicesExtended.comment,
        },
      },
    });
  } catch (error: any) {
    console.error("Error creating service:", error);

    // Handle duplicate key error (unique constraint)
    if (error.code === 11000 || error.message?.includes("duplicate")) {
      return res.status(400).json({
        success: false,
        error: "Service with this name already exists",
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Failed to create service",
    });
  }
};
