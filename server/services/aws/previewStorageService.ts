/**
 * S3 Preview Storage Service
 *
 * Stores rendered stamp preview PNGs in S3 for CloudFront delivery.
 * Raw binary PNG is stored (no base64 wrapping) — saves ~33% vs JSON+base64.
 *
 * S3 key pattern: {IMAGE_DIR}/previews/{identifier}.png
 * CloudFront URL: https://{DOMAIN}/{IMAGE_DIR}/previews/{identifier}.png
 */
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { serverConfig } from "$server/config/config.ts";

let _s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!_s3Client) {
    _s3Client = new S3Client({ region: serverConfig.AWS_REGION });
  }
  return _s3Client;
}

function getS3Key(identifier: string): string {
  const dir = serverConfig.AWS_S3_IMAGE_DIR || "stamps";
  return `${dir}/previews/${identifier}.png`;
}

/**
 * Build the public CloudFront URL for a stored preview.
 */
export function getPreviewUrl(identifier: string): string {
  const domain = serverConfig.CLOUDFRONT_PREVIEW_DOMAIN || "stampchain.io";
  return `https://${domain}/${getS3Key(identifier)}`;
}

/**
 * Check if a preview already exists in S3.
 */
export async function previewExists(identifier: string): Promise<boolean> {
  try {
    await getS3Client().send(
      new HeadObjectCommand({
        Bucket: serverConfig.AWS_S3_BUCKETNAME,
        Key: getS3Key(identifier),
      }),
    );
    return true;
  } catch (err: unknown) {
    if (err instanceof Error && "name" in err && err.name === "NotFound") {
      return false;
    }
    // $metadata.httpStatusCode === 404 for HeadObject
    if (
      typeof err === "object" && err !== null &&
      "$metadata" in err &&
      (err as any).$metadata?.httpStatusCode === 404
    ) {
      return false;
    }
    throw err;
  }
}

/**
 * Upload a rendered PNG to S3 with CDN-friendly cache headers.
 * Stamps are immutable — cache forever.
 */
export async function uploadPreview(
  identifier: string,
  pngBytes: Uint8Array,
  meta?: Record<string, string>,
): Promise<string> {
  const key = getS3Key(identifier);
  const s3Meta: Record<string, string> = {};
  if (meta) {
    for (const [k, v] of Object.entries(meta)) {
      // S3 metadata keys are lowercased and must be ASCII
      s3Meta[k.toLowerCase().replace(/[^a-z0-9-]/g, "-")] = v;
    }
  }

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: serverConfig.AWS_S3_BUCKETNAME,
      Key: key,
      Body: pngBytes,
      ContentType: "image/png",
      CacheControl: "public, max-age=31536000, immutable",
      Metadata: s3Meta,
    }),
  );

  return getPreviewUrl(identifier);
}
