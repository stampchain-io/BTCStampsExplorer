import { Handlers } from "$fresh/server.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
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
      return ResponseUtil.badRequest("Address is required");
    }

    try {
      const creatorName = await CreatorService.getCreatorNameByAddress(address);

      if (!creatorName) {
        return ResponseUtil.notFound("Creator name not found");
      }

      return ResponseUtil.success({ creatorName });
    } catch (error) {
      return ResponseUtil.internalError(
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
        return ResponseUtil.badRequest("Missing required fields");
      }

      const result = await CreatorService.updateCreatorName({
        address,
        newName,
        signature,
        timestamp,
        csrfToken,
      });

      if (!result.success) {
        return ResponseUtil.badRequest(result.message || "Update failed");
      }

      return ResponseUtil.success({
        success: true,
        creatorName: result.creatorName,
      });
    } catch (error) {
      return ResponseUtil.internalError(
        error,
        "Error updating creator name",
      );
    }
  },
};
