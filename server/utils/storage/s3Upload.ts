import dotenv from "dotenv";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { logErrorWithContext } from "@utils/core/logger";

dotenv.config();

interface S3UploadParams {
  Bucket: string;
  Key: string;
  Body: Buffer | Readable | string;
  ContentType?: string;
}

// S3 Service using functional approach
let s3Client: S3Client | null = null;
let bucket: string | null = null;

// Initialize S3 client (singleton pattern)
const getS3Client = (): S3Client => {
  if (!s3Client) {
    bucket = process.env.AWS_S3_BUCKET!;
    s3Client = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }
  return s3Client;
};

// Upload file to S3
export const uploadFile = async (
  key: string,
  body: Buffer | Readable | string,
  contentType?: string,
): Promise<string> => {
  try {
    const s3 = getS3Client();
    const params: S3UploadParams = {
      Bucket: bucket!,
      Key: key,
      Body: body,
      ContentType: contentType,
    };
    await s3.send(new PutObjectCommand(params));
    return `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  } catch (error) {
    logErrorWithContext(error as Error, {
      operation: "upload_file_to_s3",
      key,
      contentType,
    });
    throw error;
  }
};

// Extract key from S3 URL
export const extractKeyFromUrl = (url: string): string => {
  const urlParts = url.split("/");
  return urlParts.slice(3).join("/"); // Remove https://bucket.s3.amazonaws.com/
};

// Upload profile image with validation
export const uploadProfileImage = async (file: {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}): Promise<string> => {
  try {
    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error("Only JPEG, PNG, and WebP images are allowed");
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.buffer.length > maxSize) {
      throw new Error("Image size must be less than 5MB");
    }

    const key = `profile-images/${Date.now()}-${file.originalname}`;
    return await uploadFile(key, file.buffer, file.mimetype);
  } catch (error) {
    logErrorWithContext(error as Error, {
      operation: "upload_profile_image",
      mimetype: file.mimetype,
      fileSize: file.buffer.length,
    });
    throw error;
  }
};

// Upload investment opportunity photo with validation
export const uploadInvestmentPhoto = async (file: {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}): Promise<string> => {
  try {
    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error("Only JPEG, PNG, and WebP images are allowed for photos");
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.buffer.length > maxSize) {
      throw new Error("Photo size must be less than 5MB");
    }

    const key = `investment-photos/${Date.now()}-${file.originalname}`;
    return await uploadFile(key, file.buffer, file.mimetype);
  } catch (error) {
    logErrorWithContext(error as Error, {
      operation: "upload_investment_photo",
      mimetype: file.mimetype,
      fileSize: file.buffer.length,
    });
    throw error;
  }
};

// Upload investment opportunity document with validation
export const uploadInvestmentDocument = async (file: {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}): Promise<string> => {
  try {
    // Validate file type - allow images, PDFs, and documents
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error("File type not allowed. Allowed: images, PDFs, Word, Excel");
    }

    // Validate file size (10MB max for documents)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.buffer.length > maxSize) {
      throw new Error("Document size must be less than 10MB");
    }

    const key = `investment-documents/${Date.now()}-${file.originalname}`;
    return await uploadFile(key, file.buffer, file.mimetype);
  } catch (error) {
    logErrorWithContext(error as Error, {
      operation: "upload_investment_document",
      mimetype: file.mimetype,
      fileSize: file.buffer.length,
    });
    throw error;
  }
};

// Default export for backward compatibility
export default {
  uploadFile,
  extractKeyFromUrl,
  uploadProfileImage,
  uploadInvestmentPhoto,
  uploadInvestmentDocument,
};
