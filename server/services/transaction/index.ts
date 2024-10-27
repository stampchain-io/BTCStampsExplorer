import { UTXOService } from "./utxoService.ts";
import { PSBTService } from "./psbtService.ts";

export { UTXOService, PSBTService };

export class TransactionService {
  static readonly UTXOService = UTXOService;
  static readonly PSBTService = PSBTService;
}
