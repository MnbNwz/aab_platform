import multer from "multer";
import { FILE_UPLOAD_LIMITS } from "../constants";

// File upload middleware with configurable limits
const upload = multer({
  limits: { fileSize: FILE_UPLOAD_LIMITS.MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (FILE_UPLOAD_LIMITS.ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, WebP images and PDF files are allowed"));
    }
  },
});

export default upload;
