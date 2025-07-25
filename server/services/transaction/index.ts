import { BitcoinTransactionBuilder } from "./bitcoinTransactionBuilder.ts";
import { BitcoinUtxoManager } from "./bitcoinUtxoManager.ts";

export { BitcoinTransactionBuilder, BitcoinUtxoManager };

export class TransactionService {
  static readonly utxoServiceInstance = new BitcoinUtxoManager();
  static readonly BitcoinTransactionBuilder = BitcoinTransactionBuilder;
}
