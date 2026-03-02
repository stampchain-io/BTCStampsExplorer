/**
 * S3 Preview Storage Service
 *
 * Stores rendered stamp previews in S3 for CloudFront delivery.
 * Supports PNG (default) and GIF formats.
 * Raw binary is stored (no base64 wrapping) — saves ~33% vs JSON+base64.
 *
 * S3 key pattern: {IMAGE_DIR}/previews/{identifier}.{format}
 * CloudFront URL: https://{DOMAIN}/{IMAGE_DIR}/previews/{identifier}.{format}
 */
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { serverConfig } from "$server/config/config.ts";

export type PreviewFormat = "png" | "gif";

const CONTENT_TYPES: Record<PreviewFormat, string> = {
  png: "image/png",
  gif: "image/gif",
};

let _s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!_s3Client) {
    _s3Client = new S3Client({
      region: serverConfig.AWS_REGION,
      // Deno npm compat: force the SDK to use the default credential provider
      // chain which reads AWS_CONTAINER_CREDENTIALS_RELATIVE_URI in ECS Fargate.
      // Explicitly passing undefined lets the SDK auto-detect.
    });
    console.log(
      `[S3] Client initialized: region=${serverConfig.AWS_REGION}, bucket=${serverConfig.AWS_S3_BUCKETNAME}`,
    );
  }
  return _s3Client;
}

function getS3Key(identifier: string, format: PreviewFormat = "png"): string {
  const dir = (serverConfig.AWS_S3_IMAGE_DIR || "stamps").replace(/\/+$/, "");
  return `${dir}/previews/${identifier}.${format}`;
}

/**
 * Build the public CloudFront URL for a stored preview.
 */
export function getPreviewUrl(
  identifier: string,
  format: PreviewFormat = "png",
): string {
  const domain = serverConfig.CLOUDFRONT_PREVIEW_DOMAIN || "stampchain.io";
  return `https://${domain}/${getS3Key(identifier, format)}`;
}

/**
 * Check if a preview already exists in S3.
 */
export async function previewExists(
  identifier: string,
  format: PreviewFormat = "png",
): Promise<boolean> {
  try {
    await getS3Client().send(
      new HeadObjectCommand({
        Bucket: serverConfig.AWS_S3_BUCKETNAME,
        Key: getS3Key(identifier, format),
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
    console.error("[S3] previewExists error:", {
      name: err instanceof Error ? err.name : "unknown",
      message: err instanceof Error ? err.message : String(err),
      code: (err as any)?.$metadata?.httpStatusCode,
    });
    throw err;
  }
}

/**
 * Upload a rendered preview to S3 with CDN-friendly cache headers.
 * Stamps are immutable — cache forever.
 */
export async function uploadPreview(
  identifier: string,
  imageBytes: Uint8Array,
  format: PreviewFormat = "png",
  meta?: Record<string, string>,
): Promise<string> {
  const key = getS3Key(identifier, format);
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
      Body: imageBytes,
      ContentType: CONTENT_TYPES[format],
      CacheControl: "public, max-age=31536000, immutable",
      Metadata: s3Meta,
    }),
  );

  return getPreviewUrl(identifier, format);
}
