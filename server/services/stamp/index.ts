import { StampCreationService } from "$server/services/stamp/stampCreationService.ts";
import { StampValidationService } from "$server/services/stamp/stampValidationService.ts";

export { StampCreationService, StampValidationService };

export class StampService {
  static readonly MintService = StampCreationService;
  static readonly ValidationService = StampValidationService;
}
