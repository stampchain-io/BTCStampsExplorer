/* ===== EDIT CREATOR NAME MODAL - UNIT TESTS ===== */
/* Tests for the client-side validateCreatorName function exported from the island. */
import { assertEquals } from "@std/assert";
import { describe, it } from "jsr:@std/testing@1.0.14/bdd";
import { validateCreatorName } from "$islands/modal/EditCreatorNameModal.tsx";

describe("validateCreatorName (client-side)", () => {
  /* ===== VALID NAMES ===== */
  describe("valid names", () => {
    it("should accept a simple alphanumeric name", () => {
      const result = validateCreatorName("Alice");
      assertEquals(result.valid, true);
      assertEquals(result.message, undefined);
    });

    it("should accept name with allowed special characters", () => {
      const result = validateCreatorName("Alice.B_Smith-Jr'");
      assertEquals(result.valid, true);
    });

    it("should accept name with spaces", () => {
      const result = validateCreatorName("Alice Smith");
      assertEquals(result.valid, true);
    });

    it("should accept a single character name", () => {
      const result = validateCreatorName("A");
      assertEquals(result.valid, true);
    });

    it("should accept exactly 25 characters", () => {
      // Exactly 25 chars
      const result = validateCreatorName("A".repeat(25));
      assertEquals(result.valid, true);
    });

    it("should trim leading/trailing whitespace before validation", () => {
      // Trimmed name is valid even though raw input has spaces
      const result = validateCreatorName("  alice  ");
      assertEquals(result.valid, true);
    });

    it("should accept digits-only name", () => {
      const result = validateCreatorName("12345");
      assertEquals(result.valid, true);
    });

    it("should accept name with period", () => {
      const result = validateCreatorName("alice.btc");
      assertEquals(result.valid, true);
    });

    it("should accept name with hyphen", () => {
      const result = validateCreatorName("alice-smith");
      assertEquals(result.valid, true);
    });

    it("should accept name with underscore", () => {
      const result = validateCreatorName("alice_smith");
      assertEquals(result.valid, true);
    });

    it("should accept name with apostrophe", () => {
      const result = validateCreatorName("alice's");
      assertEquals(result.valid, true);
    });
  });

  /* ===== EMPTY / WHITESPACE ===== */
  describe("empty and whitespace", () => {
    it("should reject empty string", () => {
      const result = validateCreatorName("");
      assertEquals(result.valid, false);
      assertEquals(result.message, "Creator name cannot be empty");
    });

    it("should reject whitespace-only string", () => {
      const result = validateCreatorName("   ");
      assertEquals(result.valid, false);
      assertEquals(result.message, "Creator name cannot be empty");
    });
  });

  /* ===== LENGTH VALIDATION ===== */
  describe("length validation", () => {
    it("should reject name longer than 25 characters", () => {
      const longName = "A".repeat(26);
      const result = validateCreatorName(longName);
      assertEquals(result.valid, false);
      assertEquals(
        result.message,
        "Creator name must be 25 characters or fewer (got 26)",
      );
    });

    it("should include actual length in error message", () => {
      const longName = "B".repeat(30);
      const result = validateCreatorName(longName);
      assertEquals(result.valid, false);
      assertEquals(
        result.message,
        "Creator name must be 25 characters or fewer (got 30)",
      );
    });
  });

  /* ===== PATTERN VALIDATION ===== */
  describe("invalid characters", () => {
    it("should reject name with @ symbol", () => {
      const result = validateCreatorName("alice@example");
      assertEquals(result.valid, false);
      assertEquals(
        result.message,
        "Creator name can only contain letters, numbers, spaces, periods, hyphens, underscores, and apostrophes",
      );
    });

    it("should reject name with exclamation mark", () => {
      const result = validateCreatorName("alice!");
      assertEquals(result.valid, false);
    });

    it("should reject name with hash", () => {
      const result = validateCreatorName("alice#1");
      assertEquals(result.valid, false);
    });

    it("should reject name with parentheses", () => {
      const result = validateCreatorName("alice (btc)");
      assertEquals(result.valid, false);
    });

    it("should reject name with slash", () => {
      const result = validateCreatorName("alice/btc");
      assertEquals(result.valid, false);
    });

    it("should reject name with emoji", () => {
      const result = validateCreatorName("alice😀");
      assertEquals(result.valid, false);
    });

    it("should reject name with percent", () => {
      const result = validateCreatorName("alice%");
      assertEquals(result.valid, false);
    });
  });

  /* ===== MIXED EDGE CASES ===== */
  describe("edge cases", () => {
    it("should reject name that is too long even after trimming", () => {
      // 26 non-space chars — trim doesn't help
      const result = validateCreatorName("A".repeat(26));
      assertEquals(result.valid, false);
    });

    it("should accept name that becomes exactly 25 chars after trim", () => {
      // " " + 25 chars + " " => trimmed = 25 chars
      const result = validateCreatorName(" " + "A".repeat(25) + " ");
      assertEquals(result.valid, true);
    });

    it("should reject name that is too long after trim", () => {
      // " " + 26 chars + " " => trimmed = 26 chars
      const result = validateCreatorName(" " + "A".repeat(26) + " ");
      assertEquals(result.valid, false);
    });
  });
});
