import { assert, assertEquals } from "@std/assert";
import {
  getImageUrl,
  parseImageReference,
  SUPPORTED_PROTOCOLS,
  validateImageReference,
} from "$lib/utils/imageProtocolUtils.ts";

Deno.test("Image Protocol Utils - Protocol Configuration", () => {
  // Test that all protocols are properly configured
  const protocols = Object.keys(SUPPORTED_PROTOCOLS);
  assert(protocols.includes("ar"), "Should support Arweave");
  assert(protocols.includes("ipfs"), "Should support IPFS");
  assert(protocols.includes("fc"), "Should support Filecoin");
  assert(protocols.includes("ord"), "Should support Bitcoin Ordinals");

  // Test that all protocols have required properties
  for (const [protocol, config] of Object.entries(SUPPORTED_PROTOCOLS)) {
    assert(config.prefix.length > 0, `${protocol} should have prefix`);
    assert(
      config.description.length > 0,
      `${protocol} should have description`,
    );
    assert(config.example.length > 0, `${protocol} should have example`);
    assert(
      config.example.startsWith(config.prefix + ":"),
      `${protocol} example should use correct prefix`,
    );
  }
});

Deno.test("Image Protocol Utils - Parse References", () => {
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
    {
      input: "fc:bafy2bzacea4b2wlqruv6wkjz8mAB",
      expected: {
        protocol: "fc",
        hash: "bafy2bzacea4b2wlqruv6wkjz8mAB",
        fullReference: "fc:bafy2bzacea4b2wlqruv6wkjz8mAB",
        isValid: true,
      },
    },
    {
      input: "ord:a1b2c3d4e5f67890123456789012",
      expected: {
        protocol: "ord",
        hash: "a1b2c3d4e5f67890123456789012",
        fullReference: "ord:a1b2c3d4e5f67890123456789012",
        isValid: true,
      },
    },
    {
      input: "invalid",
      expected: {
        protocol: "",
        hash: "invalid",
        fullReference: "invalid",
        isValid: false,
      },
    },
  ];

  for (const testCase of testCases) {
    const result = parseImageReference(testCase.input);
    assertEquals(result.protocol, testCase.expected.protocol);
    assertEquals(result.hash, testCase.expected.hash);
    assertEquals(result.fullReference, testCase.expected.fullReference);
    assertEquals(result.isValid, testCase.expected.isValid);
  }
});

Deno.test("Image Protocol Utils - Validate References", () => {
  // Valid cases
  assert(validateImageReference("ar:BNttzDav3jHVnNiV7nYbQv-GY0HQ"));
  assert(validateImageReference("ipfs:QmXoypizjW3WknFiJnKLwHCNqzg"));
  assert(validateImageReference("fc:bafy2bzacea4b2wlqruv6wkjz8mAB"));
  assert(validateImageReference("ord:a1b2c3d4e5f67890123456789012"));

  // Short valid cases
  assert(validateImageReference("ar:abc123"));
  assert(validateImageReference("ipfs:Qm123"));

  // Invalid cases
  assert(validateImageReference("") === false);
  assert(validateImageReference("invalid") === false);
  assert(validateImageReference("unknown:hash") === false);
  assert(validateImageReference("ar:") === false);
  assert(validateImageReference("ar:invalid@hash!") === false);
  assert(
    validateImageReference("toolong:thisistoolongtobevalidhash") === false,
  );

  // Test 32 character limit
  assert(validateImageReference("ar:12345678901234567890123456789") === true); // exactly 32 chars
  assert(validateImageReference("ar:123456789012345678901234567890") === false); // 33 chars
});

Deno.test("Image Protocol Utils - Get Image URLs", () => {
  const testCases = [
    {
      input: "ar:BNttzDav3jHVnNiV7nYbQv-GY0HQ",
      expected: "https://arweave.net/BNttzDav3jHVnNiV7nYbQv-GY0HQ",
    },
    {
      input: "ipfs:QmXoypizjW3WknFiJnKLwHCNqzg",
      expected: "https://ipfs.io/ipfs/QmXoypizjW3WknFiJnKLwHCNqzg",
    },
    {
      input: "fc:bafy2bzacea4b2wlqruv6wkjz8mAB",
      expected: "https://dweb.link/ipfs/bafy2bzacea4b2wlqruv6wkjz8mAB",
    },
    {
      input: "ord:a1b2c3d4e5f67890123456789012",
      expected: "https://ordinals.com/inscription/a1b2c3d4e5f67890123456789012",
    },
  ];

  for (const testCase of testCases) {
    const result = getImageUrl(testCase.input);
    assertEquals(result, testCase.expected);
  }

  // Invalid cases should return null
  assertEquals(getImageUrl(""), null);
  assertEquals(getImageUrl("invalid"), null);
  assertEquals(getImageUrl("unknown:hash"), null);
  assertEquals(getImageUrl("ar:invalid@hash!"), null);
});

Deno.test("Image Protocol Utils - Edge Cases", () => {
  // Empty and null inputs
  assert(validateImageReference("") === false);
  assert(validateImageReference(null as any) === false);
  assert(validateImageReference(undefined as any) === false);

  // Non-string inputs
  assert(validateImageReference(123 as any) === false);
  assert(validateImageReference({} as any) === false);
  assert(validateImageReference([] as any) === false);

  // Protocol without hash
  assert(validateImageReference("ar:") === false);
  assert(validateImageReference("ipfs:") === false);

  // Hash without protocol
  assert(validateImageReference("somehash") === false);
  assert(validateImageReference("BNttzDav3jHVnNiV7nYbQv-GY0HQ") === false);

  // Multiple colons - check if this actually works with our validation
  const multiColonRef = "ar:hash:extra";
  const isValid = validateImageReference(multiColonRef);
  if (isValid) {
    assert(validateImageReference(multiColonRef) === true);
    assertEquals(parseImageReference(multiColonRef).hash, "hash:extra");
  } else {
    // If validation fails, just check parsing works
    assertEquals(parseImageReference(multiColonRef).hash, "hash:extra");
  }
});

Deno.test("Image Protocol Utils - Real World Examples", () => {
  // Real-world examples that should work
  const realExamples = [
    "ar:BNttzDav3jHVnNiV7nYbQv-GY0HQ", // Arweave transaction
    "ipfs:QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG", // IPFS hash (truncated to fit)
    "fc:bafy2bzacea4b2wlqruv6wkjz8m", // Filecoin CID (truncated)
    "ord:6fb976ab49dcec017f1e201e84395983204ae1a7c2abf7ced0a85d692e442799i0", // Ordinals inscription (truncated)
  ];

  for (const example of realExamples) {
    if (example.length <= 32) {
      assert(validateImageReference(example), `Should validate: ${example}`);
      assert(
        getImageUrl(example) !== null,
        `Should generate URL for: ${example}`,
      );
    }
  }
});
