import { v2 as cloudinary } from "cloudinary";

function ensureConfigured() {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config();
    return;
  }
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  }
}

export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_URL ||
    (process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET)
  );
}

const ULTRASOUND_FOLDER = "digital-maternity/ultrasounds";

/**
 * Upload image buffer to Cloudinary; returns HTTPS URL (secure_url).
 */
export async function uploadUltrasoundImage(buffer: Buffer, _mimetype: string): Promise<string> {
  ensureConfigured();
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured");
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: ULTRASOUND_FOLDER,
        resource_type: "image",
        use_filename: true,
        unique_filename: true,
      },
      (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        const url = result?.secure_url;
        if (!url) {
          reject(new Error("Cloudinary returned no secure_url"));
          return;
        }
        resolve(url);
      }
    );
    stream.end(buffer);
  });
}
