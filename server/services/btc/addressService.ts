import { getUTXOForAddress } from "$lib/utils/utxoUtils.ts";
import { formatSatoshisToBTC } from "$lib/utils/formatUtils.ts";

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
      const txInfo = await getUTXOForAddress(address);
      if (!txInfo?.utxo) return null;

      return {
        address,
        balance: Number(formatSatoshisToBTC(txInfo.utxo.value, { includeSymbol: false })),
        txCount: txInfo.utxo.status?.tx_count || 0,
        unconfirmedBalance: txInfo.utxo.status?.unconfirmed_balance || 0,
        unconfirmedTxCount: txInfo.utxo.status?.unconfirmed_tx_count || 0,
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
