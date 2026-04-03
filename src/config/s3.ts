import { S3Client } from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION || "us-east-1";

/**
 * Custom S3 API endpoint (MinIO, LocalStack, etc.).
 * Examples: http://localhost:9000  https://minio.example.com
 */
const rawEndpoint =
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
 * Public URL returned to clients after upload.
 *
 * - Set `AWS_S3_PUBLIC_BASE_URL` when the URL clients should open differs from the API
 *   endpoint (CloudFront, reverse proxy, or MinIO console alias). No trailing slash.
 * - With a custom `S3_ENDPOINT` / MinIO and no public base, uses path-style:
 *   `{endpoint}/{bucket}/{key}`.
 * - Otherwise AWS virtual-hosted style for real S3.
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
