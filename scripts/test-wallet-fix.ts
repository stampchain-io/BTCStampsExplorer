#!/usr/bin/env -S deno run --allow-net

/**
 * Quick test to verify the wallet SRC-20 fix
 */

const TEST_ADDRESS = "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m";

console.log("🧪 Testing wallet SRC-20 fix...");

try {
  // Test production wallet page
  const response = await fetch(`https://stampchain.io/wallet/${TEST_ADDRESS}`);
  const html = await response.text();

  // Check for "NO TOKENS IN THE WALLET" message
  const hasNoTokensMessage = html.includes("NO TOKENS IN THE WALLET");
  const hasTokenData = html.includes("SRC-20") && html.includes("doge");

  console.log("📊 Results:");
  console.log(`- Has "NO TOKENS" message: ${hasNoTokensMessage}`);
  console.log(`- Has token data: ${hasTokenData}`);
  console.log(`- Fix successful: ${!hasNoTokensMessage && hasTokenData}`);

  if (!hasNoTokensMessage && hasTokenData) {
    console.log("✅ Fix verified! SRC-20 tokens are now displaying correctly.");
  } else {
    console.log("❌ Issue may still exist. Check deployment.");
  }

} catch (error) {
  console.error("❌ Test failed:", error);
}
