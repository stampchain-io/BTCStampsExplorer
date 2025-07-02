import { COINGECKO_API_BASE_URL } from "$lib/utils/constants.ts";

async function fetchRealApiResponses() {
  console.log("🚀 Fetching real API responses for BTC price fixtures...\n");

  const fixtures: any = {
    generatedAt: new Date().toISOString(),
    responses: {},
  };

  // Fetch from CoinGecko
  try {
    console.log("Fetching from CoinGecko...");
    const cgResponse = await fetch(
      `${COINGECKO_API_BASE_URL}/simple/price?ids=bitcoin&vs_currencies=usd`,
    );

    if (cgResponse.ok) {
      const cgData = await cgResponse.json();
      fixtures.responses.coingecko = {
        success: {
          status: 200,
          data: cgData,
          headers: Object.fromEntries(cgResponse.headers.entries()),
        },
      };
      console.log(`✅ CoinGecko price: $${cgData.bitcoin.usd}`);
    }

    // Also capture rate limit response structure (without actually hitting rate limit)
    fixtures.responses.coingecko.rateLimit = {
      status: 429,
      statusText: "Too Many Requests",
      headers: {
        "content-type": "application/json",
        "x-ratelimit-limit": "30",
        "x-ratelimit-remaining": "0",
        "x-ratelimit-reset": String(Date.now() + 60000),
      },
      body: { error: "Rate limit exceeded" },
    };
  } catch (error) {
    console.error("CoinGecko error:", error);
    fixtures.responses.coingecko = { error: error.message };
  }

  // Fetch from Binance
  try {
    console.log("\nFetching from Binance...");
    const binanceResponse = await fetch(
      "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT",
    );

    if (binanceResponse.ok) {
      const binanceData = await binanceResponse.json();
      fixtures.responses.binance = {
        success: {
          status: 200,
          data: binanceData,
          headers: Object.fromEntries(binanceResponse.headers.entries()),
        },
      };
      console.log(`✅ Binance price: $${binanceData.price}`);
    }

    // Also capture rate limit response structure
    fixtures.responses.binance.rateLimit = {
      status: 429,
      statusText: "Too Many Requests",
      headers: {
        "content-type": "application/json",
        "x-mbx-used-weight": "1200",
        "x-mbx-used-weight-1m": "1200",
        "retry-after": "60",
      },
      body: { code: -1003, msg: "Too many requests." },
    };
  } catch (error) {
    console.error("Binance error:", error);
    fixtures.responses.binance = { error: error.message };
  }

  // Add error response examples
  fixtures.responses.errors = {
    serverError: {
      status: 500,
      statusText: "Internal Server Error",
      body: "Server error",
    },
    networkError: {
      message: "Network request failed",
      code: "ECONNREFUSED",
    },
    invalidJson: {
      status: 200,
      body: "invalid json response {",
    },
  };

  // Save fixtures
  const outputPath = "./tests/fixtures/btcPriceApiResponses.json";
  await Deno.writeTextFile(outputPath, JSON.stringify(fixtures, null, 2));

  console.log(`\n✨ API response fixtures saved to ${outputPath}`);

  // Also update the btcPriceFixture in marketDataFixtures.ts if prices differ significantly
  if (fixtures.responses.coingecko?.success?.data?.bitcoin?.usd) {
    const currentPrice = fixtures.responses.coingecko.success.data.bitcoin.usd;
    console.log(`\nNote: Current BTC price is $${currentPrice}`);
    console.log("The test fixture uses $100,000 for consistent testing.");
  }
}

// Run the script
if (import.meta.main) {
  await fetchRealApiResponses();
}
