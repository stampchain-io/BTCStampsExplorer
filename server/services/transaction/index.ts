import { BitcoinTransactionBuilder } from "./bitcoinTransactionBuilder.ts";
import { UTXOService as UTXOServiceClass } from "./utxoService.ts";

export { BitcoinTransactionBuilder, UTXOServiceClass as UTXOService };

export class TransactionService {
  static readonly utxoServiceInstance = new UTXOServiceClass();
  static readonly BitcoinTransactionBuilder = BitcoinTransactionBuilder;
}
