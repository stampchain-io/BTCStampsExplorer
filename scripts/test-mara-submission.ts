#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read

/**
 * Test script for MARA pool submission
 * Tests the API endpoints and transaction submission flow
 */

import { logger } from "$lib/utils/logger.ts";

// Test configuration
const MARA_API_BASE = "https://slipstream.mara.com/rest-api";
const TEST_ENDPOINTS = {
  getinfo: `${MARA_API_BASE}/getinfo`,
  submit: `${MARA_API_BASE}/submit-tx`,
};

// Sample test transaction hex (this is a dummy hex for testing)
const TEST_TX_HEX = "020000000001010000000000000000000000000000000000000000000000000000000000000000ffffffff0503e8030000ffffffff020000000000000000266a24aa21a9ede2f61c3f71d1defd3fa999dfa36953755c690689799962b48bebd836974e8cf90120000000000000000000000000000000000000000000000000000000000000000000000000";

async function testMaraGetInfo() {
  console.log("\n🔍 Testing MARA /getinfo endpoint...");
  
  try {
    const response = await fetch(TEST_ENDPOINTS.getinfo, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    console.log(`Response status: ${response.status} ${response.statusText}`);
    console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log("Response data:", JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log("✅ /getinfo endpoint working correctly");
      return data;
    } else {
      console.error("❌ /getinfo endpoint returned error");
    }
  } catch (error) {
    console.error("❌ Failed to call /getinfo:", error);
  }
}

async function testMaraSubmit(hex: string = TEST_TX_HEX) {
  console.log("\n🔍 Testing MARA /submit-tx endpoint...");
  
  const requestBody = {
    hex: hex,
    priority: "high"
  };

  console.log("Request body:", JSON.stringify(requestBody, null, 2));
  console.log("Hex length:", hex.length);

  try {
    const response = await fetch(TEST_ENDPOINTS.submit, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`Response status: ${response.status} ${response.statusText}`);
    console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log("Raw response:", responseText);

    try {
      const data = JSON.parse(responseText);
      console.log("Parsed response:", JSON.stringify(data, null, 2));
      
      if (response.ok) {
        console.log("✅ Transaction submitted successfully");
        console.log("Transaction ID:", data.txid);
      } else {
        console.error("❌ Transaction submission failed");
        console.error("Error message:", data.message || data.error);
      }
    } catch (parseError) {
      console.error("Failed to parse response as JSON:", parseError);
      console.log("Response was:", responseText);
    }
  } catch (error) {
    console.error("❌ Failed to call /tx/submit:", error);
  }
}

async function testInternalEndpoint() {
  console.log("\n🔍 Testing internal /api/internal/mara-submit endpoint...");
  
  // First check if MARA is enabled
  const maraEnabled = Deno.env.get("ENABLE_MARA_INTEGRATION") === "1";
  console.log("MARA integration enabled:", maraEnabled);
  
  if (!maraEnabled) {
    console.log("⚠️  MARA integration is disabled. Set ENABLE_MARA_INTEGRATION=1 to test.");
    return;
  }

  const internalUrl = "http://localhost:8000/api/internal/mara-submit";
  const requestBody = {
    hex: TEST_TX_HEX,
    priority: "high",
    txid: "test-stamp-123"
  };

  try {
    const response = await fetch(internalUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    console.log("Response data:", JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log("✅ Internal endpoint working correctly");
    } else {
      console.error("❌ Internal endpoint returned error");
    }
  } catch (error) {
    console.error("❌ Failed to call internal endpoint:", error);
    console.log("Make sure the server is running on localhost:8000");
  }
}

// Main execution
async function main() {
  console.log("🚀 MARA Submission Test Script");
  console.log("================================");
  
  // Test MARA API directly
  const maraInfo = await testMaraGetInfo();
  
  // Only test submission if getinfo works
  if (maraInfo && maraInfo.fee_rate) {
    await testMaraSubmit();
  }
  
  // Test internal endpoint
  await testInternalEndpoint();
  
  console.log("\n✅ Test completed");
}

// Run with command line argument for custom hex
if (Deno.args.length > 0) {
  const customHex = Deno.args[0];
  console.log("Using custom transaction hex from command line");
  TEST_TX_HEX = customHex;
}

await main();