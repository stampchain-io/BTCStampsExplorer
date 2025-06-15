import { assertEquals } from "@std/assert";
import { verifySignature } from "$lib/utils/cryptoUtils.ts";

// Save original console.error
const originalConsoleError = console.error;

// Mock console.error to suppress expected error output during tests
function suppressConsoleError() {
  console.error = () => {};
}

function restoreConsoleError() {
  console.error = originalConsoleError;
}

Deno.test("cryptoUtils - verifySignature error handling", () => {
  suppressConsoleError(); // Suppress expected error output

  // Test that the function returns false for various invalid inputs
  // and doesn't throw exceptions (it catches them and returns false)

  // Empty inputs
  assertEquals(
    verifySignature("", "", ""),
    false,
    "Empty inputs should return false",
  );

  // Invalid signature format
  assertEquals(
    verifySignature(
      "message",
      "not-a-signature",
      "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    ),
    false,
    "Invalid signature format should return false",
  );

  // Invalid base64
  assertEquals(
    verifySignature(
      "message",
      "!!!invalid-base64!!!",
      "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    ),
    false,
    "Invalid base64 should return false",
  );

  // Invalid Bitcoin address
  assertEquals(
    verifySignature("message", "SGVsbG8gV29ybGQh", "invalid-address"),
    false,
    "Invalid address should return false",
  );

  // Empty signature
  assertEquals(
    verifySignature("message", "", "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"),
    false,
    "Empty signature should return false",
  );

  // Empty message
  assertEquals(
    verifySignature(
      "",
      "SGVsbG8gV29ybGQh",
      "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    ),
    false,
    "Empty message should return false",
  );

  // Empty address
  assertEquals(
    verifySignature("message", "SGVsbG8gV29ybGQh", ""),
    false,
    "Empty address should return false",
  );

  restoreConsoleError(); // Restore console.error
});

Deno.test("cryptoUtils - verifySignature doesn't throw", () => {
  suppressConsoleError(); // Suppress expected error output

  // Test that the function never throws, even with completely invalid inputs
  const testCases = [
    { message: null as any, signature: null as any, address: null as any },
    {
      message: undefined as any,
      signature: undefined as any,
      address: undefined as any,
    },
    { message: 123 as any, signature: 456 as any, address: 789 as any },
    { message: {} as any, signature: [] as any, address: true as any },
  ];

  for (const { message, signature, address } of testCases) {
    try {
      const result = verifySignature(message, signature, address);
      assertEquals(typeof result, "boolean", "Should always return a boolean");
      assertEquals(result, false, "Invalid inputs should return false");
    } catch (error) {
      throw new Error(
        `Function threw an error when it should have returned false: ${error}`,
      );
    }
  }

  restoreConsoleError(); // Restore console.error
});

Deno.test("cryptoUtils - verifySignature with valid-looking inputs", () => {
  suppressConsoleError(); // Suppress expected error output

  // Test with inputs that look valid but may not actually verify
  // This tests that the function at least processes them without errors

  const result = verifySignature(
    "Hello, Bitcoin!",
    "H+HMxW3ZCdMPYLLfqJrJFLqmKNMeUKX8FGKAoVXwufcKBxMBP0pxlLZS0Fgk8c0mJmNUNyDDzWYA5Wa5MbUJj3Y=",
    "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  );

  // We expect this to return false since it's likely not a valid signature
  // The important thing is that it doesn't throw
  assertEquals(typeof result, "boolean", "Should return a boolean");

  restoreConsoleError(); // Restore console.error
});
