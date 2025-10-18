import imageCompression from "browser-image-compression";

export interface CompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  useWebWorker: boolean;
  fileType: string;
  quality: number;
}

export interface CompressionResult {
  originalFile: File;
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  wasCompressed: boolean;
}

// Profile image compression settings
export const PROFILE_IMAGE_OPTIONS: CompressionOptions = {
  maxSizeMB: 0.5, // 500KB
  maxWidthOrHeight: 800,
  useWebWorker: true,
  fileType: "image/jpeg",
  quality: 0.85,
};

// Property image compression settings
export const PROPERTY_IMAGE_OPTIONS: CompressionOptions = {
  maxSizeMB: 1.5, // 1.5MB
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: "image/jpeg",
  quality: 0.8,
};

// Smart compression - only compress if beneficial
export const smartCompress = async (
  file: File,
  options: CompressionOptions,
  onProgress?: (progress: number) => void
): Promise<CompressionResult> => {
  const originalSize = file.size;

  // Check if file is already small enough
  if (originalSize < options.maxSizeMB * 1024 * 1024) {
    return {
      originalFile: file,
      compressedFile: file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
      wasCompressed: false,
    };
  }

  try {
    // Compress the image
    const compressedFile = await imageCompression(file, {
      ...options,
      onProgress: onProgress,
    });

    const compressedSize = compressedFile.size;
    const compressionRatio =
      ((originalSize - compressedSize) / originalSize) * 100;

    return {
      originalFile: file,
      compressedFile,
      originalSize,
      compressedSize,
      compressionRatio,
      wasCompressed: true,
    };
  } catch (_error) {
    // Return original file if compression fails
    return {
      originalFile: file,
      compressedFile: file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
      wasCompressed: false,
    };
  }
};

// Compress multiple images with progress tracking
export const compressMultipleImages = async (
  files: File[],
  options: CompressionOptions,
  onProgress?: (completed: number, total: number, currentFile?: string) => void
): Promise<CompressionResult[]> => {
  const results: CompressionResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.(i, files.length, file.name);

    const result = await smartCompress(file, options);
    results.push(result);
  }

  onProgress?.(files.length, files.length);
  return results;
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Get compression summary for UI
export const getCompressionSummary = (
  results: CompressionResult[]
): {
  totalOriginalSize: number;
  totalCompressedSize: number;
  totalSavings: number;
  averageCompressionRatio: number;
  compressedCount: number;
} => {
  const totalOriginalSize = results.reduce(
    (sum, result) => sum + result.originalSize,
    0
  );
  const totalCompressedSize = results.reduce(
    (sum, result) => sum + result.compressedSize,
    0
  );
  const totalSavings = totalOriginalSize - totalCompressedSize;
  const averageCompressionRatio =
    results.length > 0
      ? results.reduce((sum, result) => sum + result.compressionRatio, 0) /
        results.length
      : 0;
  const compressedCount = results.filter(
    (result) => result.wasCompressed
  ).length;

  return {
    totalOriginalSize,
    totalCompressedSize,
    totalSavings,
    averageCompressionRatio,
    compressedCount,
  };
};
