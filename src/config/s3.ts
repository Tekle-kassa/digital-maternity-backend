import { S3Client } from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION || "us-east-1";

/** Default matches previous hardcoded bucket; override with AWS_S3_BUCKET or S3_BUCKET. */
export const s3BucketName =
  process.env.AWS_S3_BUCKET || process.env.S3_BUCKET || "digital-maternity-ultrasound";

const hasStaticCredentials = !!(
  process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
);

const s3 = new S3Client({
  region,
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
 * Public URL for an object key. Prefer AWS_S3_PUBLIC_BASE_URL when using CloudFront
 * or a custom domain (no trailing slash), e.g. https://d111111abcdef8.cloudfront.net
 */
export function publicUrlForS3Key(key: string): string {
  const base = process.env.AWS_S3_PUBLIC_BASE_URL?.replace(/\/$/, "");
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  if (base) {
    return `${base}/${encodedKey}`;
  }
  return `https://${s3BucketName}.s3.${region}.amazonaws.com/${encodedKey}`;
}
