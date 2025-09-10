import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
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
}

export default S3Service;
