import { FreshContext } from "$fresh/server.ts";
import { transformResponseForVersion } from "$server/middleware/schemaTransformer.ts";
import { ApiResponseOptions, ApiResponseUtil } from "./apiResponseUtil.ts";

/**
 * Versioned API Response Utility
 *
 * Extends ApiResponseUtil to apply version-based transformations
 * Task 4.5: Build Response Transformation Pipeline
 */

export class VersionedApiResponse {
  /**
   * Create a versioned JSON response
   */
  static json(
    data: unknown,
    ctx: FreshContext,
    options: ApiResponseOptions = {},
  ): Response {
    // Get API version from context
    const apiVersion = (ctx.state as any)?.apiVersion || "2.3";

    // Transform data based on version
    const transformedData = transformResponseForVersion(
      data,
      apiVersion as string,
    );

    // Create response using base utility
    const response = ApiResponseUtil.success(transformedData, options);

    // Add version headers
    if (ctx?.state?.versionContext) {
      const { isDeprecated, endOfLife } = (ctx.state as any).versionContext;

      response.headers.set("API-Version", apiVersion as string);

      if (isDeprecated) {
        response.headers.set("Deprecation", "true");
        response.headers.set("Sunset", endOfLife || "");
        response.headers.set(
          "Link",
          `<https://stampchain.io/docs/api/migration>; rel="deprecation"`,
        );
      }
    }

    return response;
  }

  /**
   * Create a versioned error response
   */
  static error(
    message: string,
    _ctx?: FreshContext,
    options: ApiResponseOptions & { code?: string; details?: unknown } = {},
  ): Response {
    // Error responses are not transformed
    return ApiResponseUtil.badRequest(message, options.details, options);
  }

  /**
   * Create a versioned not found response
   */
  static notFound(
    message: string,
    _ctx?: FreshContext,
    options: ApiResponseOptions = {},
  ): Response {
    return ApiResponseUtil.notFound(message, undefined, options);
  }

  /**
   * Create a versioned bad request response
   */
  static badRequest(
    message: string,
    _ctx?: FreshContext,
    options: ApiResponseOptions & { details?: unknown } = {},
  ): Response {
    return ApiResponseUtil.badRequest(message, options.details, options);
  }

  /**
   * Create a versioned internal server error response
   */
  static internalServerError(
    message: string,
    _ctx?: FreshContext,
    options: ApiResponseOptions & { details?: unknown } = {},
  ): Response {
    return ApiResponseUtil.internalError(message, message, options);
  }

  /**
   * Create a versioned unauthorized response
   */
  static unauthorized(
    message: string,
    _ctx?: FreshContext,
    options: ApiResponseOptions = {},
  ): Response {
    return ApiResponseUtil.unauthorized(message, undefined, options);
  }

  /**
   * Create a versioned forbidden response
   */
  static forbidden(
    message: string,
    _ctx?: FreshContext,
    options: ApiResponseOptions = {},
  ): Response {
    return ApiResponseUtil.forbidden(message, undefined, options);
  }

  /**
   * Create a versioned created response
   */
  static created(
    data: unknown,
    ctx: FreshContext,
    options: ApiResponseOptions = {},
  ): Response {
    // Transform data based on version
    const apiVersion = (ctx.state as any)?.apiVersion || "2.3";
    const transformedData = transformResponseForVersion(
      data,
      apiVersion as string,
    );

    return ApiResponseUtil.created(transformedData, options);
  }

  /**
   * Create a versioned no content response
   */
  static noContent(
    _ctx?: FreshContext,
    options: ApiResponseOptions = {},
  ): Response {
    return ApiResponseUtil.noContent(options);
  }
}

// Export alias for easier migration
export const versionedApiResponse = VersionedApiResponse;
