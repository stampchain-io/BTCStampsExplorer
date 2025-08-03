import { SRC20QueryService } from "$server/services/src20/queryService.ts";
import { SRC20TransactionService } from "$server/services/src20/transactionService.ts";
import { SRC20MarketService } from "$server/services/src20/marketService.ts";
import { SRC20UtilityService } from "$server/services/src20/utilityService.ts";
import { SRC20PSBTService } from "$server/services/src20/psbt/src20PSBTService.ts";
import { SRC20OperationService } from "$server/services/src20/operations/src20Operations.ts";
import { SRC20CompressionService } from "$server/services/src20/compression/compressionService.ts";

// Create a combined service class
export class SRC20Service {
  static readonly QueryService = SRC20QueryService;
  static readonly TransactionService = SRC20TransactionService;
  static readonly MarketService = SRC20MarketService;
  static readonly UtilityService = SRC20UtilityService;
  static readonly PSBTService = SRC20PSBTService;
  // Multisig specific operations
  static readonly OperationService = SRC20OperationService;
  static readonly CompressionService = SRC20CompressionService;
}

// Export the SRC20 operation functions
export function mintSRC20(params: Parameters<typeof SRC20OperationService.mintSRC20>[0]) {
  return SRC20OperationService.mintSRC20(params);
}

export function deploySRC20(params: Parameters<typeof SRC20OperationService.deploySRC20>[0]) {
  return SRC20OperationService.deploySRC20(params);
}

export function transferSRC20(params: Parameters<typeof SRC20OperationService.transferSRC20>[0]) {
  return SRC20OperationService.transferSRC20(params);
}

export { 
  SRC20QueryService, 
  SRC20TransactionService, 
  SRC20MarketService,
  SRC20UtilityService,
  SRC20PSBTService,
  SRC20OperationService,
  SRC20CompressionService
};
