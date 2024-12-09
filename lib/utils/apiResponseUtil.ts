import { getSecurityHeaders } from "$lib/utils/securityHeaders.ts";
import { normalizeHeaders } from "$lib/utils/headerUtils.ts";
import { getCacheConfig, RouteType } from "$server/services/cacheService.ts";

export const API_RESPONSE_VERSION = "v2.2.7";

//  // Future structure
//  lib/utils/
//  ├── apiResponseUtil.ts    // API-specific responses
//  ├── webResponseUtil.ts    // Web/frontend responses
//  ├── securityHeaders.ts    // Shared security headers
//  └── headerUtils.ts        // Shared header utilities

export interface ApiResponseOptions {
  status?: number;
  headers?: Record<string, string>;
  routeType?: RouteType;
  forceNoCache?: boolean;
}

export interface ApiErrorResponse {
  error: string;
  status: "error";
  code: string;
  details?: unknown;
}

export class ApiResponseUtil {
  private static createHeaders(options: ApiResponseOptions = {}): Headers {
    const headers: Record<string, string> = {
      ...getSecurityHeaders({
        forceNoCache: options.forceNoCache ?? true,
        context: "api",
      }),
      "Content-Type": "application/json",
      "X-API-Version": API_RESPONSE_VERSION,
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-Permitted-Cross-Domain-Policies": "none",
      ...(options.headers || {}),
    };

    if (options.routeType && !options.forceNoCache) {
      const { duration, staleWhileRevalidate, staleIfError } = getCacheConfig(
        options.routeType,
      );

      if (duration > 0) {
        const cacheControl = [
          "public",
          `max-age=${duration}`,
          staleWhileRevalidate
            ? `stale-while-revalidate=${staleWhileRevalidate}`
            : "",
          staleIfError ? `stale-if-error=${staleIfError}` : "",
        ].filter(Boolean).join(", ");

        Object.assign(headers, {
          "Cache-Control": cacheControl,
          "CDN-Cache-Control": cacheControl,
          "Cloudflare-CDN-Cache-Control": cacheControl,
          "Surrogate-Control": `max-age=${duration}`,
          "Edge-Control": `cache-maxage=${duration}`,
        });
      }
    }

    return new Headers(headers);
  }

  private static createErrorResponse(
    message: string,
    code: string,
    details?: unknown,
  ): ApiErrorResponse {
    return {
      error: message,
      status: "error",
      code,
      ...(details ? { details } : {}),
    };
  }

  static success(data: unknown, options: ApiResponseOptions = {}): Response {
    return new Response(
      JSON.stringify(data),
      {
        status: options.status || 200,
        headers: normalizeHeaders(this.createHeaders(options)),
      },
    );
  }

  static created(
    data: unknown,
    options: ApiResponseOptions = {},
  ): Response {
    return new Response(
      JSON.stringify(data),
      {
        status: 201,
        headers: normalizeHeaders(this.createHeaders(options)),
      },
    );
  }

  static noContent(options: ApiResponseOptions = {}): Response {
    return new Response(null, {
      status: 204,
      headers: normalizeHeaders(this.createHeaders(options)),
    });
  }

  static badRequest(
    message: string,
    details?: unknown,
    options: ApiResponseOptions = {},
  ): Response {
    console.error("Bad Request:", message, details || "");
    return new Response(
      JSON.stringify(this.createErrorResponse(message, "BAD_REQUEST", details)),
      {
        status: 400,
        headers: normalizeHeaders(this.createHeaders(options)),
      },
    );
  }

  static unauthorized(
    message = "Unauthorized",
    details?: unknown,
    options: ApiResponseOptions = {},
  ): Response {
    console.error("Unauthorized:", message, details || "");
    return new Response(
      JSON.stringify(
        this.createErrorResponse(message, "UNAUTHORIZED", details),
      ),
      {
        status: 401,
        headers: normalizeHeaders(this.createHeaders(options)),
      },
    );
  }

  static forbidden(
    message = "Forbidden",
    details?: unknown,
    options: ApiResponseOptions = {},
  ): Response {
    console.error("Forbidden:", message, details || "");
    return new Response(
      JSON.stringify(this.createErrorResponse(message, "FORBIDDEN", details)),
      {
        status: 403,
        headers: normalizeHeaders(this.createHeaders(options)),
      },
    );
  }

  static notFound(
    message = "Resource not found",
    details?: unknown,
    options: ApiResponseOptions = {},
  ): Response {
    return new Response(
      JSON.stringify(this.createErrorResponse(message, "NOT_FOUND", details)),
      {
        status: 404,
        headers: normalizeHeaders(this.createHeaders(options)),
      },
    );
  }

  static methodNotAllowed(
    message = "Method not allowed",
    details?: unknown,
    options: ApiResponseOptions = {},
  ): Response {
    return new Response(
      JSON.stringify(
        this.createErrorResponse(message, "METHOD_NOT_ALLOWED", details),
      ),
      {
        status: 405,
        headers: normalizeHeaders(this.createHeaders(options)),
      },
    );
  }

  static conflict(
    message: string,
    details?: unknown,
    options: ApiResponseOptions = {},
  ): Response {
    console.error("Conflict:", message, details || "");
    return new Response(
      JSON.stringify(this.createErrorResponse(message, "CONFLICT", details)),
      {
        status: 409,
        headers: normalizeHeaders(this.createHeaders(options)),
      },
    );
  }

  static tooManyRequests(
    message = "Too many requests",
    details?: unknown,
    options: ApiResponseOptions = {},
  ): Response {
    console.warn("Rate limit exceeded:", message, details || "");
    return new Response(
      JSON.stringify(
        this.createErrorResponse(message, "TOO_MANY_REQUESTS", details),
      ),
      {
        status: 429,
        headers: normalizeHeaders(this.createHeaders(options)),
      },
    );
  }

  static internalError(
    error: unknown,
    message = "Internal server error",
    options: ApiResponseOptions = {},
  ): Response {
    console.error("Internal Error:", error);
    return new Response(
      JSON.stringify(
        this.createErrorResponse(message, "INTERNAL_ERROR", {
          ...(Deno.env.get("DENO_ENV") === "development" ? { error } : {}),
        }),
      ),
      {
        status: 500,
        headers: normalizeHeaders(this.createHeaders(options)),
      },
    );
  }

  static serviceUnavailable(
    message = "Service temporarily unavailable",
    details?: unknown,
    options: ApiResponseOptions = {},
  ): Response {
    console.error("Service Unavailable:", message, details || "");
    return new Response(
      JSON.stringify(
        this.createErrorResponse(message, "SERVICE_UNAVAILABLE", details),
      ),
      {
        status: 503,
        headers: normalizeHeaders(this.createHeaders(options)),
      },
    );
  }

  // Helper method for custom responses
  static custom<T>(
    body: T,
    status: number,
    options: ApiResponseOptions = {},
  ): Response {
    return new Response(
      body instanceof ArrayBuffer || body instanceof Uint8Array
        ? body
        : JSON.stringify(body),
      {
        status,
        headers: normalizeHeaders(this.createHeaders(options)),
      },
    );
  }
}
