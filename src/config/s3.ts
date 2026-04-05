import { S3Client } from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION || "us-east-1";

/**
 * S3 API URL the **server** uses (PutObject, etc.). Use the private MinIO address
 * reachable only from the deployed app (e.g. http://minio:9000).
 *
 * Priority: `AWS_S3_ENDPOINT` (preferred) → `S3_ENDPOINT` → `MINIO_ENDPOINT` → `AWS_ENDPOINT_URL`.
 */
const rawEndpoint =
  process.env.AWS_S3_ENDPOINT ||
  process.env.S3_ENDPOINT ||
  process.env.MINIO_ENDPOINT ||
  process.env.AWS_ENDPOINT_URL ||
  "";

const endpoint = rawEndpoint.replace(/\/$/, "");

/** Default matches previous hardcoded bucket; override with AWS_S3_BUCKET or S3_BUCKET. */
export const s3BucketName =
  process.env.AWS_S3_BUCKET ||
  process.env.S3_BUCKET ||
  "digital-maternity-ultrasound";

const hasStaticCredentials = !!(
  process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
);

/** MinIO and most S3-compatible servers need path-style addressing. */
const forcePathStyle =
  process.env.S3_FORCE_PATH_STYLE === "false" ||
  process.env.S3_FORCE_PATH_STYLE === "0"
    ? false
    : process.env.S3_FORCE_PATH_STYLE === "1" ||
        process.env.S3_FORCE_PATH_STYLE === "true" ||
        Boolean(endpoint);

const s3 = new S3Client({
  region,
  ...(endpoint ? { endpoint } : {}),
  ...(forcePathStyle ? { forcePathStyle: true } : {}),
  ...(hasStaticCredentials
    ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      }
    : {}),
});

export default s3;

/** True when a bucket name is available (credentials optional: env keys or IAM role). */
export function isS3EnvConfigured(): boolean {
  return Boolean(s3BucketName);
}

/**
 * URL stored in DB / returned in API responses (`imageUrl`, etc.).
 *
 * When MinIO is **private** (`AWS_S3_ENDPOINT` only reachable inside the cluster), you
 * **must** set `AWS_S3_PUBLIC_BASE_URL` to a host browsers/clients can open (HTTPS
 * ingress, CDN, or public MinIO alias). No trailing slash.
 *
 * Falls back to path-style `{privateEndpoint}/{bucket}/{key}` only if public base is unset
 * (fine for local dev when your machine can reach that endpoint).
 */
export function publicUrlForS3Key(key: string): string {
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  const publicBase = process.env.AWS_S3_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (publicBase) {
    return `${publicBase}/${encodedKey}`;
  }
  if (endpoint) {
    return `${endpoint}/${s3BucketName}/${encodedKey}`;
  }
  return `https://${s3BucketName}.s3.${region}.amazonaws.com/${encodedKey}`;
}

/** Use after multer-s3: prefer public URL from key so private `AWS_S3_ENDPOINT` + public base works. */
export function publicUrlFromMulterS3File(file: {
  key?: string;
  location?: string;
}): string {
  if (file.key != null && file.key !== "") {
    return publicUrlForS3Key(file.key);
  }
  return file.location ?? "";
}
