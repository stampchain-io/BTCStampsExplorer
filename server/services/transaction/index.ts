import { createBitcoinTransactionBuilder, BitcoinTransactionBuilderImpl, BitcoinTransactionBuilder } from "$server/services/transaction/bitcoinTransactionBuilder.ts";
import { BitcoinUtxoManager } from "$server/services/transaction/bitcoinUtxoManager.ts";

export { 
  createBitcoinTransactionBuilder, 
  BitcoinTransactionBuilderImpl,
  BitcoinTransactionBuilder,
  BitcoinUtxoManager 
};

export class TransactionService {
  static readonly utxoServiceInstance = new BitcoinUtxoManager();
  static readonly createBitcoinTransactionBuilder = createBitcoinTransactionBuilder;
}
