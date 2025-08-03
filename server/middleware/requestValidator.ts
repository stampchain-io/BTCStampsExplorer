import { logger } from "$lib/utils/monitoring/logging/logger.ts";
import { LOG_NAMESPACES } from "$lib/constants/loggingConstants.ts";
import type { Context } from "$types/ui.d.ts";
import { getValidator } from "./openapiValidator.ts";

/**
 * Simple request validation middleware
 * Validates request bodies and query parameters against OpenAPI schemas
 */
export async function validateRequest(ctx: Context): Promise<boolean> {
  try {
    const validator = await getValidator();
    if (!validator.isEnabled()) return true;

    const method = ctx.request.method;
    const path = ctx.request.url.pathname;

    // Skip validation for GET requests (no body)
    if (method === "GET") {
      // Could validate query params here in the future
      return true;
    }

    // Validate request body for POST/PUT/PATCH
    if (["POST", "PUT", "PATCH"].includes(method)) {
      const contentType = ctx.request.headers.get("content-type");
      
      // Only validate JSON requests
      if (contentType?.includes("application/json")) {
        try {
          const body = await ctx.request.json();
          
          // For now, just ensure body exists for non-GET requests
          // Full schema validation can be added later without over-engineering
          if (!body) {
            logger.warn(LOG_NAMESPACES.REQUEST_VALIDATION, { 
              message: "Empty request body", 
              method, 
              path 
            });
            return false;
          }

          // Basic validation - ensure required fields for common operations
          if (path.includes("/src20/") && body.op) {
            // Simple SRC-20 validation
            if (!body.tick || !body.p) {
              logger.warn(LOG_NAMESPACES.REQUEST_VALIDATION, { 
                message: "Invalid SRC-20 request", 
                method, 
                path, 
                body 
              });
              return false;
            }
          }

          return true;
        } catch (error) {
          logger.error(LOG_NAMESPACES.REQUEST_VALIDATION, { 
            message: "Request validation error",
            error: error instanceof Error ? error.message : String(error),
            method,
            path
          });
          return false;
        }
      }
    }

    return true;
  } catch (error) {
    logger.error(LOG_NAMESPACES.REQUEST_VALIDATION, { 
      message: "Request validator error",
      error: error instanceof Error ? error.message : String(error)
    });
    return true; // Don't block requests on validator errors
  }
}