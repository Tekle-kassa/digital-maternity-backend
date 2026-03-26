import multer from "multer";

const maxBytes = 15 * 1024 * 1024; // 15MB

/** In-memory multipart (for Cloudinary upload in handler). */
export const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxBytes },
});
