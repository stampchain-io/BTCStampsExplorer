/**
 * Media Constants for BTC Stamps Explorer
 * Runtime constants for media types, MIME types, and file handling
 */

/**
 * MIME type mappings for file extensions
 * Used for content-type detection and file handling
 */
export const MIME_TYPES: { [key: string]: string } = {
  // Image formats
  "jpg": "image/jpeg",
  "jpeg": "image/jpeg",
  "png": "image/png",
  "gif": "image/gif",
  "svg": "image/svg+xml",
  "svgz": "image/svg+xml",
  "webp": "image/webp",
  "avif": "image/avif",
  "ico": "image/x-icon",
  "bmp": "image/bmp",
  "tiff": "image/tiff",
  "tif": "image/tiff",

  // Text formats
  "html": "text/html",
  "htm": "text/html",
  "txt": "text/plain",
  "md": "text/markdown",

  // Audio formats
  "mp3": "audio/mpeg",
  "wav": "audio/wav",
  "ogg": "audio/ogg",

  // Video formats
  "mp4": "video/mp4",
  "webm": "video/webm",
  "ogv": "video/ogg",
} as const;

/**
 * File size thresholds for stamp content validation
 */
export const FILE_SIZE_LIMITS = {
  MAX_STAMP_SIZE: 64 * 1024, // 64KB maximum for stamp content
  MAX_PREVIEW_SIZE: 32 * 1024, // 32KB maximum for preview generation
  COMPRESSION_THRESHOLD: 16 * 1024, // 16KB threshold for compression
} as const;

/**
 * Supported file extensions for stamp content
 */
export const SUPPORTED_EXTENSIONS = Object.keys(MIME_TYPES);

/**
 * Image file extensions specifically
 */
export const IMAGE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "svg",
  "svgz",
  "webp",
  "avif",
  "ico",
  "bmp",
  "tiff",
  "tif",
] as const;

/**
 * Text file extensions specifically
 */
export const TEXT_EXTENSIONS = [
  "html",
  "htm",
  "txt",
  "md",
] as const;
