import { StampCreationService } from "./stampCreationService.ts";
import { StampValidationService } from "./stampValidationService.ts";

export { StampCreationService, StampValidationService };

export class StampService {
  static readonly MintService = StampCreationService;
  static readonly ValidationService = StampValidationService;
}
