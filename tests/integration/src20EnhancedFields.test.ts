/**
 * SRC-20 Enhanced Fields Integration Test
 *
 * Validates the new stamp_url and deploy_img fields in SRC-20 deploy operations
 * ensuring proper URL formatting, consistency, and CDN compatibility.
 */

import { assertEquals, assertExists, assertMatch } from "@std/assert";

const BASE_URL = "http://localhost:8000";
const TIMEOUT_MS = 8000;

// URL pattern validation
const STAMP_URL_PATTERN =
  /^https:\/\/stampchain\.io\/stamps\/[a-f0-9]{64}\.svg$/;
const TX_HASH_PATTERN = /^[a-f0-9]{64}$/;

Deno.test("SRC-20 Enhanced Fields Integration Tests", async (t) => {
  await t.step("Deploy endpoint returns enhanced fields", async () => {
    const response = await fetch(
      `${BASE_URL}/api/v2/src20?op=deploy&limit=3&includeMarketData=true`,
      {
        headers: {
          "X-API-Version": "2.3",
          "Accept": "application/json",
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );

    assertEquals(
      response.status,
      200,
      "Deploy endpoint should respond successfully",
    );

    const data = await response.json();
    assertExists(data.data, "Response should contain data array");
    assertEquals(Array.isArray(data.data), true, "Data should be an array");
    assertEquals(
      data.data.length > 0,
      true,
      "Should return at least one deploy operation",
    );

    const firstItem = data.data[0];

    // Validate stamp_url field
    assertExists(firstItem.stamp_url, "stamp_url field must exist");
    assertEquals(
      typeof firstItem.stamp_url,
      "string",
      "stamp_url must be a string",
    );
    assertMatch(
      firstItem.stamp_url,
      STAMP_URL_PATTERN,
      "stamp_url must match pattern https://stampchain.io/stamps/{64-hex}.svg",
    );

    // Validate deploy_img field
    assertExists(firstItem.deploy_img, "deploy_img field must exist");
    assertEquals(
      typeof firstItem.deploy_img,
      "string",
      "deploy_img must be a string",
    );
    assertMatch(
      firstItem.deploy_img,
      STAMP_URL_PATTERN,
      "deploy_img must match pattern https://stampchain.io/stamps/{64-hex}.svg",
    );

    // Validate deploy_tx field
    assertExists(firstItem.deploy_tx, "deploy_tx field must exist");
    assertEquals(
      typeof firstItem.deploy_tx,
      "string",
      "deploy_tx must be a string",
    );
    assertMatch(
      firstItem.deploy_tx,
      TX_HASH_PATTERN,
      "deploy_tx must be 64-character hex string",
    );

    // Validate tx_hash field
    assertExists(firstItem.tx_hash, "tx_hash field must exist");
    assertEquals(
      typeof firstItem.tx_hash,
      "string",
      "tx_hash must be a string",
    );
    assertMatch(
      firstItem.tx_hash,
      TX_HASH_PATTERN,
      "tx_hash must be 64-character hex string",
    );
  });

  await t.step("URL consistency validation", async () => {
    const response = await fetch(
      `${BASE_URL}/api/v2/src20?op=deploy&limit=1&includeMarketData=true`,
      {
        headers: {
          "X-API-Version": "2.3",
          "Accept": "application/json",
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );

    const data = await response.json();
    const item = data.data[0];

    // Extract transaction hashes from URLs
    const stampUrlMatch = item.stamp_url.match(
      /\/stamps\/([a-f0-9]{64})\.svg$/,
    );
    const deployImgMatch = item.deploy_img.match(
      /\/stamps\/([a-f0-9]{64})\.svg$/,
    );

    assertExists(stampUrlMatch, "stamp_url should contain valid hash");
    assertExists(deployImgMatch, "deploy_img should contain valid hash");

    const stampUrlHash = stampUrlMatch[1];
    const deployImgHash = deployImgMatch[1];

    // Validate hash consistency
    assertEquals(
      stampUrlHash,
      item.tx_hash,
      "stamp_url should contain tx_hash",
    );
    assertEquals(
      deployImgHash,
      item.deploy_tx,
      "deploy_img should contain deploy_tx",
    );
  });

  await t.step("Market data structure validation", async () => {
    const response = await fetch(
      `${BASE_URL}/api/v2/src20?op=deploy&limit=1&includeMarketData=true`,
      {
        headers: {
          "X-API-Version": "2.3",
          "Accept": "application/json",
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );

    const data = await response.json();
    const item = data.data[0];

    assertExists(item.market_data, "market_data field must exist");

    if (item.market_data !== null) {
      assertEquals(
        typeof item.market_data,
        "object",
        "market_data must be an object",
      );
      assertExists(
        item.market_data.holder_count,
        "market_data must include holder_count",
      );
      assertExists(
        item.market_data.market_cap_btc,
        "market_data must include market_cap_btc",
      );
      assertExists(
        item.market_data.price_btc,
        "market_data must include price_btc",
      );

      // Validate no duplicate fields in market_data
      assertEquals(
        item.market_data.hasOwnProperty("tx_hash"),
        false,
        "market_data should not contain tx_hash",
      );
      assertEquals(
        item.market_data.hasOwnProperty("stamp_url"),
        false,
        "market_data should not contain stamp_url",
      );
    }
  });

  await t.step("Mint progress structure validation", async () => {
    const response = await fetch(
      `${BASE_URL}/api/v2/src20?op=deploy&limit=1&includeMarketData=true`,
      {
        headers: {
          "X-API-Version": "2.3",
          "Accept": "application/json",
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );

    const data = await response.json();
    const item = data.data[0];

    assertExists(item.mint_progress, "mint_progress field must exist");

    if (item.mint_progress !== null) {
      assertEquals(
        typeof item.mint_progress,
        "object",
        "mint_progress must be an object",
      );
      assertExists(
        item.mint_progress.progress,
        "mint_progress must include progress",
      );
      assertExists(
        item.mint_progress.current,
        "mint_progress must include current",
      );
      assertExists(item.mint_progress.max, "mint_progress must include max");
      assertExists(
        item.mint_progress.total_mints,
        "mint_progress must include total_mints",
      );

      // Validate progress format
      assertEquals(
        typeof item.mint_progress.progress,
        "string",
        "progress must be a string",
      );
      assertMatch(
        item.mint_progress.progress,
        /^\d+\.\d{2}$/,
        "progress should be formatted as XX.XX",
      );

      // Validate total_mints is a number
      assertEquals(
        typeof item.mint_progress.total_mints,
        "number",
        "total_mints must be a number",
      );
    }
  });

  await t.step("CDN URL accessibility validation", async () => {
    const response = await fetch(
      `${BASE_URL}/api/v2/src20?op=deploy&limit=1&includeMarketData=true`,
      {
        headers: {
          "X-API-Version": "2.3",
          "Accept": "application/json",
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );

    const data = await response.json();
    const item = data.data[0];

    // Test that URLs are properly formatted for CDN access
    const stampUrl = new URL(item.stamp_url);
    const deployImgUrl = new URL(item.deploy_img);

    assertEquals(stampUrl.protocol, "https:", "stamp_url must use HTTPS");
    assertEquals(
      stampUrl.hostname,
      "stampchain.io",
      "stamp_url must use stampchain.io domain",
    );
    assertEquals(
      stampUrl.pathname.startsWith("/stamps/"),
      true,
      "stamp_url must use /stamps/ path",
    );
    assertEquals(
      stampUrl.pathname.endsWith(".svg"),
      true,
      "stamp_url must end with .svg",
    );

    assertEquals(deployImgUrl.protocol, "https:", "deploy_img must use HTTPS");
    assertEquals(
      deployImgUrl.hostname,
      "stampchain.io",
      "deploy_img must use stampchain.io domain",
    );
    assertEquals(
      deployImgUrl.pathname.startsWith("/stamps/"),
      true,
      "deploy_img must use /stamps/ path",
    );
    assertEquals(
      deployImgUrl.pathname.endsWith(".svg"),
      true,
      "deploy_img must end with .svg",
    );
  });

  await t.step("Performance validation", async () => {
    const startTime = Date.now();

    const response = await fetch(
      `${BASE_URL}/api/v2/src20?op=deploy&limit=5&includeMarketData=true`,
      {
        headers: {
          "X-API-Version": "2.3",
          "Accept": "application/json",
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    assertEquals(
      response.status,
      200,
      "Enhanced endpoint should respond successfully",
    );
    assertEquals(
      responseTime < 5000,
      true,
      `Response time should be under 5s, got ${responseTime}ms`,
    );

    const data = await response.json();
    assertEquals(data.data.length > 0, true, "Should return deploy operations");

    // Validate all items have the enhanced fields
    for (const item of data.data) {
      assertExists(item.stamp_url, `Item ${item.tick} should have stamp_url`);
      assertExists(item.deploy_img, `Item ${item.tick} should have deploy_img`);
      assertExists(item.deploy_tx, `Item ${item.tick} should have deploy_tx`);
    }
  });
});
