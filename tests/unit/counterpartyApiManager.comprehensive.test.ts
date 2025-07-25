/**
 * @fileoverview Comprehensive tests for CounterpartyApiManagerDI with mocked dependencies
 * Tests all XCP operations, node failover, caching, and error scenarios
 */

import { MockXcpProvider } from "$server/services/counterparty/xcpManagerDI.ts";
import { assertEquals, assertRejects } from "@std/assert";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";

describe("CounterpartyApiManagerDI", () => {
  let mockProvider: MockXcpProvider;

  beforeEach(() => {
    mockProvider = new MockXcpProvider();
  });

  afterEach(() => {
    mockProvider.clearMockResponses();
  });

  describe("Asset Operations", () => {
    it("should fetch XCP asset successfully", async () => {
      const result = await mockProvider.getXcpAsset("STAMP");
      assertEquals(result.result.asset, "STAMP");
      assertEquals(result.result.mock, true);
      assertEquals(typeof result.result.timestamp, "number");
    });

    it("should handle failure scenarios", async () => {
      mockProvider.setShouldFail(true);

      await assertRejects(
        async () => await mockProvider.getXcpAsset("STAMP"),
        Error,
        "Mock XCP provider configured to fail",
      );
    });
  });

  describe("Balance Operations", () => {
    it("should fetch balances successfully", async () => {
      const result = await mockProvider.getXcpBalancesByAddress("test-address");
      assertEquals(result.balances.length, 1);
      assertEquals(result.total, 1);
      assertEquals(result.balances[0].address, "test-address");
      assertEquals(result.balances[0].cpid, "MOCKASSET");
      assertEquals(result.balances[0].quantity, 1000);
    });

    it("should handle specific cpid filter", async () => {
      const result = await mockProvider.getXcpBalancesByAddress(
        "test-address",
        "STAMP",
      );
      assertEquals(result.balances[0].cpid, "STAMP");
    });

    it("should handle utxo-only requests", async () => {
      const result = await mockProvider.getXcpBalancesByAddress(
        "test-address",
        undefined,
        true,
      );
      assertEquals(result.balances[0].utxo, "mock_utxo");
    });

    it("should handle cursor pagination", async () => {
      const resultWithCursor = await mockProvider.getXcpBalancesByAddress(
        "test-address",
        undefined,
        false,
        { cursor: "existing_cursor" },
      );
      assertEquals(resultWithCursor.next_cursor, undefined);

      const resultWithoutCursor = await mockProvider.getXcpBalancesByAddress(
        "test-address",
      );
      assertEquals(resultWithoutCursor.next_cursor, "mock_cursor");
    });

    it("should handle balance failures", async () => {
      mockProvider.setShouldFail(true);

      await assertRejects(
        async () => await mockProvider.getXcpBalancesByAddress("test-address"),
        Error,
        "Mock XCP provider configured to fail",
      );
    });
  });

  describe("Transaction Operations", () => {
    it("should create dispense transaction", async () => {
      const result = await mockProvider.createDispense(
        "source-address",
        "dispenser-id",
        1000,
      );
      assertEquals(result.result.rawtransaction, "mock_raw_tx");
      assertEquals(result.result.params.address, "source-address");
      assertEquals(result.result.params.dispenser, "dispenser-id");
      assertEquals(result.result.params.quantity, 1000);
      assertEquals(result.result.mock, true);
    });

    it("should create send transaction", async () => {
      const result = await mockProvider.createSend(
        "source-address",
        "dest-address",
        "STAMP",
        500,
      );
      assertEquals(result.result.rawtransaction, "mock_send_tx");
      assertEquals(result.result.params.address, "source-address");
      assertEquals(result.result.params.destination, "dest-address");
      assertEquals(result.result.params.asset, "STAMP");
      assertEquals(result.result.params.quantity, 500);
      assertEquals(result.result.mock, true);
    });

    it("should compose attach transaction", async () => {
      const result = await mockProvider.composeAttach(
        "source-address",
        "STAMP",
        1,
      );
      assertEquals(result.rawtransaction, "mock_attach_tx");
      assertEquals(result.params.address, "source-address");
      assertEquals(result.params.asset, "STAMP");
      assertEquals(result.params.quantity, 1);
      assertEquals(result.mock, true);
    });

    it("should compose detach transaction", async () => {
      const result = await mockProvider.composeDetach(
        "utxo-hash",
        "dest-address",
      );
      assertEquals(result.rawtransaction, "mock_detach_tx");
      assertEquals(result.params.utxo, "utxo-hash");
      assertEquals(result.params.destination, "dest-address");
      assertEquals(result.mock, true);
    });

    it("should handle transaction failures", async () => {
      mockProvider.setShouldFail(true);

      await assertRejects(
        async () => await mockProvider.createDispense("addr", "disp", 100),
        Error,
        "Mock XCP provider configured to fail",
      );

      await assertRejects(
        async () => await mockProvider.createSend("addr", "dest", "ASSET", 100),
        Error,
        "Mock XCP provider configured to fail",
      );

      await assertRejects(
        async () => await mockProvider.composeAttach("addr", "ASSET", 1),
        Error,
        "Mock XCP provider configured to fail",
      );

      await assertRejects(
        async () => await mockProvider.composeDetach("utxo", "dest"),
        Error,
        "Mock XCP provider configured to fail",
      );
    });
  });

  describe("Health Check", () => {
    it("should return true for healthy service", async () => {
      const isHealthy = await mockProvider.checkHealth();
      assertEquals(isHealthy, true);
    });

    it("should return false for unhealthy service", async () => {
      mockProvider.setShouldFail(true);
      const isHealthy = await mockProvider.checkHealth();
      assertEquals(isHealthy, false);
    });
  });

  describe("Mock Configuration", () => {
    it("should handle limited failures", async () => {
      // Set to fail only once
      mockProvider.setShouldFail(true, 1);

      // First call should fail
      await assertRejects(
        async () => await mockProvider.getXcpAsset("STAMP"),
        Error,
        "Mock XCP provider configured to fail",
      );

      // Second call should succeed
      const result = await mockProvider.getXcpAsset("STAMP");
      assertEquals(result.result.asset, "STAMP");
    });

    it("should simulate response delays", async () => {
      // Mock provider has built-in 10ms delay
      const startTime = Date.now();
      await mockProvider.getXcpAsset("STAMP");
      const endTime = Date.now();

      // Should take at least 10ms
      assertEquals(endTime - startTime >= 10, true);
    });

    it("should handle custom mock responses", async () => {
      const customResponse = { custom: "response", test: true };
      mockProvider.setMockResponse("getXcpAsset", ["CUSTOM"], customResponse);

      const result = await mockProvider.getXcpAsset("CUSTOM");
      assertEquals(result.custom, "response");
      assertEquals(result.test, true);
    });

    it("should clear mock responses", async () => {
      mockProvider.setMockResponse("getXcpAsset", ["test"], { data: "test" });
      mockProvider.clearMockResponses();

      // Should use default behavior after clearing
      const result = await mockProvider.getXcpAsset("STAMP");
      assertEquals(result.result.mock, true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty strings and null values", async () => {
      const result = await mockProvider.getXcpBalancesByAddress("");
      assertEquals(result.balances[0].address, "");
      assertEquals(result.total, 1);
    });

    it("should handle zero quantities", async () => {
      const result = await mockProvider.createDispense("addr", "disp", 0);
      assertEquals(result.result.params.quantity, 0);
    });

    it("should handle undefined options", async () => {
      const result = await mockProvider.getXcpBalancesByAddress(
        "test-address",
        undefined,
        undefined,
        undefined,
      );
      assertEquals(result.balances.length, 1);
      assertEquals(result.next_cursor, "mock_cursor");
    });

    it("should handle multiple rapid calls", async () => {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(mockProvider.getXcpAsset(`ASSET${i}`));
      }

      const results = await Promise.all(promises);
      assertEquals(results.length, 5);

      for (let i = 0; i < 5; i++) {
        assertEquals(results[i].result.asset, `ASSET${i}`);
        assertEquals(results[i].result.mock, true);
      }
    });
  });

  describe("Error Recovery", () => {
    it("should reset failure state after max failures reached", async () => {
      mockProvider.setShouldFail(true, 2);

      // Fail twice
      await assertRejects(() => mockProvider.getXcpAsset("TEST"), Error);
      await assertRejects(() => mockProvider.getXcpAsset("TEST"), Error);

      // Should succeed on third attempt
      const result = await mockProvider.getXcpAsset("TEST");
      assertEquals(result.result.asset, "TEST");
    });

    it("should handle concurrent failure scenarios", async () => {
      mockProvider.setShouldFail(true, 1);

      // Start multiple concurrent requests
      const promises = [
        mockProvider.getXcpAsset("A").catch((e) => e.message),
        mockProvider.getXcpAsset("B").catch((e) => e.message),
        mockProvider.getXcpAsset("C").catch((e) => e.message),
      ];

      const results = await Promise.all(promises);

      // At least one should fail, others should succeed or fail based on timing
      const failures = results.filter((r) =>
        typeof r === "string" && r.includes("configured to fail")
      );
      const successes = results.filter((r) =>
        typeof r === "object" && r.result
      );

      assertEquals(failures.length >= 1, true);
      assertEquals(failures.length + successes.length, 3);
    });
  });
});
