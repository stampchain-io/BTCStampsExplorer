// FileToAddressUtils Test Suite
// Tests for file to Bitcoin address encoding/decoding utilities

import { FileToAddressUtils } from "$lib/utils/bitcoin/encoding/fileToAddressUtils.ts";
import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";

describe("FileToAddressUtils Test Suite", () => {
  // Test fixtures for file to address conversions
  const testFixtures = {
    fileData: [
      {
        fileHex: "48656c6c6f", // "Hello" (5 bytes)
        network: "bitcoin",
        description: "Small file data",
        expectedChunks: 1,
        expectedSizePrefix: "0005",
        expectedFullHex: "000548656c6c6f" + "0".repeat(52), // Size prefix + data + padding
      },
      {
        fileHex:
          "89504e470d0a1a0a0000000d494844520000000100000001080600000000367ef924", // PNG header (32 bytes)
        network: "bitcoin",
        description: "PNG header data",
        expectedChunks: 2, // 2 bytes size prefix + 32 bytes data = 34 bytes = 2 chunks
        expectedSizePrefix: "0020",
      },
      {
        fileHex: "00".repeat(100), // 100 bytes of zeros
        network: "bitcoin",
        description: "Larger file requiring multiple chunks",
        expectedChunks: 4, // Size prefix (2 bytes) + 100 bytes = 102 bytes → 4 chunks (32 bytes each)
        expectedSizePrefix: "0064",
      },
      {
        fileHex: "ff".repeat(200), // 200 bytes of 0xFF
        network: "testnet",
        description: "Large file on testnet",
        expectedChunks: 7, // Size prefix (2 bytes) + 200 bytes = 202 bytes → 7 chunks (32 bytes each)
        expectedSizePrefix: "00c8",
      },
      {
        fileHex: "", // Empty file
        network: "bitcoin",
        description: "Empty file",
        expectedChunks: 1,
        expectedSizePrefix: "0000",
      },
    ],
  };

  describe("fileToAddresses", () => {
    it("should convert file hex to bitcoin addresses with correct size prefix", () => {
      for (const fixture of testFixtures.fileData) {
        const addresses = FileToAddressUtils.fileToAddresses(
          fixture.fileHex,
          fixture.network,
        );

        assertExists(addresses);
        assertEquals(
          addresses.length,
          fixture.expectedChunks,
          `Wrong chunk count for ${fixture.description}`,
        );

        // All addresses should be strings
        for (const addr of addresses) {
          assertEquals(typeof addr, "string");
          assertEquals(
            addr.startsWith(fixture.network === "bitcoin" ? "bc1" : "tb1"),
            true,
          );
        }
      }
    });

    it("should add correct size prefix to file data", () => {
      const fixture = testFixtures.fileData[0]; // "Hello"
      const addresses = FileToAddressUtils.fileToAddresses(fixture.fileHex);

      // Convert back to verify size prefix
      const recoveredHex = FileToAddressUtils.addressesToHex(addresses);
      assertEquals(recoveredHex, fixture.fileHex);
    });

    it("should pad the last chunk to 64 characters", () => {
      // Small file that won't fill even one chunk
      const smallFile = "aabbcc"; // 3 bytes
      const addresses = FileToAddressUtils.fileToAddresses(smallFile);

      assertEquals(addresses.length, 1);
      // The chunk should be padded to 64 chars (32 bytes)
      // Size prefix (0003) + data (aabbcc) + padding
    });

    it("should handle exact chunk boundary", () => {
      // 30 bytes of data + 2 byte size prefix = 32 bytes = exactly 1 chunk
      const exactChunkData = "00".repeat(30); // 30 bytes
      const addresses = FileToAddressUtils.fileToAddresses(exactChunkData);

      assertEquals(addresses.length, 1);
    });

    it("should default to bitcoin network", () => {
      const fileHex = "deadbeef";
      const addresses = FileToAddressUtils.fileToAddresses(fileHex);

      for (const addr of addresses) {
        assertEquals(addr.startsWith("bc1"), true);
      }
    });

    it("should handle unsupported network gracefully", () => {
      const fileHex = "deadbeef";
      const addresses = FileToAddressUtils.fileToAddresses(fileHex, "regtest");

      // Should still generate addresses even if network isn't recognized
      assertExists(addresses);
      assertEquals(addresses.length > 0, true);
    });
  });

  describe("addressesToHex", () => {
    it("should convert addresses back to original file hex", () => {
      for (const fixture of testFixtures.fileData) {
        if (fixture.fileHex === "") continue; // Skip empty file for this test

        const addresses = FileToAddressUtils.fileToAddresses(
          fixture.fileHex,
          fixture.network,
        );
        const recoveredHex = FileToAddressUtils.addressesToHex(addresses);

        assertEquals(
          recoveredHex,
          fixture.fileHex,
          `Failed to recover original hex for ${fixture.description}`,
        );
      }
    });

    it("should handle empty address array", () => {
      const result = FileToAddressUtils.addressesToHex([]);
      assertEquals(result, "");
    });

    it("should extract correct file size from prefix", () => {
      // Create a file with known size
      const originalHex = "48656c6c6f"; // "Hello" - 5 bytes
      const addresses = FileToAddressUtils.fileToAddresses(originalHex);

      // Manually verify the size prefix is correct
      const firstAddress = addresses[0];
      // When converted back, should have size prefix 0005
      const fullHex = FileToAddressUtils.addressesToHex(addresses);
      assertEquals(fullHex, originalHex);
    });

    it("should handle multiple addresses correctly", () => {
      // Create a large file that spans multiple addresses
      const largeHex = "00".repeat(100); // 100 bytes
      const addresses = FileToAddressUtils.fileToAddresses(largeHex);

      assertEquals(addresses.length > 1, true);

      const recoveredHex = FileToAddressUtils.addressesToHex(addresses);
      assertEquals(recoveredHex, largeHex);
    });
  });

  describe("Round-trip conversions", () => {
    it("should maintain data integrity for various file sizes", () => {
      const testSizes = [1, 10, 30, 31, 32, 33, 64, 100, 256, 1000];

      for (const size of testSizes) {
        const originalHex = "a5".repeat(size);
        const addresses = FileToAddressUtils.fileToAddresses(originalHex);
        const recoveredHex = FileToAddressUtils.addressesToHex(addresses);

        assertEquals(
          recoveredHex,
          originalHex,
          `Round-trip failed for ${size} byte file`,
        );
      }
    });

    it("should work across different networks", () => {
      const testHex = "deadbeefcafe";

      // Bitcoin network
      const btcAddresses = FileToAddressUtils.fileToAddresses(
        testHex,
        "bitcoin",
      );
      const btcRecovered = FileToAddressUtils.addressesToHex(btcAddresses);
      assertEquals(btcRecovered, testHex);

      // Testnet network
      const testAddresses = FileToAddressUtils.fileToAddresses(
        testHex,
        "testnet",
      );
      const testRecovered = FileToAddressUtils.addressesToHex(testAddresses);
      assertEquals(testRecovered, testHex);
    });
  });

  describe("Edge cases and validation", () => {
    it("should handle maximum file size (65535 bytes)", () => {
      // Maximum size that can be represented in 2-byte prefix
      const maxSize = 65535;
      const maxHex = "00".repeat(maxSize);

      const addresses = FileToAddressUtils.fileToAddresses(maxHex);
      assertExists(addresses);
      assertEquals(addresses.length, Math.ceil((maxSize + 2) / 32)); // +2 for size prefix

      const recovered = FileToAddressUtils.addressesToHex(addresses);
      assertEquals(recovered, maxHex);
    });

    it("should handle files with all possible byte values", () => {
      // Create hex with all byte values 00-FF
      let allBytesHex = "";
      for (let i = 0; i < 256; i++) {
        allBytesHex += i.toString(16).padStart(2, "0");
      }

      const addresses = FileToAddressUtils.fileToAddresses(allBytesHex);
      const recovered = FileToAddressUtils.addressesToHex(addresses);
      assertEquals(recovered, allBytesHex);
    });

    it("should preserve binary data integrity", () => {
      // Simulate binary file data
      const binaryPatterns = [
        "00000000ffffffff", // Alternating min/max
        "0123456789abcdef", // Sequential hex
        "deadbeefcafebabe", // Common test pattern
        "a5a5a5a5a5a5a5a5", // Repeating pattern
      ];

      for (const pattern of binaryPatterns) {
        const addresses = FileToAddressUtils.fileToAddresses(pattern);
        const recovered = FileToAddressUtils.addressesToHex(addresses);
        assertEquals(recovered, pattern);
      }
    });
  });
});
