import { UTXOService as UTXOServiceClass } from "./utxoService.ts";
import { PSBTService } from "./psbtService.ts";

export { UTXOServiceClass as UTXOService, PSBTService };

export class TransactionService {
  static readonly utxoServiceInstance = new UTXOServiceClass();
  static readonly PSBTService = PSBTService;
}
