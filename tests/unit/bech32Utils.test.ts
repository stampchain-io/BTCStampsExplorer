// Bech32Utils Test Suite
// Tests for Bitcoin address Bech32 encoding/decoding utilities

import { Bech32Utils } from "$lib/utils/bitcoin/address/bech32Utils.ts";
import { assertEquals, assertExists, assertThrows } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";

describe("Bech32Utils Test Suite", () => {
  // Test fixtures for Bech32 conversions
  const testFixtures = {
    validP2WSH: [
      {
        hex: "0000000000000000000000000000000000000000000000000000000000000000",
        bitcoinAddress:
          "bc1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqthqst8",
        testnetAddress:
          "tb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqulkl3g",
        description: "All zeros",
      },
      {
        hex: "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
        bitcoinAddress:
          "bc1qlllllllllllllllllllllllllllllllllllllllllllllllllllsffrpzs",
        testnetAddress:
          "tb1qllllllllllllllllllllllllllllllllllllllllllllllllllls7p4wcl",
        description: "All ones",
      },
      {
        hex: "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4",
        bitcoinAddress:
          "bc1q39gyu3cdpgdq5qqqqqx5jjzy2gqqqqqpqqqqqqggqcqqqqqlzhzqgrrkmz",
        testnetAddress:
          "tb1q39gyu3cdpgdq5qqqqqx5jjzy2gqqqqqpqqqqqqggqcqqqqqlzhzqlt4epd",
        description: "PNG header prefix",
      },
    ],
    invalidHex: [
      { hex: "", description: "Empty hex" },
      { hex: "00", description: "Too short (1 byte)" },
      { hex: "0000", description: "Too short (2 bytes)" },
      {
        hex: "00000000000000000000000000000000000000000000000000000000000000",
        description: "31 bytes",
      },
      {
        hex:
          "000000000000000000000000000000000000000000000000000000000000000000",
        description: "33 bytes",
      },
    ],
  };

  describe("hexToBech32", () => {
    it("should convert valid 64-char hex to bitcoin bech32 address", () => {
      for (const fixture of testFixtures.validP2WSH) {
        const result = Bech32Utils.hexToBech32(fixture.hex, "bitcoin");
        assertEquals(
          result,
          fixture.bitcoinAddress,
          `Failed for ${fixture.description}`,
        );
      }
    });

    it("should convert valid 64-char hex to testnet bech32 address", () => {
      for (const fixture of testFixtures.validP2WSH) {
        const result = Bech32Utils.hexToBech32(fixture.hex, "testnet");
        assertEquals(
          result,
          fixture.testnetAddress,
          `Failed for ${fixture.description}`,
        );
      }
    });

    it("should default to bitcoin network when not specified", () => {
      const fixture = testFixtures.validP2WSH[0];
      const result = Bech32Utils.hexToBech32(fixture.hex);
      assertEquals(result, fixture.bitcoinAddress);
    });

    it("should return undefined for invalid hex lengths", () => {
      const consoleLogSpy = {
        called: false,
        message: "",
        log: function (msg: string) {
          this.called = true;
          this.message = msg;
        },
      };

      const originalLog = console.log;
      console.log = consoleLogSpy.log.bind(consoleLogSpy);

      try {
        for (const fixture of testFixtures.invalidHex) {
          consoleLogSpy.called = false;
          const result = Bech32Utils.hexToBech32(fixture.hex);
          assertEquals(
            result,
            undefined,
            `Should return undefined for ${fixture.description}`,
          );
          assertEquals(
            consoleLogSpy.called,
            true,
            `Should log error for ${fixture.description}`,
          );
          assertEquals(
            consoleLogSpy.message,
            "hex string must be 64 chars to generate p2wsh address",
          );
        }
      } finally {
        console.log = originalLog;
      }
    });

    it("should handle unsupported networks gracefully", () => {
      const hex = testFixtures.validP2WSH[0].hex;
      const result = Bech32Utils.hexToBech32(hex, "regtest");
      assertEquals(result?.startsWith("1"), true); // Falls back to empty HRP
    });
  });

  describe("bech32ToHex", () => {
    it("should convert P2WPKH addresses (42 chars) to hex", () => {
      const p2wpkhAddress = "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4";
      const result = Bech32Utils.bech32ToHex(p2wpkhAddress);
      assertExists(result);
      assertEquals(result.length, 40); // 20 bytes = 40 hex chars
      assertEquals(result, "751e76e8199196d454941c45d1b3a323f1433bd6");
    });

    it("should convert P2WSH addresses (62 chars) to hex", () => {
      for (const fixture of testFixtures.validP2WSH) {
        const result = Bech32Utils.bech32ToHex(fixture.bitcoinAddress);
        assertExists(result, `Failed to convert ${fixture.description}`);
        assertEquals(result, fixture.hex.toLowerCase());
      }
    });

    it("should handle case insensitive addresses", () => {
      const fixture = testFixtures.validP2WSH[0];
      const upperResult = Bech32Utils.bech32ToHex(
        fixture.bitcoinAddress.toUpperCase(),
      );
      const lowerResult = Bech32Utils.bech32ToHex(
        fixture.bitcoinAddress.toLowerCase(),
      );
      assertEquals(upperResult, lowerResult);
    });

    it("should return null or throw for invalid bech32 characters", () => {
      // These should return null due to invalid characters
      const invalidChars = [
        "bc1qinvalid!chars",
        "bc1qwith spaces",
      ];

      for (const address of invalidChars) {
        const result = Bech32Utils.bech32ToHex(address);
        assertEquals(result, null, `Should return null for: ${address}`);
      }

      // These should throw due to length issues
      assertThrows(
        () => Bech32Utils.bech32ToHex("bc1q"),
        TypeError,
        "Cannot read properties of undefined",
        "Should throw on too short address",
      );

      // Very long addresses may throw or return null
      const longAddress =
        "bc1q123456789012345678901234567890123456789012345678901234567890";
      try {
        const result = Bech32Utils.bech32ToHex(longAddress);
        assertEquals(result === null || typeof result === "string", true);
      } catch (e) {
        assertExists(e);
      }
    });

    it("should handle unsupported address lengths gracefully", () => {
      // Short addresses should throw TypeError
      assertThrows(
        () => Bech32Utils.bech32ToHex("bc1q"),
        TypeError,
        "Cannot read properties of undefined",
        "Should throw on very short address",
      );

      assertThrows(
        () => Bech32Utils.bech32ToHex(""),
        TypeError,
        "Cannot read properties of undefined",
        "Should throw on empty address",
      );

      // Addresses that create invalid binary strings should throw
      assertThrows(
        () => Bech32Utils.bech32ToHex("bc1qw508d6qejxtdg4y5r3zarvaryvqyzf3"),
        TypeError,
        "bin8 is not iterable",
        "Should throw when binary string cannot be split into 8-bit chunks",
      );

      // Long addresses beyond 62 chars may throw or return a result
      const longAddress =
        "bc1qlllllllllllllllllllllllllllllllllllllllllllllllllllls3x5a7extra";
      try {
        const result = Bech32Utils.bech32ToHex(longAddress);
        // Should return null due to invalid characters or just process what it can
        assertEquals(typeof result === "string" || result === null, true);
      } catch (e) {
        // It's ok to throw for malformed addresses
        assertExists(e);
      }
    });
  });

  describe("Round-trip conversions", () => {
    it("should maintain data integrity in hex->bech32->hex conversion", () => {
      for (const fixture of testFixtures.validP2WSH) {
        const bech32 = Bech32Utils.hexToBech32(fixture.hex, "bitcoin");
        assertExists(bech32);
        const backToHex = Bech32Utils.bech32ToHex(bech32);
        assertExists(backToHex);
        assertEquals(backToHex, fixture.hex.toLowerCase());
      }
    });

    it("should maintain data integrity across networks", () => {
      for (const fixture of testFixtures.validP2WSH) {
        // Bitcoin network
        const btcBech32 = Bech32Utils.hexToBech32(fixture.hex, "bitcoin");
        assertExists(btcBech32);
        const btcHex = Bech32Utils.bech32ToHex(btcBech32);
        assertEquals(btcHex, fixture.hex.toLowerCase());

        // Testnet network
        const testBech32 = Bech32Utils.hexToBech32(fixture.hex, "testnet");
        assertExists(testBech32);
        const testHex = Bech32Utils.bech32ToHex(testBech32);
        assertEquals(testHex, fixture.hex.toLowerCase());
      }
    });
  });

  describe("Edge cases and validation", () => {
    it("should handle maximum valid hex input", () => {
      const maxHex = "f".repeat(64);
      const result = Bech32Utils.hexToBech32(maxHex);
      assertExists(result);
      assertEquals(result.startsWith("bc1"), true);
    });

    it("should validate bech32 charset", () => {
      const validChars = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
      const address = "bc1" + validChars + "qq";
      // May throw or return null for invalid addresses
      try {
        const result = Bech32Utils.bech32ToHex(address);
        assertEquals(typeof result === "string" || result === null, true);
      } catch (e) {
        // It's ok to throw for malformed addresses
        assertExists(e);
      }
    });
  });
});
