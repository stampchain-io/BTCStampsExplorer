import { Handlers } from "$fresh/server.ts";
import { saveFileToDatabase } from "$server/database/fileOperations.ts";
import { SRC20UtilityService } from "$server/services/src20/utilityService.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { validateFileUpload } from "$server/services/routeValidationService.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      const body = await req.json();

      // Validate file upload request
      const validation = validateFileUpload(body, {
        requiredFields: ["fileData", "tick"],
        maxSizeBytes: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/svg+xml",
        ],
      });

      if (!validation.isValid) {
        return validation.error!;
      }

      const { fileData, tick } = validation.data;

      // Remove the file mimetype prefix if present
      const base64Data = String(fileData).split(",").pop() || String(fileData);

      // Calculate tick_hash
      const tickHash = SRC20UtilityService.calculateTickHash(String(tick));

      // Save the file to the database
      const saved = await saveFileToDatabase(
        String(tick),
        tickHash,
        base64Data,
      );
      if (saved) {
        return ResponseUtil.success({ success: true });
      } else {
        return ResponseUtil.badRequest("Failed to save file");
      }
    } catch (error) {
      console.error("Error in upload-src20-background handler:", error);
      return ResponseUtil.internalError(error, "Error processing file upload");
    }
  },
};
