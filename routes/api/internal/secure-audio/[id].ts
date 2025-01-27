import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";
import { SecurityService } from "$server/services/security/securityService.ts";
import { AudioService } from "$server/services/audio/audioService.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    try {
      // Validate authentication
      const token = req.headers.get("x-csrf-token");
      if (!token || !(await SecurityService.validateCSRFToken(token))) {
        return ApiResponseUtil.unauthorized("Invalid or missing CSRF token");
      }

      const audioId = ctx.params.id;
      if (!audioId) {
        return ApiResponseUtil.badRequest("Audio ID is required");
      }

      // Get audio file from service
      const audioData = await AudioService.getAudioFile(audioId);
      if (!audioData) {
        return ApiResponseUtil.notFound("Audio file not found");
      }

      // Set streaming headers
      const headers = new Headers({
        "Content-Type": "audio/mpeg",
        "Content-Length": audioData.size.toString(),
        "Accept-Ranges": "bytes",
      });

      // Handle range requests for streaming
      const range = req.headers.get("range");
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : audioData.size - 1;
        const chunksize = (end - start) + 1;

        headers.set("Content-Range", `bytes ${start}-${end}/${audioData.size}`);
        headers.set("Content-Length", chunksize.toString());
        headers.set("Accept-Ranges", "bytes");

        return new Response(audioData.stream(start, end), {
          status: 206,
          headers,
        });
      }

      // Return full audio file if no range is requested
      return new Response(audioData.stream(), {
        status: 200,
        headers,
      });
    } catch (error) {
      console.error("Error streaming audio:", error);
      return ApiResponseUtil.internalError(error, "Error streaming audio file");
    }
  },
};
