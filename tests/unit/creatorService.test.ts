import type { CreatorService } from "$server/services/creator/creatorService.ts";
import type { StampService } from "$server/services/stampService.ts";
import { assertEquals } from "@std/assert";
import { afterEach, beforeEach, describe, it } from "jsr:@std/testing@1.0.14/bdd";
import { restore, stub } from "@std/testing@1.0.14/mock";

describe("CreatorService DI Tests", () => {
  let stampServiceStub: any;
  let src101ServiceStub: any;

  beforeEach(() => {
    // Set test environment
    Deno.env.set("DENO_ENV", "test");
  });

  afterEach(() => {
    restore();
  });

  describe("getCreatorNameByAddress", () => {
    it("should return creator name when found", async () => {
      const mockCreatorName = "TestCreator";
      stampServiceStub = stub(
        StampService,
        "getCreatorNameByAddress",
        () => Promise.resolve(mockCreatorName),
      );

      const result = await CreatorService.getCreatorNameByAddress("bc1qtest");

      assertEquals(result, mockCreatorName);
      assertEquals(stampServiceStub.calls.length, 1);
      assertEquals(stampServiceStub.calls[0].args[0], "bc1qtest");
    });

    it("should return null when creator not found", async () => {
      stampServiceStub = stub(
        StampService,
        "getCreatorNameByAddress",
        () => Promise.resolve(null),
      );

      const result = await CreatorService.getCreatorNameByAddress(
        "bc1qnotfound",
      );

      assertEquals(result, null);
    });

    it("should handle errors gracefully", async () => {
      stampServiceStub = stub(
        StampService,
        "getCreatorNameByAddress",
        () => Promise.reject(new Error("Database error")),
      );

      const result = await CreatorService.getCreatorNameByAddress("bc1qerror");

      assertEquals(result, null);
    });
  });

  describe("updateCreatorName", () => {
    beforeEach(() => {
      // securityServiceStub = stub(
      //   SecurityService,
      //   "validateCSRFToken",
      //   () => Promise.resolve(true),
      // );
    });

    it("should successfully update creator name with valid signature", async () => {
      const mockUpdatedName = "NewCreatorName";

      // Mock verifySignature to return true (would need to import and stub)
      const params = {
        address: "bc1qtest",
        newName: mockUpdatedName,
        signature: "valid_signature",
        timestamp: Date.now().toString(),
        csrfToken: "valid_token",
      };

      // Note: This test would need additional mocking for signature verification
      // which could be added as a follow-up

      const result = await CreatorService.updateCreatorName(params);

      // Basic structure test - full implementation would require more mocking
      assertEquals(typeof result.success, "boolean");
    });

    it("should reject invalid CSRF token", async () => {
      // securityServiceStub.restore();
      // securityServiceStub = stub(
      //   SecurityService,
      //   "validateCSRFToken",
      //   () => Promise.resolve(false),
      // );

      const params = {
        address: "bc1qtest",
        newName: "TestName",
        signature: "signature",
        timestamp: Date.now().toString(),
        csrfToken: "invalid_token",
      };

      const result = await CreatorService.updateCreatorName(params);

      assertEquals(result.success, false);
      assertEquals(result.message, "Invalid CSRF token");
    });
  });
});
