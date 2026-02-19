import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";
import { CreatorService } from "$server/services/creator/creatorService.ts";
import { InternalApiFrontendGuard } from "$server/services/security/internalApiFrontendGuard.ts";
import { InternalRouteGuard } from "$server/services/security/internalRouteGuard.ts";

export const handler: Handlers = {
  async GET(req) {
    // GET requests need origin check but not CSRF
    const originError = await InternalApiFrontendGuard.requireInternalAccess(
      req,
    );
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
    // Clone request before any guards to preserve body stream
    const reqClone = req.clone();

    // Check CSRF (reads from headers only) and origin
    const csrfError = await InternalRouteGuard.requireCSRF(req);
    if (csrfError) return csrfError;

    const originError = await InternalApiFrontendGuard.requireInternalAccess(
      req,
    );
    if (originError) return originError;

    try {
      const body = await reqClone.json();
      const { address, newName, signature, timestamp, csrfToken } = body;

      if (!address || !newName || !signature || !timestamp || !csrfToken) {
        const missing = [
          !address && "address",
          !newName && "newName",
          !signature && "signature",
          !timestamp && "timestamp",
          !csrfToken && "csrfToken",
        ].filter(Boolean);
        console.error(
          `[CreatorName] Missing fields: ${missing.join(", ")}. ` +
            `Body keys: ${Object.keys(body).join(", ") || "(empty)"}`,
        );
        return ApiResponseUtil.badRequest(
          `Missing required fields: ${missing.join(", ")}`,
        );
      }

      // Validate creator name early (before crypto operations)
      const validation = CreatorService.validateCreatorName(newName);
      if (!validation.valid) {
        return ApiResponseUtil.badRequest(
          validation.message || "Invalid creator name",
        );
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
      console.error("[CreatorName] Error processing request:", error);
      return ApiResponseUtil.internalError(
        error,
        "Error updating creator name",
      );
    }
  },
};
