// Storage utility types
export interface S3UploadParams {
  Bucket: string;
  Key: string;
  Body: Buffer | string;
  ContentType?: string;
  ACL?: string;
}

export interface S3UploadResult {
  success: boolean;
  location?: string;
  key?: string;
  error?: string;
}

export interface FileUploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  generateUniqueKey?: boolean;
}
