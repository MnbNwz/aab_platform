import { Request, Response } from "express";
import { ContractorServices } from "@models/service";
import { AuthenticatedRequest } from "@schemas/express";

// Get current services (public)
export const getServices = async (req: Request, res: Response) => {
  try {
    // Get the latest services document
    const latestServices = await ContractorServices.findOne()
      .sort({ version: -1 })
      .select("services version updatedAt");

    if (!latestServices) {
      return res.status(200).json({
        success: true,
        data: {
          services: [],
          version: 0,
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
    const { services } = req.body;
    const userId = req.user?._id;

    if (!services || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Services array is required and must not be empty",
      });
    }

    // Validate service names
    const invalidServices = services.filter(
      (service) => typeof service !== "string" || service.trim().length === 0,
    );

    if (invalidServices.length > 0) {
      return res.status(400).json({
        success: false,
        error: "All services must be non-empty strings",
      });
    }

    // Clean and normalize service names
    const cleanServices = services.map((service) => service.trim().toLowerCase());
    const uniqueServices = [...new Set(cleanServices)];

    // Get the latest version number
    const latestServices = await ContractorServices.findOne()
      .sort({ version: -1 })
      .select("version");

    const newVersion = latestServices ? latestServices.version + 1 : 1;

    // Create new services document
    const contractorServices = new ContractorServices({
      services: uniqueServices,
      version: newVersion,
      createdBy: userId,
      updatedBy: userId,
    });

    await contractorServices.save();

    res.status(201).json({
      success: true,
      message: "Services created successfully",
      data: {
        services: uniqueServices,
        version: newVersion,
        servicesCount: uniqueServices.length,
        id: contractorServices._id,
      },
    });
  } catch (error) {
    console.error("Error creating services:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create services",
    });
  }
};
