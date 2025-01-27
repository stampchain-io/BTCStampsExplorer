import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";
import { SecurityService } from "$server/services/security/securityService.ts";
import { AudioService } from "$server/services/audio/audioService.ts";
import { customAlphabet } from "npm:nanoid";

const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  21,
);

export const handler: Handlers = {
  async POST(req) {
    try {
      // Validate authentication
      const token = req.headers.get("x-csrf-token");
      if (!token || !(await SecurityService.validateCSRFToken(token))) {
        return ApiResponseUtil.unauthorized("Invalid or missing CSRF token");
      }

      // Parse multipart form data
      const formData = await req.formData();
      const audioFile = formData.get("audio") as File;

      if (!audioFile) {
        return ApiResponseUtil.badRequest("No audio file provided");
      }

      // Validate file type
      if (!audioFile.type.startsWith("audio/")) {
        return ApiResponseUtil.badRequest(
          "Invalid file type. Only audio files are allowed.",
        );
      }

      // Generate unique ID for the audio file
      const audioId = nanoid();

      // Convert file to Uint8Array
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioData = new Uint8Array(arrayBuffer);

      // Save to database
      const success = await AudioService.saveAudioFile(audioId, audioData);

      if (!success) {
        return ApiResponseUtil.internalError(
          new Error("Failed to save audio file"),
          "Failed to save audio file",
        );
      }

      return ApiResponseUtil.success({
        id: audioId,
        size: audioData.length,
      });
    } catch (error) {
      console.error("Error uploading audio:", error);
      return ApiResponseUtil.internalError(error, "Error uploading audio file");
    }
  },
};
