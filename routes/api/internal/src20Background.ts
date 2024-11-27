import { Handlers } from "$fresh/server.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { FileUploadService } from "$server/services/file/uploadService.ts";
import { InternalRouteGuard } from "$server/services/security/internalRouteGuard.ts";

export const handler: Handlers = {
  async POST(req) {
    // Check CSRF and origin
    const csrfError = await InternalRouteGuard.requireCSRF(req);
    if (csrfError) return csrfError;

    const originError = await InternalRouteGuard.requireTrustedOrigin(req);
    if (originError) return originError;

    try {
      const { fileData, tick, csrfToken } = await req.json();

      if (!fileData || !tick || !csrfToken) {
        return ResponseUtil.badRequest("Missing required fields");
      }

      const result = await FileUploadService.uploadSRC20Background({
        fileData,
        tick,
        csrfToken,
      });

      if (!result.success) {
        return ResponseUtil.badRequest(result.message);
      }

      return ResponseUtil.success(result);
    } catch (error) {
      return ResponseUtil.internalError(error, "Error processing file upload");
    }
  },
};
