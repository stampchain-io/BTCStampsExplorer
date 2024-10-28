import { StampMintService } from "./stampMintService.ts";
import { StampValidationService } from "./stampValidationService.ts";

export { StampMintService, StampValidationService };

export class StampService {
  static readonly MintService = StampMintService;
  static readonly ValidationService = StampValidationService;
}
