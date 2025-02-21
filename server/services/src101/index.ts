import { SRC101QueryService } from "./queryService.ts";
import { SRC101TransactionService } from "./transactionService.ts";
import { SRC101UtilityService } from "./utilityService.ts";
import { SRC101MultisigPSBTService } from "./psbt/src101MultisigPSBTService.ts";
import { SRC101OperationService } from "./operations/src101Operations.ts";
import { SRC101CompressionService } from "./compression/compressionService.ts";
import { SRC101PSBTService } from "./psbt/src101PSBTService.ts";

// Create a combined service class  
export class SRC101Service {
  static readonly QueryService = SRC101QueryService;
  static readonly TransactionService = SRC101TransactionService;
  static readonly UtilityService = SRC101UtilityService;
  static readonly MultisigPSBTService = SRC101MultisigPSBTService;
  static readonly OperationService = SRC101OperationService;
  static readonly CompressionService = SRC101CompressionService;
  static readonly PSBTService = SRC101PSBTService;
}

// Export the SRC20 operation functions
export function mintSRC101(params: Parameters<typeof SRC101OperationService.mintSRC101>[0]) {
  return SRC101OperationService.mintSRC101(params);
}

export function deploySRC101(params: Parameters<typeof SRC101OperationService.deploySRC101>[0]) {
  return SRC101OperationService.deploySRC101(params);
}

export function transferSRC101(params: Parameters<typeof SRC101OperationService.transferSRC101>[0]) {
  return SRC101OperationService.transferSRC101(params);
}

export function setrecordSRC101(params: Parameters<typeof SRC101OperationService.setrecordSRC101>[0]) {
  return SRC101OperationService.setrecordSRC101(params);
}

export function renewSRC101(params: Parameters<typeof SRC101OperationService.renewSRC101>[0]) {
  return SRC101OperationService.renewSRC101(params);
}

export { 
  SRC101QueryService, 
  SRC101UtilityService,
  SRC101OperationService,
  SRC101CompressionService
};
