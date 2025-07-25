import { createBitcoinTransactionBuilder, BitcoinTransactionBuilderImpl } from "./bitcoinTransactionBuilder.ts";
import { BitcoinUtxoManager } from "./bitcoinUtxoManager.ts";

export { 
  createBitcoinTransactionBuilder, 
  BitcoinTransactionBuilderImpl as BitcoinTransactionBuilder,
  BitcoinUtxoManager 
};

export class TransactionService {
  static readonly utxoServiceInstance = new BitcoinUtxoManager();
  static readonly createBitcoinTransactionBuilder = createBitcoinTransactionBuilder;
}
