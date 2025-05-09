/**
 * Converts a base64 string to an ArrayBuffer
 * @param base64 The base64 string to convert
 * @returns An ArrayBuffer containing the decoded data
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Converts an ArrayBuffer to a base64 string
 * @param buffer The ArrayBuffer to convert
 * @returns A base64 string representing the buffer
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Creates a small test PNG file (1x1 pixel)
 * @returns A base64 encoded 1x1 pixel PNG
 */
export function createTestPNG(): string {
  return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
}

/**
 * Creates a test GIF file (1x1 pixel)
 * @returns A base64 encoded 1x1 pixel GIF
 */
export function createTestGIF(): string {
  return "R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";
}

/**
 * Creates a test SVG file (very small)
 * @returns A base64 encoded minimal SVG
 */
export function createTestSVG(): string {
  const svg = '<svg width="1" height="1" xmlns="http://www.w3.org/2000/svg"></svg>';
  return btoa(svg);
}

/**
 * Creates a test HTML file
 * @returns A base64 encoded minimal HTML
 */
export function createTestHTML(): string {
  const html = "<!DOCTYPE html><html><head><title>Test</title></head><body>Test</body></html>";
  return btoa(html);
}

/**
 * Creates a file buffer of a specific size (for testing size limits)
 * @param sizeInKB The size in kilobytes
 * @returns A base64 encoded file of the specified size
 */
export function createFileOfSize(sizeInKB: number): string {
  const bytes = new Uint8Array(sizeInKB * 1024);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = 65 + (i % 26); // Fill with repeating alphabet characters
  }
  
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}