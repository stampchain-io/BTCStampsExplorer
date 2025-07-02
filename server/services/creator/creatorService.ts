import { StampController } from "$server/controller/stampController.ts";
import { verifySignature } from "$lib/utils/cryptoUtils.ts";
import { SecurityService } from "$server/services/security/securityService.ts";

export class CreatorService {
  static async getCreatorNameByAddress(address: string): Promise<string | null> {
    try {
      return await StampController.getCreatorNameByAddress(address);
    } catch (error) {
      console.error("Error in CreatorService.getCreatorNameByAddress:", error);
      return null;
    }
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