import { Handlers } from "$fresh/server.ts";
import { serverConfig } from "$server/config/config.ts";
import { QuicknodeService } from "$server/services/quicknode/quicknodeService.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";

const DONATE_ADDRESS = "bc1qe5sz3mt4a3e57n8e39pprval4qe0xdrkzew203";
const SATS_PER_BTC = 100000000;

async function getBTCPrice(): Promise<number> {
  const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
  const data = await response.json();
  return data.bitcoin.usd;
}

export const handler: Handlers = {
  async GET(_req: Request, _ctx) {
    try {
      // Calculate timestamp for 30 days ago
      const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);

      // Fetch transactions using QuicknodeService
      const txData = await QuicknodeService.fetchQuicknode("getaddresstxs", [
        DONATE_ADDRESS,
        { "startTime": thirtyDaysAgo }
      ]);

      if (!txData?.result?.txs) {
        return ResponseUtil.json({
          error: "Failed to fetch transaction data"
        }, { status: 500 });
      }

      // Calculate total sats received
      const totalSats = txData.result.txs.reduce((sum, tx) => sum + (tx.value * SATS_PER_BTC), 0);

      // Get current BTC price and calculate USD value
      const btcPrice = await getBTCPrice();
      const btcAmount = totalSats / SATS_PER_BTC;
      const usdAmount = btcAmount * btcPrice;

      return ResponseUtil.json({
        monthly_donations_sats: totalSats,
        monthly_donations_usd: usdAmount.toFixed(2)
      });
    } catch (error) {
      console.error("Error fetching monthly donations:", error);
      return ResponseUtil.json({
        error: "Failed to fetch monthly donations",
        details: error.message
      }, { status: 500 });
    }
  }
};
