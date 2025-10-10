import multer from "multer";
import { FILE_UPLOAD_LIMITS } from "@middlewares/constants";

// File upload middleware with configurable limits
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: FILE_UPLOAD_LIMITS.MAX_DOCUMENT_SIZE }, // 10MB for documents
  fileFilter: (req, file, cb) => {
    const allowedTypes = FILE_UPLOAD_LIMITS.ALLOWED_FILE_TYPES as readonly string[];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed. Allowed: images, PDFs, Word, Excel documents"));
    }
  },
});

export default upload;
