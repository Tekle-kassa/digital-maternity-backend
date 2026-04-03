import multer from "multer";

const maxBytes = 15 * 1024 * 1024; // 15MB
const ultrasoundMaxBytes = 100 * 1024 * 1024; // 100MB (video)

/** In-memory multipart (buffer then uploaded to S3 in handler). */
export const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxBytes },
});

/** Ultrasound image/video uploads (larger limit for short clips). */
export const memoryUploadUltrasound = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: ultrasoundMaxBytes },
});
