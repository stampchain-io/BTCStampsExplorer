import { verifySignature } from "$lib/utils/cryptoUtils.ts";
import { StampController } from "$server/controller/stampController.ts";
import { SecurityService } from "$server/services/security/securityService.ts";
import { SRC101Service } from "$server/services/src101/index.ts";
import { StampService } from "$server/services/stampService.ts";

export class CreatorService {
  static async getCreatorNameByAddress(address: string): Promise<string | null> {
    try {
      // 1. First check the creators table
      const creatorName = await StampService.getCreatorNameByAddress(address);
      if (creatorName) {
        return creatorName;
      }

      // 2. If not found in creators table, check for PRI bitname domain
      const primaryDomain = await SRC101Service.QueryService.getPrimaryDomainForAddress(address);
      if (primaryDomain) {
        return `${primaryDomain}.btc`;
      }

      // 3. Fall back to null (which will display as ANONYMOUS)
      return null;
    } catch (error) {
      console.error("Error getting creator name by address:", error);
      return null;
    }
  }

  /**
   * Enriches stamp data with enhanced creator names using 3-tier fallback
   * @param stamps - Array of stamp objects with creator and creator_name fields
   * @returns Promise<Array> - Stamps with enhanced creator_name fields
   */
  static async enrichStampsWithCreatorNames(stamps: any[]): Promise<any[]> {
    if (!stamps || stamps.length === 0) {
      return stamps;
    }

    // Get unique creator addresses that don't have creator_name
    const creatorsNeedingEnhancement = new Set<string>();

    for (const stamp of stamps) {
      if (stamp.creator && !stamp.creator_name) {
        creatorsNeedingEnhancement.add(stamp.creator);
      }
    }

    // If no creators need enhancement, return original stamps
    if (creatorsNeedingEnhancement.size === 0) {
      return stamps;
    }

    // Get enhanced creator names for all addresses that need it
    const enhancedCreatorNames = new Map<string, string>();

    for (const creatorAddress of creatorsNeedingEnhancement) {
      try {
        const enhancedName = await this.getCreatorNameByAddress(creatorAddress);
        if (enhancedName) {
          enhancedCreatorNames.set(creatorAddress, enhancedName);
        }
      } catch (error) {
        console.error(`Error getting enhanced creator name for ${creatorAddress}:`, error);
      }
    }

    // Enrich the stamps with enhanced creator names
    return stamps.map(stamp => {
      if (stamp.creator && !stamp.creator_name) {
        const enhancedName = enhancedCreatorNames.get(stamp.creator);
        if (enhancedName) {
          return {
            ...stamp,
            creator_name: enhancedName
          };
        }
      }
      return stamp;
    });
  }

  static async updateCreatorName(params: {
    address: string;
    newName: string;
    signature: string;
    timestamp: string;
    csrfToken: string;
  }): Promise<{ success: boolean; creatorName?: string; message?: string }> {
    try {
      // Verify CSRF token first
      const isValidCSRF = await SecurityService.validateCSRFToken(params.csrfToken);
      if (!isValidCSRF) {
        return { success: false, message: "Invalid CSRF token" };
      }

      // Verify signature
      const message = `Update creator name to ${params.newName} at ${params.timestamp}`;
      const isValidSignature = verifySignature(message, params.signature, params.address);
      if (!isValidSignature) {
        return { success: false, message: "Invalid signature" };
      }

      // Check timestamp (5 minutes)
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      if (parseInt(params.timestamp) < fiveMinutesAgo) {
        return { success: false, message: "Signature expired" };
      }

      // Update the name
      const updated = await StampController.updateCreatorName(params.address, params.newName);
      if (!updated) {
        return { success: false, message: "Failed to update creator name" };
      }

      return { success: true, creatorName: params.newName };
    } catch (error) {
      console.error("Error in CreatorService.updateCreatorName:", error);
      return { success: false, message: "Failed to update creator name" };
    }
  }
}
