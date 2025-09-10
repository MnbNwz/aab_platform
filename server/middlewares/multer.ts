import multer from "multer";

// 10 MB file size limit per doc
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 },
});

export default upload;
