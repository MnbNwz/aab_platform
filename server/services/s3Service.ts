import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import dotenv from "dotenv";
dotenv.config();

interface S3UploadParams {
  Bucket: string;
  Key: string;
  Body: Buffer | Readable | string;
  ContentType?: string;
}

class S3Service {
  private s3: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET!;
    this.s3 = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  async uploadFile(
    key: string,
    body: Buffer | Readable | string,
    contentType?: string,
  ): Promise<string> {
    const params: S3UploadParams = {
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    };
    await this.s3.send(new PutObjectCommand(params));
    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }

  async deleteFile(key: string): Promise<void> {
    const params = {
      Bucket: this.bucket,
      Key: key,
    };
    await this.s3.send(new DeleteObjectCommand(params));
  }

  // Extract key from S3 URL for deletion
  extractKeyFromUrl(url: string): string {
    const urlParts = url.split("/");
    return urlParts.slice(3).join("/"); // Remove https://bucket.s3.amazonaws.com/
  }

  // Upload profile image with validation
  async uploadProfileImage(
    userId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string },
  ): Promise<string> {
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

    const key = `profile_images/${userId}_${Date.now()}_${file.originalname}`;
    return this.uploadFile(key, file.buffer, file.mimetype);
  }

  // Delete profile image
  async deleteProfileImage(imageUrl: string): Promise<void> {
    const key = this.extractKeyFromUrl(imageUrl);
    await this.deleteFile(key);
  }
}

export default S3Service;
