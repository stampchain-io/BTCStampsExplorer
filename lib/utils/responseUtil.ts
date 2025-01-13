import { ApiResponseUtil } from "./apiResponseUtil.ts";
import { WebResponseUtil } from "./webResponseUtil.ts";

// Re-export from apiResponseUtil for backward compatibility
export { API_RESPONSE_VERSION } from "./apiResponseUtil.ts";

export interface ResponseOptions {
  status?: number;
  headers?: Record<string, string>;
  routeType?: RouteType;
  forceNoCache?: boolean | undefined;
  raw?: boolean;
}

export interface StampResponseOptions extends ResponseOptions {
  binary?: boolean;
  encoding?: string;
}

export class ResponseUtil {
  /** @deprecated Use ApiResponseUtil.success for API routes */
  static success(
    data: unknown,
    options: ResponseOptions = { forceNoCache: true },
  ): Response {
    if (new Error().stack?.includes("/api/")) {
      console.warn("Warning: Use ApiResponseUtil.success for API routes");
      return ApiResponseUtil.success(data, options);
    }
    return WebResponseUtil.success(data, options);
  }

  /** @deprecated Use ApiResponseUtil.custom for API routes */
  static custom<T>(
    body: T,
    status: number,
    options: ResponseOptions = {},
  ): Response {
    if (new Error().stack?.includes("/api/")) {
      console.warn("Warning: Use ApiResponseUtil.custom for API routes");
      return ApiResponseUtil.custom(body, status, options);
    }
    return WebResponseUtil.custom(body, status, options);
  }

  /** @deprecated Use ApiResponseUtil.badRequest for API routes */
  static badRequest(message: string, options: ResponseOptions = {}): Response {
    if (new Error().stack?.includes("/api/")) {
      console.warn("Warning: Use ApiResponseUtil.badRequest for API routes");
      return ApiResponseUtil.badRequest(message, undefined, options);
    }
    return WebResponseUtil.badRequest(message, options);
  }

  /** @deprecated Use ApiResponseUtil.notFound for API routes */
  static notFound(
    message = "Not Found",
    options: ResponseOptions = {},
  ): Response {
    if (new Error().stack?.includes("/api/")) {
      console.warn("Warning: Use ApiResponseUtil.notFound for API routes");
      return ApiResponseUtil.notFound(message, undefined, options);
    }
    return WebResponseUtil.notFound(message, options);
  }

  /** @deprecated Use ApiResponseUtil.internalError for API routes */
  static internalError(
    error: unknown,
    message = "Internal server error",
    options: ResponseOptions = {},
  ): Response {
    if (new Error().stack?.includes("/api/")) {
      console.warn("Warning: Use ApiResponseUtil.internalError for API routes");
      return ApiResponseUtil.internalError(error, message, options);
    }
    return WebResponseUtil.internalError(error, message, options);
  }
}
