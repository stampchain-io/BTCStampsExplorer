import { assertEquals, assertExists } from "@std/assert";
import { handleContentRequest } from "$routes/handlers/sharedContentHandler.ts";
import { StampController } from "$server/controller/stampController.ts";
import { API_RESPONSE_VERSION } from "$lib/utils/responseUtil.ts";
import { RouteType } from "$server/services/cacheService.ts";

const BASE_URL = "http://localhost:8000";
const TEST_TX_HASH =
  "1412e4f7c6bd4063bc478db47444da242a3ad89a4309c6877da146bd9830ec42";
const TEST_TX_HASH_BINARY =
  "14d9e8dbf9a54db20f7c4363c26dc8f7f124b509301655d3733722cf6cafaf34";

// Helper to verify all versions are consistent
function verifyVersions(version: string, expectedVersion: string) {
  const versions = version.split(",").map((v) => v.trim());
  // Check all versions are the same
  const allVersionsMatch = versions.every((v) => v === expectedVersion);
  if (!allVersionsMatch) {
    throw new Error(
      `Version mismatch in chain. Expected all versions to be ${expectedVersion}, got: ${
        versions.join(", ")
      }`,
    );
  }
  return true;
}

// Helper to check for duplicate values in header
function checkForDuplicates(headerValue: string, headerName: string) {
  const values = headerValue.split(",").map((v) => v.trim());
  const uniqueValues = [...new Set(values)];
  assertEquals(
    values.length,
    uniqueValues.length,
    `Duplicate values found in ${headerName}: ${headerValue}`,
  );
}

Deno.test("Version Chain Test Suite", async (t) => {
  await t.step("HTML content maintains version through chain", async () => {
    const mockCtx = {
      url: new URL(`${BASE_URL}/content/${TEST_TX_HASH}.html`),
      state: { baseUrl: BASE_URL },
    };

    try {
      console.log("Calling handleContentRequest for HTML...");
      const response = await handleContentRequest(
        `${TEST_TX_HASH}.html`,
        mockCtx as any,
      );
      console.log("Got response for HTML");

      console.log("Response status:", response.status);
      assertEquals(response.status, 200, "Expected 200 OK response");

      console.log("Raw headers:");
      response.headers.forEach((value, key) => {
        console.log(`${key}: ${value}`);
      });

      const headers = Object.fromEntries(response.headers);
      console.log("Processed headers:", headers);

      assertExists(headers["x-api-version"], "Version header should exist");
      assertEquals(
        verifyVersions(headers["x-api-version"], API_RESPONSE_VERSION),
        true,
        "All versions in chain should match API_RESPONSE_VERSION",
      );

      assertExists(headers["vary"], "Vary header should exist");
      assertEquals(
        headers["vary"].includes("X-API-Version"),
        true,
        "Vary header should include X-API-Version",
      );

      // Check for duplicates
      checkForDuplicates(headers["x-api-version"], "x-api-version");
      checkForDuplicates(headers["vary"], "vary");
      checkForDuplicates(headers["content-type"], "content-type");

      // Verify content type
      assertEquals(
        headers["content-type"],
        "text/html; charset=utf-8",
        "Content-Type should be text/html only",
      );
    } catch (error) {
      console.error("Error in HTML test:", error);
      throw error;
    }
  });

  await t.step("Binary content preserves version headers", async () => {
    const mockCtx = {
      url: new URL(`${BASE_URL}/content/${TEST_TX_HASH_BINARY}.png`),
      state: { baseUrl: BASE_URL },
    };

    try {
      console.log("Calling handleContentRequest for binary...");
      const response = await handleContentRequest(
        `${TEST_TX_HASH_BINARY}.png`,
        mockCtx as any,
      );
      console.log("Got response for binary");

      console.log("Response status:", response.status);
      assertEquals(response.status, 200, "Expected 200 OK response");

      console.log("Raw headers:");
      response.headers.forEach((value, key) => {
        console.log(`${key}: ${value}`);
      });

      const headers = Object.fromEntries(response.headers);
      console.log("Processed headers:", headers);

      assertExists(headers["x-api-version"]);
      assertEquals(
        verifyVersions(headers["x-api-version"], API_RESPONSE_VERSION),
        true,
        "All versions in chain should match API_RESPONSE_VERSION",
      );

      assertExists(headers["vary"], "Vary header should exist");
      assertEquals(
        headers["vary"].includes("X-API-Version"),
        true,
        "Vary header should include X-API-Version",
      );

      // Check for duplicates
      checkForDuplicates(headers["x-api-version"], "x-api-version");
      checkForDuplicates(headers["vary"], "vary");
      checkForDuplicates(headers["content-type"], "content-type");

      // Verify content type
      assertEquals(
        headers["content-type"],
        "image/png",
        "Content-Type should be image/png only",
      );
    } catch (error) {
      console.error("Error in binary test:", error);
      throw error;
    }
  });

  await t.step("Proxied content includes version headers", async () => {
    try {
      console.log("Calling StampController.getStampFile...");
      const response = await StampController.getStampFile(
        `${TEST_TX_HASH_BINARY}.png`,
        RouteType.STAMP_DETAIL,
        BASE_URL,
        true,
      );
      console.log("Got response for proxied content");

      console.log("Response status:", response.status);
      assertEquals(response.status, 200, "Expected 200 OK response");

      console.log("Raw headers:");
      response.headers.forEach((value, key) => {
        console.log(`${key}: ${value}`);
      });

      const headers = Object.fromEntries(response.headers);
      console.log("Processed headers:", headers);

      assertExists(headers["x-api-version"]);
      assertEquals(
        verifyVersions(headers["x-api-version"], API_RESPONSE_VERSION),
        true,
        "All versions in chain should match API_RESPONSE_VERSION",
      );

      assertExists(headers["vary"], "Vary header should exist");
      assertEquals(
        headers["vary"].includes("X-API-Version"),
        true,
        "Vary header should include X-API-Version",
      );

      // Check for duplicates
      checkForDuplicates(headers["x-api-version"], "x-api-version");
      checkForDuplicates(headers["vary"], "vary");
      checkForDuplicates(headers["content-type"], "content-type");

      // Verify content type
      assertEquals(
        headers["content-type"],
        "image/png",
        "Content-Type should be image/png only",
      );
    } catch (error) {
      console.error("Error in proxy test:", error);
      throw error;
    }
  });
});
