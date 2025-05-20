import { Handlers } from "$fresh/server.ts";
import { getRecommendedFees } from "$lib/utils/mempool.ts";
import { fetchBTCPriceInUSD } from "$lib/utils/balanceUtils.ts";

export const handler: Handlers = {
  async GET(req) {
    let debugData: any = null; // To store data for debugging
    try {
      const url = new URL(req.url);
      const [feesResponse, btcPrice] = await Promise.all([
        getRecommendedFees(),
        fetchBTCPriceInUSD(url.origin),
      ]);

      debugData = feesResponse; // Store for debugging output
      // Server-side log still useful if it works
      console.log(
        "[fees.ts] Full feesResponse from getRecommendedFees:",
        JSON.stringify(feesResponse),
      );

      let recommendedFee = 6; // Default fallback
      if (
        feesResponse && typeof feesResponse.fastestFee === "number" &&
        feesResponse.fastestFee >= 1
      ) {
        recommendedFee = feesResponse.fastestFee;
      } else if (
        feesResponse && typeof feesResponse.halfHourFee === "number" &&
        feesResponse.halfHourFee >= 1
      ) {
        // As an alternative fallback, consider halfHourFee if fastest is too low or invalid
        recommendedFee = feesResponse.halfHourFee;
        console.log(
          `[fees.ts] Using halfHourFee (${recommendedFee}) as fastestFee was not suitable.`,
        );
      } else {
        console.log(
          `[fees.ts] feesResponse.fastestFee was not suitable, using default fallback: ${recommendedFee}. Response: ${
            JSON.stringify(feesResponse)
          }`,
        );
      }

      return Response.json({
        recommendedFee,
        btcPrice: btcPrice || 0,
        debug_feesResponse: debugData ??
          "Error: feesResponse was null or undefined before sending to client", // Add for client-side inspection
      });
    } catch (error) {
      console.error("Fees API error:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : "Unknown error occurred";
      return Response.json({
        recommendedFee: 1, // Ensure at least 1 on error
        btcPrice: 0,
        debug_feesResponse: {
          error: errorMessage,
          note: "Error occurred during fees API processing",
        }, // Add error info for client
      }, { status: 500 });
    }
  },
};
