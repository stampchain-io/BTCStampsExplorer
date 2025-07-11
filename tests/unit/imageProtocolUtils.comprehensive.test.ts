/**
 * @fileoverview Comprehensive tests for imageProtocolUtils
 * This file focuses on achieving high test coverage for all utility functions
 * including edge cases and error handling.
 */

import {
  getImageUrl,
  parseImageReference,
  SUPPORTED_PROTOCOLS,
  validateImageReference,
} from "$lib/utils/imageProtocolUtils.ts";
import { assertEquals } from "@std/assert";

/* ===== PARSE IMAGE REFERENCE TESTS ===== */

Deno.test("parseImageReference - valid references", () => {
  const testCases = [
    {
      input: "ar:BNttzDav3jHVnNiV7nYbQv-GY0HQ",
      expected: {
        protocol: "ar",
        hash: "BNttzDav3jHVnNiV7nYbQv-GY0HQ",
        fullReference: "ar:BNttzDav3jHVnNiV7nYbQv-GY0HQ",
        isValid: true,
      },
    },
    {
      input: "ipfs:QmXoypizjW3WknFiJnKLwHCNqzg",
      expected: {
        protocol: "ipfs",
        hash: "QmXoypizjW3WknFiJnKLwHCNqzg",
        fullReference: "ipfs:QmXoypizjW3WknFiJnKLwHCNqzg",
        isValid: true,
      },
    },
  ];

  testCases.forEach(({ input, expected }) => {
    const result = parseImageReference(input);
    assertEquals(result, expected);
  });
});

Deno.test("parseImageReference - invalid input types", () => {
  const testCases = [
    { input: null, description: "null input" },
    { input: undefined, description: "undefined input" },
    { input: 123, description: "number input" },
    { input: {}, description: "object input" },
    { input: [], description: "array input" },
  ];

  testCases.forEach(({ input }) => {
    const result = parseImageReference(input as any);
    assertEquals(result.protocol, "");
    assertEquals(result.hash, "");
    assertEquals(result.fullReference, input);
    assertEquals(result.isValid, false);
  });
});

Deno.test("parseImageReference - empty string", () => {
  const result = parseImageReference("");
  assertEquals(result, {
    protocol: "",
    hash: "",
    fullReference: "",
    isValid: false,
  });
});

Deno.test("parseImageReference - no colon separator", () => {
  const result = parseImageReference("justahashwithoutprotocol");
  assertEquals(result, {
    protocol: "",
    hash: "justahashwithoutprotocol",
    fullReference: "justahashwithoutprotocol",
    isValid: false,
  });
});

/* ===== VALIDATE IMAGE REFERENCE TESTS ===== */

Deno.test("validateImageReference - valid references", () => {
  const validReferences = [
    "ar:BNttzDav3jHVnNiV7nYbQv-GY0HQ",
    "ipfs:QmXoypizjW3WknFiJnKLwHCNqzg",
    "fc:bafy2bzacea4b2wlqruv6wkjz8mAB",
    "ord:a1b2c3d4e5f67890123456789012",
  ];

  validReferences.forEach((reference) => {
    assertEquals(validateImageReference(reference), true);
  });
});

Deno.test("validateImageReference - invalid input types", () => {
  const invalidInputs = [null, undefined, 123, {}, []];

  invalidInputs.forEach((input) => {
    assertEquals(validateImageReference(input as any), false);
  });
});

Deno.test("validateImageReference - empty string", () => {
  assertEquals(validateImageReference(""), false);
});

Deno.test("validateImageReference - references too long", () => {
  const longReference = "ar:" + "a".repeat(50); // Total length > 32
  assertEquals(validateImageReference(longReference), false);
});

Deno.test("validateImageReference - unsupported protocols", () => {
  const unsupportedReferences = [
    "http:example.com",
    "ftp:someserver",
    "unknown:hash123",
    "xyz:abc123",
  ];

  unsupportedReferences.forEach((reference) => {
    assertEquals(validateImageReference(reference), false);
  });
});

Deno.test("validateImageReference - invalid hash characters", () => {
  const invalidHashes = [
    "ar:hash with spaces",
    "ipfs:hash@invalid",
    "fc:hash#invalid",
    "ord:hash$invalid",
  ];

  invalidHashes.forEach((reference) => {
    assertEquals(validateImageReference(reference), false);
  });
});

