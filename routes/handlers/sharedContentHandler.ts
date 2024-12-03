import { StampController } from "$server/controller/stampController.ts";
import { RouteType } from "$server/services/cacheService.ts";
import { logger } from "$lib/utils/logger.ts";
import {
  getIdentifierType,
  isCpid,
  isTxHash,
} from "$lib/utils/identifierUtils.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";

function getStampBaseUrl(): string | undefined {
  if (Deno.env.get("DENO_ENV") === "development") {
    // In development, use the remote API URL
    return Deno.env.get("API_BASE_URL");
  }
  // In production, use relative path (undefined baseUrl)
  return undefined;
}

export async function handleContentRequest(
  identifier: string,
) {
  const isFullPath = identifier.includes(".");

  try {
    // Validate identifier based on path type
    if (!isFullPath) {
      const idType = getIdentifierType(identifier);
      const isValidId = isCpid(identifier) ||
        idType === "tx_hash" ||
        idType === "stamp_hash";

      if (!isValidId) {
        logger.debug("content", {
          message: "Invalid identifier",
          identifier,
          idType,
        });
        return ResponseUtil.stampNotFound();
      }
    } else {
      // Extract the base identifier without extension
      const [id] = identifier.split(".");
      if (!isTxHash(id)) {
        return ResponseUtil.stampNotFound();
      }
    }

    // Get the appropriate base URL based on environment
    const baseUrl = getStampBaseUrl();

    return await StampController.getStampFile(
      identifier,
      RouteType.STAMP_DETAIL,
      baseUrl,
      isFullPath,
    );
  } catch (error) {
    logger.error("content", {
      message: "Content handler error",
      identifier,
      error: error instanceof Error ? error.message : String(error),
    });
    return ResponseUtil.stampNotFound();
  }
}
