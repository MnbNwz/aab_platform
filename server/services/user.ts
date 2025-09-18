import { User } from "@models/user";
import { FilterQuery, UpdateQuery } from "mongoose";
import { CreateUserDTO, UpdateUserDTO } from "@models/types/user";
import { hashPassword } from "@utils/auth/password";
import S3Upload from "@utils/s3Upload";

export const createUser = async (userData: CreateUserDTO) => {
  return await User.create(userData);
};

export const getUserById = async (id: string) => {
  return await User.findById(id);
};

// Process profile image - convert base64 to S3 URL if needed
const processProfileImage = async (userId: string, profileImage: string): Promise<string> => {
  if (!profileImage) return profileImage;

  // If it's already an S3 URL, return as is
  if (profileImage.startsWith("https://")) {
    return profileImage;
  }

  // If it's a base64 image, convert to S3 URL
  if (profileImage.startsWith("data:image/")) {
    try {
      const s3 = S3Upload;
      const base64Data = profileImage.split(",")[1];
      const mimeType = profileImage.split(";")[0].split(":")[1];

      // Convert base64 to buffer
      const imageBuffer = Buffer.from(base64Data, "base64");

      // Create a temporary file object for S3 upload
      const fileObject = {
        buffer: imageBuffer,
        mimetype: mimeType,
        originalname: `profile_${userId}.${mimeType.split("/")[1]}`,
      };

      // Upload to S3
      const s3Url = await s3.uploadProfileImage(fileObject);
      console.log(`✅ Converted base64 image to S3 URL: ${s3Url}`);
      return s3Url;
    } catch (error) {
      console.error("❌ Error converting base64 image:", error);
      throw new Error("Invalid base64 image format");
    }
  }

  // Return as is for other cases
  return profileImage;
};

export const updateUser = async (id: string, update: UpdateUserDTO) => {
  // Process profile image if present
  if (update.profileImage) {
    update.profileImage = await processProfileImage(id, update.profileImage);
  }

  return await User.findByIdAndUpdate(id, update, { new: true });
};

export const deleteUser = async (id: string) => {
  return await User.findByIdAndDelete(id);
};

export const findUsers = async (filter: FilterQuery<CreateUserDTO>) => {
  return await User.find(filter);
};

export const findAdminUsers = async () => {
  return await User.find({ role: "admin" }).select("-passwordHash").lean();
};

export const changeUserPassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Verify current password
  const currentPasswordHash = hashPassword(currentPassword);
  if (user.passwordHash !== currentPasswordHash) {
    throw new Error("Current password is incorrect");
  }

  // Update with new password
  const newPasswordHash = hashPassword(newPassword);
  return await User.findByIdAndUpdate(
    userId,
    { passwordHash: newPasswordHash },
    { new: true },
  ).select("-passwordHash");
};