Deno.test("validateImageReference - empty hash", () => {
  const emptyHashReferences = [
    "ar:",
    "ipfs:",
    "fc:",
    "ord:",
  ];

  emptyHashReferences.forEach((reference) => {
    assertEquals(validateImageReference(reference), false);
  });
});

/* ===== GET IMAGE URL TESTS ===== */

Deno.test("getImageUrl - valid references return correct URLs", () => {
  const testCases = [
    {
      reference: "ar:BNttzDav3jHVnNiV7nYbQv-GY0HQ",
      expected: "https://arweave.net/BNttzDav3jHVnNiV7nYbQv-GY0HQ",
    },
    {
      reference: "ipfs:QmXoypizjW3WknFiJnKLwHCNqzg",
      expected: "https://ipfs.io/ipfs/QmXoypizjW3WknFiJnKLwHCNqzg",
    },
    {
      reference: "fc:bafy2bzacea4b2wlqruv6wkjz8mAB",
      expected: "https://dweb.link/ipfs/bafy2bzacea4b2wlqruv6wkjz8mAB",
    },
    {
      reference: "ord:a1b2c3d4e5f67890123456789012",
      expected: "https://ordinals.com/inscription/a1b2c3d4e5f67890123456789012",
    },
  ];

  testCases.forEach(({ reference, expected }) => {
    const result = getImageUrl(reference);
    assertEquals(result, expected);
  });
});

Deno.test("getImageUrl - invalid references return null", () => {
  const invalidReferences = [
    null,
    undefined,
    "",
    "invalid:reference",
    "ar:",
    "toolong:" + "a".repeat(50),
    "ar:invalid@hash",
  ];

  invalidReferences.forEach((reference) => {
    const result = getImageUrl(reference as any);
    assertEquals(result, null);
  });
});

/* ===== SUPPORTED PROTOCOLS TESTS ===== */

Deno.test("SUPPORTED_PROTOCOLS - contains all expected protocols", () => {
  const expectedProtocols = ["ar", "ipfs", "fc", "ord"];

  expectedProtocols.forEach((protocol) => {
    assertEquals(protocol in SUPPORTED_PROTOCOLS, true);
    assertEquals(
      SUPPORTED_PROTOCOLS[protocol as keyof typeof SUPPORTED_PROTOCOLS].prefix,
      protocol,
    );
  });
});

Deno.test("SUPPORTED_PROTOCOLS - has required fields", () => {
  Object.values(SUPPORTED_PROTOCOLS).forEach((protocol) => {
    assertEquals(typeof protocol.prefix, "string");
    assertEquals(typeof protocol.description, "string");
    assertEquals(typeof protocol.example, "string");
    assertEquals(protocol.prefix.length > 0, true);
    assertEquals(protocol.description.length > 0, true);
    assertEquals(protocol.example.length > 0, true);
  });
});

/* ===== EDGE CASES AND INTEGRATION TESTS ===== */

Deno.test("parseImageReference and validateImageReference - integration", () => {
  const testReference = "ar:BNttzDav3jHVnNiV7nYbQv-GY0HQ";

  const parsed = parseImageReference(testReference);
  assertEquals(parsed.isValid, true);

  const isValid = validateImageReference(testReference);
  assertEquals(isValid, true);

  const url = getImageUrl(testReference);
  assertEquals(url, "https://arweave.net/BNttzDav3jHVnNiV7nYbQv-GY0HQ");
});

Deno.test("boundary testing - 32 character limit", () => {
  // Exactly 32 characters (should be valid)
  const validReference = "ar:" + "a".repeat(29); // 3 + 29 = 32
  assertEquals(validateImageReference(validReference), true);

  // 33 characters (should be invalid)
  const invalidReference = "ar:" + "a".repeat(30); // 3 + 30 = 33
  assertEquals(validateImageReference(invalidReference), false);
});

Deno.test("hash pattern validation - valid characters", () => {
  const validChars = [
    "ar:abcdefghijklmnopqrstuvwxyz",
    "ar:ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "ar:0123456789",
    "ar:hash_with_underscores",
    "ar:hash-with-dashes",
    "ar:MixedCase123_-",
  ];

  validChars.forEach((reference) => {
    assertEquals(validateImageReference(reference), true);
  });
});
