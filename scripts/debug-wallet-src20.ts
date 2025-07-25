#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write

/**
 * Debug script to investigate SRC-20 wallet data issues
 * Specifically for the production issue where token count shows 25 but data is empty
 */

import { Src20Controller } from "$server/controller/src20Controller.ts";
import { MarketDataRepository } from "$server/database/marketDataRepository.ts";
import { enrichTokensWithMarketData } from "$server/services/src20Service.ts";

const TEST_ADDRESS = "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m";

console.log("🔍 Debugging SRC-20 wallet data issue");
console.log(`Testing address: ${TEST_ADDRESS}`);
console.log("=" .repeat(50));

async function debugSrc20WalletData() {
  try {
    // Test the SRC-20 balance request exactly as the wallet route does
    const src20Params = {
      address: TEST_ADDRESS,
      includePagination: true,
      limit: 10,
      page: 1,
      includeMintData: true,
      sortBy: "DESC" as const,
    };

    console.log("🔍 Step 1: Fetching SRC-20 balance data");
    console.log("Parameters:", JSON.stringify(src20Params, null, 2));

    const src20Response = await Src20Controller.handleSrc20BalanceRequest(src20Params);

    console.log("🔍 Step 2: Raw SRC-20 response structure");
    console.log("Response keys:", Object.keys(src20Response));
    console.log("Total count:", src20Response.total);
    console.log("Data type:", typeof src20Response.data);
    console.log("Data length:", Array.isArray(src20Response.data) ? src20Response.data.length : 'Not an array');

    // Debug data structure
    if (src20Response.data) {
      console.log("🔍 Step 3: Data structure analysis");
      console.log("Data.data exists:", !!(src20Response.data as any).data);
      console.log("Data.data type:", typeof (src20Response.data as any).data);
      console.log("Data.data length:", Array.isArray((src20Response.data as any).data) ? (src20Response.data as any).data.length : 'Not an array');

      // Log first few items
      if (Array.isArray(src20Response.data)) {
        console.log("First 3 items directly from data:", src20Response.data.slice(0, 3));
      } else if (Array.isArray((src20Response.data as any).data)) {
        console.log("First 3 items from data.data:", (src20Response.data as any).data.slice(0, 3));
      }
    }

    // Test market data fetch
    console.log("🔍 Step 4: Fetching market data");
    const marketDataResponse = await MarketDataRepository.getAllSRC20MarketData(1000);
    console.log("Market data count:", marketDataResponse.length);

    // Test enrichment process
    console.log("🔍 Step 5: Testing enrichment process");
    const rawTokens = (src20Response.data as any)?.data || src20Response.data || [];
    console.log("Raw tokens for enrichment:", rawTokens.length);

    const enrichedTokens = enrichTokensWithMarketData(rawTokens, marketDataResponse);
    console.log("Enriched tokens count:", enrichedTokens.length);

    // Test with larger limit to see if it's a pagination issue
    console.log("🔍 Step 6: Testing with larger limit");
    const largeParams = {
      ...src20Params,
      limit: 50,
    };

    const largeResponse = await Src20Controller.handleSrc20BalanceRequest(largeParams);
    console.log("Large response total:", largeResponse.total);
    console.log("Large response data length:", Array.isArray(largeResponse.data) ? largeResponse.data.length : 'Not an array');

    // Check if it's a nested data issue
    const largeRawTokens = (largeResponse.data as any)?.data || largeResponse.data || [];
    console.log("Large raw tokens:", largeRawTokens.length);

    // Test without pagination to see all tokens
    console.log("🔍 Step 7: Testing without pagination");
    const noPagParams = {
      address: TEST_ADDRESS,
      includePagination: false,
      limit: 1000,
      page: 1,
      includeMintData: true,
      sortBy: "DESC" as const,
    };

    const noPagResponse = await Src20Controller.handleSrc20BalanceRequest(noPagParams);
    console.log("No pagination response keys:", Object.keys(noPagResponse));
    console.log("No pagination data length:", Array.isArray(noPagResponse.data) ? noPagResponse.data.length : 'Not an array');

    const noPagRawTokens = (noPagResponse.data as any)?.data || noPagResponse.data || [];
    console.log("No pagination raw tokens:", noPagRawTokens.length);

    console.log("=" .repeat(50));
    console.log("🎯 SUMMARY:");
    console.log(`Total tokens reported: ${src20Response.total}`);
    console.log(`Actual data length: ${Array.isArray(src20Response.data) ? src20Response.data.length : 'Not an array'}`);
    console.log(`Nested data length: ${Array.isArray((src20Response.data as any)?.data) ? (src20Response.data as any).data.length : 'Not nested or not an array'}`);
    console.log(`Enriched tokens: ${enrichedTokens.length}`);
    console.log(`Large limit data: ${Array.isArray(largeResponse.data) ? largeResponse.data.length : 'Not an array'}`);
    console.log(`No pagination data: ${Array.isArray(noPagResponse.data) ? noPagResponse.data.length : 'Not an array'}`);

  } catch (error) {
    console.error("❌ Error during debugging:", error);
    console.error("Stack:", error.stack);
  }
}

// Run the debug function
if (import.meta.main) {
  await debugSrc20WalletData();
}
