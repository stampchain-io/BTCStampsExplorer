import { saveFileToDatabase } from "$server/database/fileOperations.ts";
import { SRC20BackgroundUpload, SRC20BackgroundUploadResult } from "$lib/types/src20.ts";
import { SecurityService } from "$server/services/security/securityService.ts";
import { SRC20UtilityService } from "$server/services/src20/utilityService.ts";
import { logger } from "$lib/utils/logger.ts";

export class FileUploadService {
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/svg+xml",
    "image/webp",
    "image/avif",
  ];

  static async uploadSRC20Background(
    params: SRC20BackgroundUpload & { csrfToken: string }
  ): Promise<SRC20BackgroundUploadResult> {
    try {
      // Validate input presence
      if (!params.fileData || !params.tick) {
        return {
          success: false,
          message: "Missing required fields",
        };
      }

      // Validate CSRF token
      const isValidCSRF = await SecurityService.validateCSRFToken(params.csrfToken);
      if (!isValidCSRF) {
        logger.error("stamps", {
          message: "CSRF validation failed in upload service",
          tick: params.tick,
          tokenLength: params.csrfToken?.length,
        });
        return { 
          success: false, 
          message: "Invalid CSRF token" 
        };
      }

      // Validate tick format
      if (!/^[A-Z0-9]{1,5}$/.test(params.tick)) {
        return {
          success: false,
          message: "Invalid tick format",
        };
      }

      // Process file data - handle both raw base64 and data URL formats
      const base64Data = params.fileData.includes('base64,') 
        ? params.fileData.split('base64,')[1]
        : params.fileData;

      // Validate base64 format
      if (!base64Data.match(/^[A-Za-z0-9+/]+=*$/)) {
        return {
          success: false,
          message: "Invalid image data format",
        };
      }

      // Validate file size
      const sizeInBytes = (base64Data.length * 3) / 4;
      if (sizeInBytes > this.MAX_FILE_SIZE) {
        return {
          success: false,
          message: `File size exceeds maximum limit of ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`,
        };
      }

      // Calculate tick hash and save to database
      const tickHash = SRC20UtilityService.calculateTickHash(String(params.tick));
      const saved = await saveFileToDatabase(
        String(params.tick),
        tickHash,
        base64Data
      );

      if (!saved) {
        return {
          success: false,
          message: "Failed to save image to database",
        };
      }

      return {
        success: true,
        message: "File uploaded successfully",
        url: `/backgrounds/${params.tick}.webp`,
      };
    } catch (error) {
      logger.error("stamps", {
        message: "Error in uploadSRC20Background",
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }
} 