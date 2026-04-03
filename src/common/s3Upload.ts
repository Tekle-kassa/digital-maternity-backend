import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3, {
  isS3EnvConfigured,
  publicUrlForS3Key,
  s3BucketName,
} from "../config/s3";
import { randomUUID } from "crypto";

export { isS3EnvConfigured as isS3UploadConfigured };

function extFromMime(mimetype: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/webm": "webm",
  };
  if (map[mimetype]) return map[mimetype];
  const sub = mimetype.split("/")[1];
  return sub ? sub.replace(/[^a-z0-9]/gi, "") || "bin" : "bin";
}

/**
 * Upload a buffer to S3 under ultrasounds/; returns public HTTPS URL.
 * Set bucket policy or ACL so clients can read (matches legacy multer-s3 public-read).
 */
export async function uploadBufferToS3(params: {
  buffer: Buffer;
  key: string;
  contentType: string;
}): Promise<string> {
  if (!isS3EnvConfigured()) {
    throw new Error("S3 is not configured");
  }

  const disableAcl =
    process.env.S3_DISABLE_OBJECT_ACL === "1" ||
    process.env.S3_OBJECT_ACL === "none";
  const aclOverride = process.env.S3_OBJECT_ACL;
  await s3.send(
    new PutObjectCommand({
      Bucket: s3BucketName,
      Key: params.key,
      Body: params.buffer,
      ContentType: params.contentType,
      ...(disableAcl
        ? {}
        : {
            ACL: (aclOverride && aclOverride !== "none"
              ? aclOverride
              : "public-read") as "public-read",
          }),
    })
  );

  return publicUrlForS3Key(params.key);
}

/**
 * Upload ultrasound image or video from memory (same contract as former Cloudinary helper).
 */
export async function uploadUltrasoundMedia(
  buffer: Buffer,
  mimetype: string
): Promise<string> {
  const ext = extFromMime(mimetype);
  const key = `ultrasounds/${Date.now()}-${randomUUID()}.${ext}`;
  return uploadBufferToS3({
    buffer,
    key,
    contentType: mimetype || "application/octet-stream",
  });
}

/** @deprecated use uploadUltrasoundMedia */
export async function uploadUltrasoundImage(
  buffer: Buffer,
  mimetype: string
): Promise<string> {
  return uploadUltrasoundMedia(buffer, mimetype);
}
