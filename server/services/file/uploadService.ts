import { saveFileToDatabase } from "$server/database/fileOperations.ts";
import { SecurityService } from "$server/services/security/securityService.ts";

export class FileUploadService {
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/svg+xml",
  ];

  static async uploadSRC20Background(params: {
    fileData: string;
    tick: string;
    csrfToken: string;
  }) {
    try {
      // Validate CSRF token
      const isValidCSRF = await SecurityService.validateCSRFToken(params.csrfToken);
      if (!isValidCSRF) {
        return { success: false, message: "Invalid CSRF token" };
      }

      // Validate file
      const validation = this.validateFile(params.fileData);
      if (!validation.isValid) {
        return { success: false, message: validation.error };
      }

      // Process file data
      const base64Data = String(params.fileData).split(",").pop() || String(params.fileData);
      const tickHash = SRC20UtilityService.calculateTickHash(String(params.tick));

      // Save to database
      const saved = await saveFileToDatabase(
        String(params.tick),
        tickHash,
        base64Data,
      );

      return {
        success: saved,
        message: saved ? "File uploaded successfully" : "Failed to save file",
      };
    } catch (error) {
      console.error("Error in uploadSRC20Background:", error);
      return { success: false, message: "Failed to process file upload" };
    }
  }

  private static validateFile(fileData: string) {
    // Add file validation logic here
    // Check size, mime type, etc.
    return { isValid: true };
  }
} 