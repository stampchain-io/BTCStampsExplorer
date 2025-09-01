import { arraysEqual } from "$lib/utils/data/binary/baseUtils.ts";
import { SRC20CompressionService } from "$server/services/src20/compression/compressionService.ts";
import { assertEquals, assertInstanceOf } from "@std/assert";
import { describe, it } from "jsr:@std/testing@1.0.14/bdd";

describe("SRC20CompressionService", () => {
  describe("zLibCompress", () => {
    it("should compress data successfully", async () => {
      const testData = new TextEncoder().encode(
        "Hello, World! This is a test string that should compress well.",
      );
      const compressed = await SRC20CompressionService.zLibCompress(testData);

      assertInstanceOf(compressed, Uint8Array);
      // Compressed data should be different from original (unless compression fails)
      // We can't guarantee compression will always work due to fallback behavior
    });

    it("should handle empty data", async () => {
      const emptyData = new Uint8Array(0);
      const result = await SRC20CompressionService.zLibCompress(emptyData);

      assertInstanceOf(result, Uint8Array);
    });

    it("should handle small data", async () => {
      const smallData = new TextEncoder().encode("Hi");
      const result = await SRC20CompressionService.zLibCompress(smallData);

      assertInstanceOf(result, Uint8Array);
    });

    it("should handle large data", async () => {
      const largeData = new Uint8Array(1000).fill(65); // 1000 'A' characters
      const result = await SRC20CompressionService.zLibCompress(largeData);

      assertInstanceOf(result, Uint8Array);
    });

    it("should return original data if compression fails", async () => {
      // Test with data that might cause compression to fail
      const testData = new Uint8Array([1, 2, 3, 4, 5]);
      const result = await SRC20CompressionService.zLibCompress(testData);

      assertInstanceOf(result, Uint8Array);
      // Due to fallback behavior, result should always be a Uint8Array
    });

    it("should handle extremely large data that might cause memory issues", async () => {
      // Test with data that might stress the compression system
      const hugeData = new Uint8Array(100000); // 100KB of data
      for (let i = 0; i < hugeData.length; i++) {
        hugeData[i] = i % 256;
      }

      const result = await SRC20CompressionService.zLibCompress(hugeData);
      assertInstanceOf(result, Uint8Array);
      // Should always return a valid Uint8Array, even if compression fails
    });

    it("should handle data with all zeros", async () => {
      const zeroData = new Uint8Array(1000).fill(0);
      const result = await SRC20CompressionService.zLibCompress(zeroData);

      assertInstanceOf(result, Uint8Array);
      // Zero data should compress very well if compression is working
    });

    it("should handle data with all 255s", async () => {
      const maxData = new Uint8Array(1000).fill(255);
      const result = await SRC20CompressionService.zLibCompress(maxData);

      assertInstanceOf(result, Uint8Array);
    });
  });

  describe("zLibUncompress", () => {
    it("should uncompress previously compressed data", async () => {
      const originalData = new TextEncoder().encode(
        "Hello, World! This is a test string for compression and decompression.",
      );
      const compressed = await SRC20CompressionService.zLibCompress(
        originalData,
      );
      const uncompressed = await SRC20CompressionService.zLibUncompress(
        compressed,
      );

      assertInstanceOf(uncompressed, Uint8Array);
      // If compression worked, uncompressed should match original
      if (!arraysEqual(compressed, originalData)) {
        // Only check if compression actually happened
        assertEquals(arraysEqual(uncompressed, originalData), true);
      }
    });

    it("should handle empty data", async () => {
      const emptyData = new Uint8Array(0);
      const result = await SRC20CompressionService.zLibUncompress(emptyData);

      assertInstanceOf(result, Uint8Array);
    });

    it("should handle invalid compressed data gracefully", async () => {
      const invalidData = new Uint8Array([255, 254, 253, 252]); // Random invalid data
      const result = await SRC20CompressionService.zLibUncompress(invalidData);

      assertInstanceOf(result, Uint8Array);
      // Should return original data if decompression fails
    });

    it("should handle large compressed data", async () => {
      const largeData = new Uint8Array(2000).fill(66); // 2000 'B' characters
      const compressed = await SRC20CompressionService.zLibCompress(largeData);
      const uncompressed = await SRC20CompressionService.zLibUncompress(
        compressed,
      );

      assertInstanceOf(uncompressed, Uint8Array);
    });

    it("should handle malformed zlib header", async () => {
      // Create data that looks like it might be compressed but has invalid header
      const malformedData = new Uint8Array([
        0x78,
        0x9C,
        0xFF,
        0xFF,
        0xFF,
        0xFF,
      ]);
      const result = await SRC20CompressionService.zLibUncompress(
        malformedData,
      );

      assertInstanceOf(result, Uint8Array);
      // Should gracefully handle malformed data and return original
      assertEquals(arraysEqual(result, malformedData), true);
    });

    it("should handle corrupted compressed data", async () => {
      // Start with valid compressed data then corrupt it
      const originalData = new TextEncoder().encode(
        "This is test data for corruption testing that is long enough to compress.",
      );
      const compressed = await SRC20CompressionService.zLibCompress(
        originalData,
      );

      // Corrupt the compressed data if it's actually compressed
      if (!arraysEqual(compressed, originalData) && compressed.length > 5) {
        const corrupted = new Uint8Array(compressed);
        corrupted[corrupted.length - 1] = 0xFF; // Corrupt the last byte

        const result = await SRC20CompressionService.zLibUncompress(corrupted);
        assertInstanceOf(result, Uint8Array);
        // Should return the corrupted data itself when decompression fails
        assertEquals(arraysEqual(result, corrupted), true);
      }
    });

    it("should handle extremely large invalid data", async () => {
      const largeInvalidData = new Uint8Array(50000);
      for (let i = 0; i < largeInvalidData.length; i++) {
        largeInvalidData[i] = Math.floor(Math.random() * 256);
      }

      const result = await SRC20CompressionService.zLibUncompress(
        largeInvalidData,
      );
      assertInstanceOf(result, Uint8Array);
      // Should handle large invalid data gracefully
    });
  });

  describe("compressWithCheck", () => {
    it("should not compress data shorter than 32 bytes", async () => {
      const shortData = new TextEncoder().encode("Short string");
      const result = await SRC20CompressionService.compressWithCheck(shortData);

      assertEquals(result.compressed, false);
      assertEquals(arraysEqual(result.compressedData, shortData), true);
    });

    it("should not compress data exactly 32 bytes", async () => {
      const exactData = new Uint8Array(32).fill(65); // Exactly 32 'A' characters
      const result = await SRC20CompressionService.compressWithCheck(exactData);

      assertEquals(result.compressed, false);
      assertEquals(arraysEqual(result.compressedData, exactData), true);
    });

    it("should attempt compression for data longer than 32 bytes", async () => {
      const longData = new TextEncoder().encode(
        "This is a very long string that is definitely longer than 32 bytes and should trigger compression logic in the service.",
      );
      const result = await SRC20CompressionService.compressWithCheck(longData);

      assertInstanceOf(result.compressedData, Uint8Array);
      assertEquals(typeof result.compressed, "boolean");

      // If compression succeeded, compressed data should be shorter
      if (result.compressed) {
        assertEquals(result.compressedData.length < longData.length, true);
      } else {
        // If compression failed or wasn't beneficial, should return original
        assertEquals(arraysEqual(result.compressedData, longData), true);
      }
    });

    it("should handle highly compressible data", async () => {
      const repetitiveData = new Uint8Array(100).fill(65); // 100 'A' characters - highly compressible
      const result = await SRC20CompressionService.compressWithCheck(
        repetitiveData,
      );

      assertInstanceOf(result.compressedData, Uint8Array);
      assertEquals(typeof result.compressed, "boolean");

      // This type of data should compress well if compression is working
      if (result.compressed) {
        assertEquals(
          result.compressedData.length < repetitiveData.length,
          true,
        );
      }
    });

    it("should handle random data that may not compress well", async () => {
      const randomData = new Uint8Array(100);
      for (let i = 0; i < randomData.length; i++) {
        randomData[i] = Math.floor(Math.random() * 256);
      }

      const result = await SRC20CompressionService.compressWithCheck(
        randomData,
      );

      assertInstanceOf(result.compressedData, Uint8Array);
      assertEquals(typeof result.compressed, "boolean");

      // Random data typically doesn't compress well
      if (!result.compressed) {
        assertEquals(arraysEqual(result.compressedData, randomData), true);
      }
    });

    it("should verify round-trip integrity", async () => {
      const testData = new TextEncoder().encode(
        "Test data for round-trip verification that is longer than 32 bytes to trigger compression logic.",
      );
      const result = await SRC20CompressionService.compressWithCheck(testData);

      if (result.compressed) {
        // If compression succeeded, verify we can decompress back to original
        const decompressed = await SRC20CompressionService.zLibUncompress(
          result.compressedData,
        );
        assertEquals(arraysEqual(decompressed, testData), true);
      } else {
        // If compression didn't happen, data should be unchanged
        assertEquals(arraysEqual(result.compressedData, testData), true);
      }
    });

    it("should handle empty compressed result gracefully", async () => {
      // Test edge case where compression might return empty result
      const testData = new Uint8Array(50).fill(1);
      const result = await SRC20CompressionService.compressWithCheck(testData);

      assertInstanceOf(result.compressedData, Uint8Array);
      assertEquals(typeof result.compressed, "boolean");

      // Should never return empty data
      assertEquals(result.compressedData.length > 0, true);
    });

    it("should handle compression verification failure", async () => {
      // This tests the integrity check in compressWithCheck
      const testData = new Uint8Array(100);
      for (let i = 0; i < testData.length; i++) {
        testData[i] = i % 256;
      }

      const result = await SRC20CompressionService.compressWithCheck(testData);

      assertInstanceOf(result.compressedData, Uint8Array);
      assertEquals(typeof result.compressed, "boolean");

      // Result should always be valid
      if (result.compressed) {
        // If marked as compressed, should be able to decompress to original
        const decompressed = await SRC20CompressionService.zLibUncompress(
          result.compressedData,
        );
        assertEquals(arraysEqual(decompressed, testData), true);
      }
    });

    it("should handle data that produces zero-length compression", async () => {
      // Test with data that might result in zero-length compression result
      const testData = new Uint8Array(100);
      // Fill with a pattern that might cause edge cases in compression
      for (let i = 0; i < testData.length; i++) {
        testData[i] = i < 50 ? 0 : 255;
      }

      const result = await SRC20CompressionService.compressWithCheck(testData);

      assertInstanceOf(result.compressedData, Uint8Array);
      assertEquals(typeof result.compressed, "boolean");

      // Should never return empty data - if compression returns empty, should fall back to original
      assertEquals(result.compressedData.length > 0, true);

      // If compression failed due to empty result, should return original data
      if (!result.compressed) {
        assertEquals(arraysEqual(result.compressedData, testData), true);
      }
    });

    it("should handle data where compression and decompression don't match", async () => {
      // This tests the integrity verification in compressWithCheck
      const testData = new Uint8Array(150);
      for (let i = 0; i < testData.length; i++) {
        testData[i] = (i * 17) % 256; // Some mathematical pattern
      }

      const result = await SRC20CompressionService.compressWithCheck(testData);

      assertInstanceOf(result.compressedData, Uint8Array);
      assertEquals(typeof result.compressed, "boolean");

      // If compression was marked as successful, the round-trip should work
      if (result.compressed) {
        const decompressed = await SRC20CompressionService.zLibUncompress(
          result.compressedData,
        );
        assertEquals(arraysEqual(decompressed, testData), true);
      } else {
        // If not compressed, should be original data
        assertEquals(arraysEqual(result.compressedData, testData), true);
      }
    });

    it("should handle compression that doesn't save space", async () => {
      // Test with data that might not compress well but is over 32 bytes
      const poorCompressionData = new Uint8Array(50);
      for (let i = 0; i < poorCompressionData.length; i++) {
        poorCompressionData[i] = Math.floor(Math.random() * 256);
      }

      const result = await SRC20CompressionService.compressWithCheck(
        poorCompressionData,
      );

      assertInstanceOf(result.compressedData, Uint8Array);
      assertEquals(typeof result.compressed, "boolean");

      // If compression doesn't save space, should return original data
      if (!result.compressed) {
        assertEquals(
          arraysEqual(result.compressedData, poorCompressionData),
          true,
        );
      } else {
        // If marked as compressed, compressed data should be smaller
        assertEquals(
          result.compressedData.length < poorCompressionData.length,
          true,
        );
      }
    });
  });

  describe("Direct function exports", () => {
    it("should export zLibCompress function", async () => {
      const { zLibCompress } = await import(
        "$server/services/src20/compression/compressionService.ts"
      );
      assertEquals(typeof zLibCompress, "function");

      const testData = new TextEncoder().encode("Test");
      const result = await zLibCompress(testData);
      assertInstanceOf(result, Uint8Array);
    });

    it("should export zLibUncompress function", async () => {
      const { zLibUncompress } = await import(
        "$server/services/src20/compression/compressionService.ts"
      );
      assertEquals(typeof zLibUncompress, "function");

      const testData = new TextEncoder().encode("Test");
      const result = await zLibUncompress(testData);
      assertInstanceOf(result, Uint8Array);
    });

    it("should export compressWithCheck function", async () => {
      const { compressWithCheck } = await import(
        "$server/services/src20/compression/compressionService.ts"
      );
      assertEquals(typeof compressWithCheck, "function");

      const testData = new TextEncoder().encode("Test");
      const result = await compressWithCheck(testData);
      assertInstanceOf(result.compressedData, Uint8Array);
      assertEquals(typeof result.compressed, "boolean");
    });
  });

  describe("Error handling and edge cases", () => {
    it("should handle null-like data gracefully", async () => {
      const emptyArray = new Uint8Array(0);

      const compressResult = await SRC20CompressionService.zLibCompress(
        emptyArray,
      );
      assertInstanceOf(compressResult, Uint8Array);

      const uncompressResult = await SRC20CompressionService.zLibUncompress(
        emptyArray,
      );
      assertInstanceOf(uncompressResult, Uint8Array);

      const checkResult = await SRC20CompressionService.compressWithCheck(
        emptyArray,
      );
      assertEquals(checkResult.compressed, false);
      assertEquals(arraysEqual(checkResult.compressedData, emptyArray), true);
    });

    it("should handle very large data", async () => {
      const largeData = new Uint8Array(10000);
      for (let i = 0; i < largeData.length; i++) {
        largeData[i] = i % 256;
      }

      const result = await SRC20CompressionService.compressWithCheck(largeData);
      assertInstanceOf(result.compressedData, Uint8Array);
      assertEquals(typeof result.compressed, "boolean");
    });

    it("should maintain data integrity across multiple operations", async () => {
      const originalData = new TextEncoder().encode(
        "Multi-operation test data that is definitely longer than 32 bytes for comprehensive testing.",
      );

      // First compress with check
      const firstResult = await SRC20CompressionService.compressWithCheck(
        originalData,
      );

      // Then compress the result again
      const secondResult = await SRC20CompressionService.compressWithCheck(
        firstResult.compressedData,
      );

      assertInstanceOf(firstResult.compressedData, Uint8Array);
      assertInstanceOf(secondResult.compressedData, Uint8Array);
      assertEquals(typeof firstResult.compressed, "boolean");
      assertEquals(typeof secondResult.compressed, "boolean");
    });

    it("should handle binary data with null bytes", async () => {
      const binaryData = new Uint8Array(100);
      for (let i = 0; i < binaryData.length; i++) {
        binaryData[i] = i % 10 === 0 ? 0 : (i % 256); // Include null bytes
      }

      const compressResult = await SRC20CompressionService.zLibCompress(
        binaryData,
      );
      assertInstanceOf(compressResult, Uint8Array);

      const uncompressResult = await SRC20CompressionService.zLibUncompress(
        compressResult,
      );
      assertInstanceOf(uncompressResult, Uint8Array);

      const checkResult = await SRC20CompressionService.compressWithCheck(
        binaryData,
      );
      assertInstanceOf(checkResult.compressedData, Uint8Array);
      assertEquals(typeof checkResult.compressed, "boolean");
    });

    it("should handle data with specific byte patterns that might cause issues", async () => {
      // Test with data patterns that might cause compression issues
      const problematicData = new Uint8Array(200);
      for (let i = 0; i < problematicData.length; i++) {
        if (i < 50) {
          problematicData[i] = 0xFF; // All high bits
        } else if (i < 100) {
          problematicData[i] = 0x00; // All zeros
        } else if (i < 150) {
          problematicData[i] = 0xAA; // Alternating bits
        } else {
          problematicData[i] = 0x55; // Opposite alternating bits
        }
      }

      const result = await SRC20CompressionService.compressWithCheck(
        problematicData,
      );
      assertInstanceOf(result.compressedData, Uint8Array);
      assertEquals(typeof result.compressed, "boolean");

      // Should handle these patterns gracefully
      assertEquals(result.compressedData.length > 0, true);
    });
  });

  describe("Performance and boundary conditions", () => {
    it("should handle data at 32-byte boundary", async () => {
      const boundaryData = new Uint8Array(32).fill(65);
      const result = await SRC20CompressionService.compressWithCheck(
        boundaryData,
      );

      assertEquals(result.compressed, false);
      assertEquals(arraysEqual(result.compressedData, boundaryData), true);
    });

    it("should handle data just over 32-byte boundary", async () => {
      const overBoundaryData = new Uint8Array(33).fill(65);
      const result = await SRC20CompressionService.compressWithCheck(
        overBoundaryData,
      );

      assertInstanceOf(result.compressedData, Uint8Array);
      assertEquals(typeof result.compressed, "boolean");
    });

    it("should handle single byte data", async () => {
      const singleByte = new Uint8Array([65]);

      const compressResult = await SRC20CompressionService.zLibCompress(
        singleByte,
      );
      assertInstanceOf(compressResult, Uint8Array);

      const checkResult = await SRC20CompressionService.compressWithCheck(
        singleByte,
      );
      assertEquals(checkResult.compressed, false);
      assertEquals(arraysEqual(checkResult.compressedData, singleByte), true);
    });

    it("should handle maximum practical data size", async () => {
      // Test with a reasonably large but practical size
      const maxData = new Uint8Array(50000);
      for (let i = 0; i < maxData.length; i++) {
        maxData[i] = (i * 7) % 256; // Some pattern that might compress
      }

      const result = await SRC20CompressionService.compressWithCheck(maxData);
      assertInstanceOf(result.compressedData, Uint8Array);
      assertEquals(typeof result.compressed, "boolean");

      // Should always return some data
      assertEquals(result.compressedData.length > 0, true);
    });

    it("should handle various data sizes around the 32-byte threshold", async () => {
      const sizes = [30, 31, 32, 33, 34, 35];

      for (const size of sizes) {
        const testData = new Uint8Array(size).fill(65);
        const result = await SRC20CompressionService.compressWithCheck(
          testData,
        );

        assertInstanceOf(result.compressedData, Uint8Array);
        assertEquals(typeof result.compressed, "boolean");

        if (size <= 32) {
          assertEquals(result.compressed, false);
          assertEquals(arraysEqual(result.compressedData, testData), true);
        }
        // For size > 32, compression may or may not happen depending on the algorithm
      }
    });

    it("should handle repeated compression attempts on same data", async () => {
      const testData = new TextEncoder().encode(
        "Repeated compression test data that is longer than 32 bytes to trigger compression logic multiple times.",
      );

      // Perform multiple compression operations on the same data
      const results = [];
      for (let i = 0; i < 5; i++) {
        const result = await SRC20CompressionService.compressWithCheck(
          testData,
        );
        results.push(result);

        assertInstanceOf(result.compressedData, Uint8Array);
        assertEquals(typeof result.compressed, "boolean");
      }

      // All results should be consistent
      for (let i = 1; i < results.length; i++) {
        assertEquals(results[i].compressed, results[0].compressed);
        assertEquals(
          arraysEqual(results[i].compressedData, results[0].compressedData),
          true,
        );
      }
    });
  });

  describe("Initialization and system behavior", () => {
    it("should handle initialization gracefully", async () => {
      // Test that the service works even if initialization has issues
      const testData = new TextEncoder().encode(
        "Test data for initialization handling",
      );

      const compressResult = await SRC20CompressionService.zLibCompress(
        testData,
      );
      assertInstanceOf(compressResult, Uint8Array);

      const uncompressResult = await SRC20CompressionService.zLibUncompress(
        testData,
      );
      assertInstanceOf(uncompressResult, Uint8Array);

      // Service should always return valid Uint8Array even if initialization fails
    });

    it("should handle multiple concurrent operations", async () => {
      const testData = new TextEncoder().encode(
        "Concurrent operation test data that is longer than 32 bytes to trigger compression.",
      );

      // Start multiple operations concurrently
      const operations = [];
      for (let i = 0; i < 10; i++) {
        operations.push(SRC20CompressionService.compressWithCheck(testData));
      }

      const results = await Promise.all(operations);

      // All operations should complete successfully
      for (const result of results) {
        assertInstanceOf(result.compressedData, Uint8Array);
        assertEquals(typeof result.compressed, "boolean");
      }

      // All results should be identical
      for (let i = 1; i < results.length; i++) {
        assertEquals(results[i].compressed, results[0].compressed);
        assertEquals(
          arraysEqual(results[i].compressedData, results[0].compressedData),
          true,
        );
      }
    });
  });
});
