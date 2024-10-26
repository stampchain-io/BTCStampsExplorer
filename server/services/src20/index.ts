import { SRC20QueryService } from "./queryService.ts";
import { SRC20TransactionService } from "./transactionService.ts";

// Export the services directly
export { SRC20QueryService, SRC20TransactionService };

// Create a combined service class
export class SRC20Service {
  static readonly QueryService = SRC20QueryService;
  static readonly TransactionService = SRC20TransactionService;
}
