import { XcpManager } from "$server/services/xcpService.ts";
import { generateRandomNumber } from "$lib/utils/numberUtils.ts";
import { isCpid } from "$lib/utils/identifierUtils.ts";

export class StampValidationService {
  static async checkAssetAvailability(assetName: string): Promise<boolean> {
    try {
      const result = await XcpManager.getAssetInfo(assetName);
      // If we get no result (null), the asset is available
      return result === null;
    } catch (error) {
      console.error(`Error checking asset availability for ${assetName}:`, error);
      // Only return false for non-404 errors
      return false;
    }
  }

  static async generateAvailableAssetName(): Promise<string> {
    const max_asset_id = 2n ** 64n - 1n;
    const min_asset_id = 26n ** 12n + 1n;
    let asset_name: string;
    let nameAvailable = false;
    const maxIterations = 100;
    
    for (let i = 0; i < maxIterations; i++) {
      // Convert to string after subtracting BigInts
      asset_name = "A" + (generateRandomNumber(
        Number(min_asset_id - 8008n), 
        Number(max_asset_id - 8008n)
      ));
      nameAvailable = await this.checkAssetAvailability(asset_name);
      if (nameAvailable) break;
    }
    
    return asset_name!;
  }

  static async validateAndPrepareAssetName(assetName?: string): Promise<string> {
    if (!assetName) {
      return this.generateAvailableAssetName();
    }

    // FIXME: We need to check and validate the users address has XCP in the wallet for a cleaner error than 'insufficient funds'
    // FIXME: this should also likely check the qty on the issuance value

    const upperCaseAssetName = assetName.toUpperCase();

    // Use the centralized CPID validation
    if (!isCpid(upperCaseAssetName)) {
      throw new Error(
        "Invalid asset name format. Must be either an A-prefixed numeric ID or a B-Z alphabetic name up to 13 characters."
      );
    }

    const isAvailable = await this.checkAssetAvailability(upperCaseAssetName);
    if (!isAvailable) {
      throw new Error("Asset name is not available.");
    }

    return upperCaseAssetName;
  }
}
