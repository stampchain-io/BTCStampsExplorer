import { getUTXOForAddress } from "$lib/utils/utxoUtils.ts";

interface BTCAddressInfo {
  address: string;
  balance: number;
  txCount: number;
  unconfirmedBalance: number;
  unconfirmedTxCount: number;
  fee_per_vbyte?: number;
}

export class BTCAddressService {
  static async getAddressInfo(address: string): Promise<BTCAddressInfo | null> {
    try {
      // Use getUTXOForAddress with mempool.space as first fallback
      const txInfo = await getUTXOForAddress(address, undefined, undefined, true);
      if (!txInfo?.utxo) return null;

      // Extract data from the mempool.space response (first endpoint)
      const mempoolData = txInfo.utxo.status || {};
      
      return {
        address,
        balance: txInfo.utxo.value / 100000000, // Convert to BTC
        txCount: mempoolData.tx_count || 0,
        unconfirmedBalance: mempoolData.unconfirmed_balance || 0,
        unconfirmedTxCount: mempoolData.unconfirmed_tx_count || 0,
        fee_per_vbyte: txInfo.ancestor?.effectiveRate
      };
    } catch (error) {
      console.error("Error fetching address info:", error);
      return null;
    }
  }

  static async getBalance(address: string): Promise<number> {
    try {
      const info = await this.getAddressInfo(address);
      return info?.balance || 0;
    } catch (error) {
      console.error("Error fetching BTC balance:", error);
      return 0;
    }
  }

}
