/**
 * Simplified Image Protocol Utilities for SRC-20 Token Images
 * Simple protocol:hash format with 32 character maximum
 */

export interface ParsedImageReference {
  protocol: string;
  hash: string;
  fullReference: string;
  isValid: boolean;
}

// Supported protocols - simple validation
export const SUPPORTED_PROTOCOLS = {
  ar: {
    prefix: "ar",
    description: "Arweave decentralized storage",
    example: "ar:BNttzDav3jHVnNiV7nYbQv-GY0HQ",
  },
  ipfs: {
    prefix: "ipfs",
    description: "IPFS (InterPlanetary File System)",
    example: "ipfs:QmXoypizjW3WknFiJnKLwHCNqzg",
  },
  fc: {
    prefix: "fc",
    description: "Filecoin decentralized storage",
    example: "fc:bafy2bzacea4b2wlqruv6wkjz8mAB",
  },
  ord: {
    prefix: "ord",
    description: "Bitcoin Ordinals",
    example: "ord:a1b2c3d4e5f67890123456789012",
  },
} as const;

/**
 * Parse an image reference into its components
 */
export function parseImageReference(reference: string): ParsedImageReference {
  if (!reference || typeof reference !== "string") {
    return {
      protocol: "",
      hash: "",
      fullReference: reference,
      isValid: false,
    };
  }

  const colonIndex = reference.indexOf(":");
  if (colonIndex === -1) {
    return {
      protocol: "",
      hash: reference,
      fullReference: reference,
      isValid: false,
    };
  }

  const protocol = reference.substring(0, colonIndex);
  const hash = reference.substring(colonIndex + 1);

  return {
    protocol,
    hash,
    fullReference: reference,
    isValid: true, // Just mark as parsed, validation happens in validateImageReference
  };
}

/**
 * Validate an image reference
 */
export function validateImageReference(reference: string): boolean {
  if (!reference || typeof reference !== "string") {
    return false;
  }

  // Check total length
  if (reference.length > 32) {
    return false;
  }

  const parsed = parseImageReference(reference);

  // Check if protocol is supported
  if (
    !SUPPORTED_PROTOCOLS[parsed.protocol as keyof typeof SUPPORTED_PROTOCOLS]
  ) {
    return false;
  }

  // Check hash format - basic alphanumeric + common hash characters
  const hashPattern = /^[A-Za-z0-9_-]+$/;
  if (!hashPattern.test(parsed.hash)) {
    return false;
  }

  // Hash should not be empty
  if (parsed.hash.length === 0) {
    return false;
  }

  return true;
}

/**
 * Get the full URL for an image reference
 */
export function getImageUrl(reference: string): string | null {
  if (!validateImageReference(reference)) {
    return null;
  }

  const parsed = parseImageReference(reference);

  switch (parsed.protocol) {
    case "ar":
      return `https://arweave.net/${parsed.hash}`;
    case "ipfs":
      return `https://ipfs.io/ipfs/${parsed.hash}`;
    case "fc":
      return `https://dweb.link/ipfs/${parsed.hash}`;
    case "ord":
      return `https://ordinals.com/inscription/${parsed.hash}`;
    default:
      return null;
  }
}
