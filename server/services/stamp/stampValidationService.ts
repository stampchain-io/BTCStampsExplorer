import { XcpManager } from "$server/services/xcpService.ts";
import { generateRandomNumber } from "$lib/utils/util.ts";

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
    const max_asset_id = 2 ** 64 - 1;
    const min_asset_id = 26 ** 12 + 1;
    let asset_name: string;
    let nameAvailable = false;
    const maxIterations = 100;
    
    for (let i = 0; i < maxIterations; i++) {
      asset_name = "A" + generateRandomNumber(min_asset_id - 8008, max_asset_id - 8008);
      nameAvailable = await this.checkAssetAvailability(asset_name);
      if (nameAvailable) break;
    }
    
    return asset_name!;
  }

  static async validateAndPrepareAssetName(assetName?: string): Promise<string> {
    if (!assetName) {
      return this.generateAvailableAssetName();
    }
  // FIXME: This will only allow named assets, not numeric to be defined.
  // FIXME: We need to check and validate the users address has XCP in the wallet for a cleaner error than 'insufficient funds'
  // FIXME: this should also likely check the qty on the issuance value


    const upperCaseAssetName = assetName.toUpperCase();

    if (upperCaseAssetName.length > 13) {
      throw new Error("Asset name must not exceed 13 characters.");
    }

    if (upperCaseAssetName.startsWith("A")) {
      throw new Error("Asset name must not start with 'A'.");
    }

    if (!/^[B-Z][A-Z]{0,12}$/.test(upperCaseAssetName)) {
      throw new Error(
        "Name must start with letters (B-Z), contain only uppercase letters (A-Z), and must not exceed 13 characters.",
      );
    }

    const isAvailable = await this.checkAssetAvailability(upperCaseAssetName);
    if (!isAvailable) {
      throw new Error("Asset name is not available.");
    }

    return upperCaseAssetName;
  }
}
