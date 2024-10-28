import { SRC20QueryService } from "./queryService.ts";
import { SRC20TransactionService } from "./transactionService.ts";
import { SRC20MarketService } from "./marketService.ts";
import { SRC20UtilityService } from "./utilityService.ts";
import { SRC20PSBTService } from "./psbt/src20PSBTService.ts";
import { SRC20OperationService } from "./operations/src20Operations.ts";
import { SRC20CompressionService } from "./compression/compressionService.ts";

// Export the services directly
export { 
  SRC20QueryService, 
  SRC20TransactionService, 
  SRC20MarketService,
  SRC20UtilityService,
  SRC20PSBTService,
  SRC20OperationService,
  SRC20CompressionService
};

// Create a combined service class
export class SRC20Service {
  static readonly QueryService = SRC20QueryService;
  static readonly TransactionService = SRC20TransactionService;
  static readonly MarketService = SRC20MarketService;
  static readonly UtilityService = SRC20UtilityService;
  static readonly PSBTService = SRC20PSBTService;
  static readonly OperationService = SRC20OperationService;
  static readonly CompressionService = SRC20CompressionService;
}
