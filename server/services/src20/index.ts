import { SRC20QueryService } from "./queryService.ts";
import { SRC20TransactionService } from "./transactionService.ts";
import { SRC20MarketService } from "./marketService.ts";
import { SRC20UtilityService } from "./utilityService.ts";
import { SRC20PSBTService } from "./psbt/src20PSBTService.ts";

// Export the services directly
export { 
  SRC20QueryService, 
  SRC20TransactionService, 
  SRC20MarketService,
  SRC20UtilityService,
  SRC20PSBTService
};

// Create a combined service class
export class SRC20Service {
  static readonly QueryService = SRC20QueryService;
  static readonly TransactionService = SRC20TransactionService;
  static readonly MarketService = SRC20MarketService;
  static readonly UtilityService = SRC20UtilityService;
  static readonly PSBTService = SRC20PSBTService;
}
