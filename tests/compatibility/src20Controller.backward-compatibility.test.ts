/**
 * @fileoverview Backward Compatibility Tests for Refactored SRC20Controller
 * @description Validates that all existing API consumers continue to work without
 * modification after the MarketDataEnrichmentService consolidation refactoring.
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";

const BASE_URL = "http://localhost:8000";
const TIMEOUT_MS = 8000;

// API response schemas for validation
interface SRC20TokenSchema {
  tick: string;
  op: string;
  creator: string;
  block_index: number;
  tx_hash: string;
  [key: string]: any; // Allow additional fields
}

interface ApiResponseSchema {
  data: SRC20TokenSchema[];
  page: number;
  limit: number;
  total?: number;
  totalPages?: number;
  last_block?: number;
  [key: string]: any; // Allow additional response fields
}

// Legacy API consumers simulation
interface LegacyApiConsumer {
  name: string;
  expectedFields: string[];
  forbiddenFields?: string[];
  version: string;
  validateResponse: (data: any) => boolean;
}

// Define legacy API consumers based on existing integrations
const legacyConsumers: LegacyApiConsumer[] = [
  {
    name: "Frontend Dashboard v2.2",
    version: "2.2",
    expectedFields: [
      "tick",
      "op",
      "creator",
      "block_index",
      "tx_hash",
      "amt",
      "max",
    ],
    forbiddenFields: ["market_data", "floor_unit_price", "mcap", "volume24"], // v2.2 shouldn't have market data
    validateResponse: (data: any) => {
      return data.data && Array.isArray(data.data) &&
        data.data.every((item: any) => item.tick && item.op && item.creator);
    },
  },
  {
    name: "Mobile App Client v2.3",
    version: "2.3",
    expectedFields: ["tick", "op", "creator", "market_data"],
    validateResponse: (data: any) => {
      return data.data && Array.isArray(data.data) &&
        data.data.every((item: any) => item.tick && ("market_data" in item));
    },
  },
  {
    name: "Analytics Service v2.2",
    version: "2.2",
    expectedFields: ["tick", "op", "amt", "max", "holders", "block_index"],
    forbiddenFields: ["market_data"], // Should not see v2.3 fields
    validateResponse: (data: any) => {
      return data.data && data.page && data.limit;
    },
  },
  {
    name: "Third-party Integration v2.3",
    version: "2.3",
    expectedFields: ["tick", "op", "market_data", "block_index", "tx_hash"],
    validateResponse: (data: any) => {
      return data.data && Array.isArray(data.data);
    },
  },
];

// Skip if no test server
const skipCompatibilityTests = Deno.env.get("CI") === "true" &&
  !Deno.env.get("TEST_SERVER_AVAILABLE");

describe("SRC20Controller Backward Compatibility Tests", () => {
  let serverAvailable = false;

  beforeAll(async () => {
    // Test server availability
    try {
      const response = await fetch(`${BASE_URL}/api/v2/health`, {
        signal: AbortSignal.timeout(3000),
      });
      serverAvailable = response.ok;
      console.log(
        `🔍 Compatibility testing server: ${
          serverAvailable ? "AVAILABLE" : "NOT AVAILABLE"
        }`,
      );
    } catch (_error) {
      console.log("⚠️ Backward compatibility tests require a running server");
    }
  });

  afterAll(() => {
    console.log("🔒 Backward compatibility validation completed");
  });

  describe("API Response Format Preservation", () => {
    it("should maintain exact response structure for v2.2 API consumers", async () => {
      if (!serverAvailable || skipCompatibilityTests) {
        console.log("⏭️ Skipping v2.2 response structure test");
        return;
      }

      console.log("🔍 Validating v2.2 API response structure...");

      const response = await fetch(
        `${BASE_URL}/api/v2/src20/DEPLOY?limit=5&page=1&sortBy=DESC`,
        {
          headers: {
            "X-API-Version": "2.2",
            "Accept": "application/json",
          },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        },
      );

      assertEquals(response.ok, true, "v2.2 API should respond successfully");
      const data = await response.json();

      // Core response structure validation
      assertExists(data.data, "Should have data array");
      assert(Array.isArray(data.data), "Data should be an array");
      assertExists(data.page, "Should have page number");
      assertExists(data.limit, "Should have limit");

      console.log(
        `  ✅ Core response structure: data[${data.data.length}], page=${data.page}, limit=${data.limit}`,
      );

      if (data.data.length > 0) {
        const firstToken = data.data[0];

        // Required fields that existed before refactoring
        const requiredFields = [
          "tick",
          "op",
          "creator",
          "block_index",
          "tx_hash",
        ];
        requiredFields.forEach((field) => {
          assertExists(
            firstToken[field],
            `Should have required field: ${field}`,
          );
        });

        // Fields that should NOT exist in v2.2 (market data fields)
        const forbiddenFields = [
          "market_data",
          "floor_unit_price",
          "mcap",
          "volume24",
          "change24",
        ];
        forbiddenFields.forEach((field) => {
          assert(
            !(field in firstToken),
            `v2.2 should NOT have field: ${field}`,
          );
        });

        console.log(
          `  ✅ v2.2 field validation: Required fields present, forbidden fields absent`,
        );
      }
    });

    it("should maintain exact response structure for v2.3 API consumers", async () => {
      if (!serverAvailable || skipCompatibilityTests) {
        console.log("⏭️ Skipping v2.3 response structure test");
        return;
      }

      console.log("🔍 Validating v2.3 API response structure...");

      const response = await fetch(
        `${BASE_URL}/api/v2/src20/DEPLOY?limit=5&page=1&sortBy=DESC`,
        {
          headers: {
            "X-API-Version": "2.3",
            "Accept": "application/json",
          },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        },
      );

      assertEquals(response.ok, true, "v2.3 API should respond successfully");
      const data = await response.json();

      // Core response structure validation
      assertExists(data.data, "Should have data array");
      assert(Array.isArray(data.data), "Data should be an array");
      assertExists(data.page, "Should have page number");
      assertExists(data.limit, "Should have limit");

      if (data.data.length > 0) {
        const firstToken = data.data[0];

        // Required fields for v2.3
        const requiredFields = [
          "tick",
          "op",
          "creator",
          "block_index",
          "tx_hash",
        ];
        requiredFields.forEach((field) => {
          assertExists(
            firstToken[field],
            `Should have required field: ${field}`,
          );
        });

        // v2.3 should have market_data field
        assert(
          "market_data" in firstToken,
          "v2.3 should have market_data property",
        );

        // If market_data exists, validate its structure
        if (firstToken.market_data) {
          assertExists(
            firstToken.market_data.tick,
            "Market data should have tick",
          );
          assertEquals(
            typeof firstToken.market_data.floor_price_btc,
            "number",
            "Floor price should be number",
          );
          assertEquals(
            typeof firstToken.market_data.market_cap_btc,
            "number",
            "Market cap should be number",
          );
        }

        console.log(
          `  ✅ v2.3 field validation: All required fields including market_data present`,
        );
      }
    });
  });

  describe("Legacy Consumer Compatibility", () => {
    for (const consumer of legacyConsumers) {
      it(`should maintain compatibility with ${consumer.name}`, async () => {
        if (!serverAvailable || skipCompatibilityTests) {
          console.log(`⏭️ Skipping ${consumer.name} compatibility test`);
          return;
        }

        console.log(
          `🔍 Testing compatibility with ${consumer.name} (${consumer.version})...`,
        );

        const response = await fetch(
          `${BASE_URL}/api/v2/src20/DEPLOY?limit=3&page=1&sortBy=DESC`,
          {
            headers: {
              "X-API-Version": consumer.version,
              "Accept": "application/json",
            },
            signal: AbortSignal.timeout(TIMEOUT_MS),
          },
        );

        assertEquals(
          response.ok,
          true,
          `${consumer.name} requests should succeed`,
        );
        const data = await response.json();

        // Use consumer's validation function
        assert(
          consumer.validateResponse(data),
          `${consumer.name} validation should pass`,
        );

        if (data.data.length > 0) {
          const firstToken = data.data[0];

          // Check expected fields are present
          consumer.expectedFields.forEach((field) => {
            assertExists(
              firstToken[field],
              `${consumer.name} expects field: ${field}`,
            );
          });

          // Check forbidden fields are absent
          if (consumer.forbiddenFields) {
            consumer.forbiddenFields.forEach((field) => {
              assert(
                !(field in firstToken),
                `${consumer.name} should not see field: ${field}`,
              );
            });
          }

          console.log(
            `  ✅ ${consumer.name}: All expected fields present, forbidden fields absent`,
          );
        }
      });
    }
  });

  describe("Error Response Compatibility", () => {
    it("should maintain error response format for invalid requests", async () => {
      if (!serverAvailable || skipCompatibilityTests) {
        console.log("⏭️ Skipping error response compatibility test");
        return;
      }

      console.log("🔍 Testing error response format compatibility...");

      // Test invalid parameter
      const invalidResponse = await fetch(
        `${BASE_URL}/api/v2/src20/INVALID_ENDPOINT?limit=5`,
        {
          headers: {
            "X-API-Version": "2.3",
            "Accept": "application/json",
          },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        },
      );

      // Should return 404 or similar error
      assert(!invalidResponse.ok, "Invalid endpoint should return error");

      const errorData = await invalidResponse.json().catch(() => null);

      if (errorData) {
        // Error responses should maintain expected structure
        // Most APIs return either { error: "message" } or { message: "error" }
        const hasErrorField = "error" in errorData || "message" in errorData ||
          "errors" in errorData;
        assert(
          hasErrorField,
          "Error response should have standard error field",
        );

        console.log(`  ✅ Error response maintains expected structure`);
      }
    });

    it("should handle version-specific error responses correctly", async () => {
      if (!serverAvailable || skipCompatibilityTests) {
        console.log("⏭️ Skipping version-specific error test");
        return;
      }

      console.log("🔍 Testing version-specific error handling...");

      // Test with unsupported version
      const unsupportedVersionResponse = await fetch(
        `${BASE_URL}/api/v2/src20/DEPLOY?limit=5`,
        {
          headers: {
            "X-API-Version": "1.0", // Unsupported version
            "Accept": "application/json",
          },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        },
      );

      // Should either default to latest version or return version error
      if (unsupportedVersionResponse.ok) {
        const data = await unsupportedVersionResponse.json();
        assertExists(
          data.data,
          "Should default gracefully to supported version",
        );
        console.log(`  ✅ Unsupported version defaults gracefully`);
      } else {
        // Should return meaningful version error
        const errorData = await unsupportedVersionResponse.json().catch(() =>
          null
        );
        if (errorData) {
          console.log(`  ✅ Unsupported version returns meaningful error`);
        }
      }
    });
  });

  describe("Data Type and Format Consistency", () => {
    it("should maintain consistent data types across versions", async () => {
      if (!serverAvailable || skipCompatibilityTests) {
        console.log("⏭️ Skipping data type consistency test");
        return;
      }

      console.log("🔍 Testing data type consistency across API versions...");

      // Fetch same data in different versions
      const [v22Response, v23Response] = await Promise.all([
        fetch(`${BASE_URL}/api/v2/src20/DEPLOY?limit=3&sortBy=DESC`, {
          headers: { "X-API-Version": "2.2" },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        }),
        fetch(`${BASE_URL}/api/v2/src20/DEPLOY?limit=3&sortBy=DESC`, {
          headers: { "X-API-Version": "2.3" },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        }),
      ]);

      assertEquals(v22Response.ok, true, "v2.2 should work");
      assertEquals(v23Response.ok, true, "v2.3 should work");

      const [v22Data, v23Data] = await Promise.all([
        v22Response.json(),
        v23Response.json(),
      ]);

      if (v22Data.data.length > 0 && v23Data.data.length > 0) {
        const v22Token = v22Data.data[0];
        const v23Token = v23Data.data[0];

        // Common fields should have same data types
        const commonFields = ["tick", "op", "creator", "block_index", "amt"];

        commonFields.forEach((field) => {
          if (field in v22Token && field in v23Token) {
            const v22Type = typeof v22Token[field];
            const v23Type = typeof v23Token[field];
            assertEquals(
              v22Type,
              v23Type,
              `Field ${field} should have consistent type across versions`,
            );
          }
        });

        console.log(`  ✅ Data types consistent across versions`);
      }
    });

    it("should maintain pagination consistency", async () => {
      if (!serverAvailable || skipCompatibilityTests) {
        console.log("⏭️ Skipping pagination consistency test");
        return;
      }

      console.log("🔍 Testing pagination consistency...");

      const response = await fetch(
        `${BASE_URL}/api/v2/src20/DEPLOY?limit=5&page=2&sortBy=DESC`,
        {
          headers: { "X-API-Version": "2.3" },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        },
      );

      assertEquals(response.ok, true, "Pagination should work");
      const data = await response.json();

      // Standard pagination fields
      assertExists(data.page, "Should have page");
      assertExists(data.limit, "Should have limit");
      assertEquals(data.page, 2, "Page should match request");
      assertEquals(data.limit, 5, "Limit should match request");

      // Optional pagination fields that might exist
      if ("total" in data) {
        assertEquals(typeof data.total, "number", "Total should be number");
      }
      if ("totalPages" in data) {
        assertEquals(
          typeof data.totalPages,
          "number",
          "TotalPages should be number",
        );
      }

      console.log(
        `  ✅ Pagination structure consistent: page=${data.page}, limit=${data.limit}`,
      );
    });
  });

  describe("Client SDK Compatibility Simulation", () => {
    it("should work with simulated JavaScript SDK", async () => {
      if (!serverAvailable || skipCompatibilityTests) {
        console.log("⏭️ Skipping JavaScript SDK simulation");
        return;
      }

      console.log("🔍 Simulating JavaScript SDK usage...");

      // Simulate common SDK usage patterns
      const client = {
        baseUrl: BASE_URL,
        version: "2.3",

        async getSrc20Tokens(
          options: { limit?: number; page?: number; sortBy?: string } = {},
        ) {
          const params = new URLSearchParams();
          if (options.limit) params.set("limit", options.limit.toString());
          if (options.page) params.set("page", options.page.toString());
          if (options.sortBy) params.set("sortBy", options.sortBy);

          const response = await fetch(
            `${this.baseUrl}/api/v2/src20/DEPLOY?${params}`,
            {
              headers: {
                "X-API-Version": this.version,
                "Accept": "application/json",
              },
              signal: AbortSignal.timeout(TIMEOUT_MS),
            },
          );

          if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
          }

          return response.json();
        },
      };

      // Test SDK usage
      const tokens = await client.getSrc20Tokens({ limit: 5, sortBy: "DESC" });

      assertExists(tokens.data, "SDK should get data array");
      assert(Array.isArray(tokens.data), "Data should be array");
      assertExists(tokens.page, "SDK should get pagination");
      assertExists(tokens.limit, "SDK should get limit");

      console.log(
        `  ✅ JavaScript SDK simulation successful: ${tokens.data.length} tokens`,
      );
    });

    it("should maintain response time expectations for client apps", async () => {
      if (!serverAvailable || skipCompatibilityTests) {
        console.log("⏭️ Skipping response time expectations test");
        return;
      }

      console.log("🔍 Testing client app response time expectations...");

      const maxAcceptableTime = 3000; // 3 seconds - reasonable for client apps
      const startTime = performance.now();

      const response = await fetch(
        `${BASE_URL}/api/v2/src20/DEPLOY?limit=10&sortBy=DESC`,
        {
          headers: { "X-API-Version": "2.3" },
          signal: AbortSignal.timeout(maxAcceptableTime + 1000),
        },
      );

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      assertEquals(response.ok, true, "Request should succeed");
      await response.json(); // Ensure full processing

      assert(
        responseTime < maxAcceptableTime,
        `Response time (${
          responseTime.toFixed(2)
        }ms) should be under ${maxAcceptableTime}ms for client apps`,
      );

      console.log(
        `  ✅ Response time acceptable for clients: ${
          responseTime.toFixed(2)
        }ms`,
      );
    });
  });

  describe("Breaking Change Detection", () => {
    it("should not have any breaking changes in API responses", async () => {
      if (!serverAvailable || skipCompatibilityTests) {
        console.log("⏭️ Skipping breaking change detection");
        return;
      }

      console.log("🔍 Scanning for potential breaking changes...");

      // Test multiple endpoints and versions for consistency
      const testCases = [
        {
          endpoint: "DEPLOY",
          version: "2.2",
          expectedStructure: ["tick", "op", "creator"],
        },
        {
          endpoint: "DEPLOY",
          version: "2.3",
          expectedStructure: ["tick", "op", "creator", "market_data"],
        },
      ];

      const results = [];

      for (const testCase of testCases) {
        try {
          const response = await fetch(
            `${BASE_URL}/api/v2/src20/${testCase.endpoint}?limit=3`,
            {
              headers: { "X-API-Version": testCase.version },
              signal: AbortSignal.timeout(TIMEOUT_MS),
            },
          );

          assertEquals(
            response.ok,
            true,
            `${testCase.endpoint} v${testCase.version} should work`,
          );
          const data = await response.json();

          const result = {
            endpoint: testCase.endpoint,
            version: testCase.version,
            hasData: data.data && data.data.length > 0,
            hasExpectedStructure: true,
            missingFields: [] as string[],
            unexpectedFields: [] as string[],
          };

          if (data.data && data.data.length > 0) {
            const firstItem = data.data[0];

            // Check for expected fields
            testCase.expectedStructure.forEach((field) => {
              if (!(field in firstItem)) {
                result.missingFields.push(field);
                result.hasExpectedStructure = false;
              }
            });
          }

          results.push(result);
          console.log(
            `    ✅ ${testCase.endpoint} v${testCase.version}: Structure intact`,
          );
        } catch (error) {
          console.error(
            `    ❌ ${testCase.endpoint} v${testCase.version}: ${error}`,
          );
          throw error;
        }
      }

      // Validate results
      results.forEach((result) => {
        assertEquals(
          result.hasExpectedStructure,
          true,
          `${result.endpoint} v${result.version} should have expected structure`,
        );
        assertEquals(
          result.missingFields.length,
          0,
          `${result.endpoint} v${result.version} should not have missing fields: ${result.missingFields}`,
        );
      });

      console.log(
        `  ✅ No breaking changes detected across ${results.length} test cases`,
      );
    });
  });
});
