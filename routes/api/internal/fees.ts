import { Handlers } from "$fresh/server.ts";
import { getRecommendedFees } from "$lib/utils/mempool.ts";
import { fetchBTCPriceInUSD } from "$lib/utils/balanceUtils.ts";

export const handler: Handlers = {
  async GET(req) {
    try {
      const url = new URL(req.url);
      const [feesResponse, btcPrice] = await Promise.all([
        getRecommendedFees(),
        fetchBTCPriceInUSD(url.origin),
      ]);

      const recommendedFee = feesResponse?.fastestFee ?? 6;

      return Response.json({
        recommendedFee,
        btcPrice: btcPrice || 0,
      });
    } catch (error) {
      console.error("Fees API error:", error);
      return Response.json({
        recommendedFee: 0,
        btcPrice: 0,
      }, { status: 500 });
    }
  },
};
