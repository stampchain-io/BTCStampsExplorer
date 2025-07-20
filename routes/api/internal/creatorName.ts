import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";
import { CreatorService } from "$server/services/creator/creatorService.ts";
import { InternalRouteGuard } from "$server/services/security/internalRouteGuard.ts";

export const handler: Handlers = {
  async GET(req) {
    // GET requests need origin check but not CSRF
    const originError = await InternalRouteGuard.requireTrustedOrigin(req);
    if (originError) return originError;

    const url = new URL(req.url);
    const address = url.searchParams.get("address");

    if (!address) {
      return ApiResponseUtil.badRequest("Address is required");
    }

    try {
      const creatorName = await CreatorService.getCreatorNameByAddress(address);

      if (!creatorName) {
        return ApiResponseUtil.notFound("Creator name not found");
      }

      return ApiResponseUtil.success({ creatorName });
    } catch (error) {
      return ApiResponseUtil.internalError(
        error,
        "Error fetching creator name",
      );
    }
  },

  async POST(req) {
    // Check CSRF and origin
    const csrfError = await InternalRouteGuard.requireCSRF(req);
    if (csrfError) return csrfError;

    const originError = await InternalRouteGuard.requireTrustedOrigin(req);
    if (originError) return originError;

    // Check signature for wallet ownership
    const signatureError = await InternalRouteGuard.requireSignature(req);
    if (signatureError) return signatureError;

    try {
      const { address, newName, signature, timestamp, csrfToken } = await req
        .json();

      if (!address || !newName || !signature || !timestamp || !csrfToken) {
        return ApiResponseUtil.badRequest("Missing required fields");
      }

      const result = await CreatorService.updateCreatorName({
        address,
        newName,
        signature,
        timestamp,
        csrfToken,
      });

      if (!result.success) {
        return ApiResponseUtil.badRequest(result.message || "Update failed");
      }

      return ApiResponseUtil.success({
        success: true,
        creatorName: result.creatorName,
      });
    } catch (error) {
      return ApiResponseUtil.internalError(
        error,
        "Error updating creator name",
      );
    }
  },
};
