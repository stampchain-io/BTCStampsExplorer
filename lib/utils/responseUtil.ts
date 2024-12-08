import { getCacheConfig, RouteType } from "$server/services/cacheService.ts";
import {
  getBinaryContentHeaders,
  getHtmlHeaders,
  getRecursiveHeaders,
  getSecurityHeaders,
} from "$lib/utils/securityHeaders.ts";
import { normalizeHeaders } from "$lib/utils/headerUtils.ts";

// Update this when making breaking changes to response format
export const API_RESPONSE_VERSION = "v2.2.3";

export interface ResponseOptions {
  status?: number;
  headers?: Record<string, string>;
  routeType?: RouteType;
  forceNoCache?: boolean;
  raw?: boolean;
}

export interface StampResponseOptions extends ResponseOptions {
  binary?: boolean;
  encoding?: string;
}

export class ResponseUtil {
  static success(data: unknown, options: ResponseOptions = {}): Response {
    if (options.routeType) {
      const { duration, staleWhileRevalidate, staleIfError } = getCacheConfig(
        options.routeType,
      );

      if (options.forceNoCache || duration === 0) {
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: normalizeHeaders({
            ...getSecurityHeaders({ forceNoCache: true }),
            "Content-Type": "application/json",
            "X-API-Version": API_RESPONSE_VERSION,
            ...(options.headers || {}),
          }),
        });
      }

      const cacheControl = [
        "public",
        `max-age=${duration}`,
        staleWhileRevalidate
          ? `stale-while-revalidate=${staleWhileRevalidate}`
          : "",
        staleIfError ? `stale-if-error=${staleIfError}` : "",
      ].filter(Boolean).join(", ");

      const headers = normalizeHeaders({
        ...getSecurityHeaders(),
        "Content-Type": "application/json",
        "Cache-Control": cacheControl,
        "CDN-Cache-Control": cacheControl,
        "Cloudflare-CDN-Cache-Control": cacheControl,
        "Surrogate-Control": `max-age=${duration}`,
        "Edge-Control": `cache-maxage=${duration}`,
        "Vary": "Accept-Encoding, X-API-Version",
        "X-API-Version": API_RESPONSE_VERSION,
        ...(options.headers || {}),
      });

      return new Response(JSON.stringify(data), {
        status: 200,
        headers,
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: normalizeHeaders({
        ...getSecurityHeaders({ forceNoCache: true }),
        "Content-Type": "application/json",
        "X-API-Version": API_RESPONSE_VERSION,
        ...(options.headers || {}),
      }),
    });
  }

  static custom<T>(
    body: T,
    status: number,
    options: ResponseOptions = {},
  ): Response {
    return new Response(
      body instanceof ArrayBuffer || body instanceof Uint8Array
        ? body
        : JSON.stringify(body),
      {
        status,
        headers: normalizeHeaders({
          ...getSecurityHeaders(options),
          "Content-Type": "application/json",
          "X-API-Version": API_RESPONSE_VERSION,
          ...(options.headers || {}),
        }),
      },
    );
  }

  static badRequest(message: string, options: ResponseOptions = {}): Response {
    console.error("Bad Request:", message);
    return new Response(
      JSON.stringify({
        error: message,
        status: "error",
        code: "BAD_REQUEST",
      }),
      {
        status: 400,
        headers: normalizeHeaders({
          ...getSecurityHeaders({ forceNoCache: true }),
          "Content-Type": "application/json",
          "X-API-Version": API_RESPONSE_VERSION,
          ...(options.headers || {}),
        }),
      },
    );
  }

  static notFound(message: string, options: ResponseOptions = {}) {
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 404,
        headers: normalizeHeaders({
          ...getSecurityHeaders({ forceNoCache: true }),
          "Content-Type": "application/json",
          "X-API-Version": API_RESPONSE_VERSION,
          ...(options.headers || {}),
        }),
      },
    );
  }

  static internalError(
    error: unknown,
    message = "Internal server error",
    options: ResponseOptions = {},
  ): Response {
    console.error("Internal Error:", error);
    return new Response(
      JSON.stringify({
        error: message,
        status: "error",
        code: "INTERNAL_ERROR",
      }),
      {
        status: 500,
        headers: normalizeHeaders({
          ...getSecurityHeaders({ forceNoCache: true }),
          "Content-Type": "application/json",
          "X-API-Version": API_RESPONSE_VERSION,
          ...(options.headers || {}),
        }),
      },
    );
  }

  // Stamp-specific response methods
  static stampResponse(
    content: string | null,
    mimeType: string,
    options: StampResponseOptions = {},
  ) {
    const baseHeaders = this.getContentTypeHeaders(mimeType, options);
    const headers = new Headers({
      ...baseHeaders,
      ...options.headers,
      "X-API-Version": API_RESPONSE_VERSION,
    });

    // Binary content
    if (options.binary && content) {
      try {
        const binaryString = atob(content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        return new Response(bytes, {
          headers: normalizeHeaders(
            new Headers({
              ...headers,
              ...getBinaryContentHeaders(mimeType, options),
              "X-API-Version": API_RESPONSE_VERSION,
              "Vary": "Accept-Encoding, X-API-Version, Origin",
              "Content-Length": bytes.length.toString(),
            }),
          ),
        });
      } catch (error) {
        console.error("Failed to convert base64 to binary:", error);
        return this.internalError(error, "Failed to process binary content");
      }
    }

    // Text content
    const isTextBased = mimeType.includes("text/") ||
      mimeType.includes("javascript") ||
      mimeType.includes("application/json") ||
      mimeType.includes("xml");

    if (isTextBased) {
      return new Response(content, {
        headers: normalizeHeaders(
          new Headers({
            ...headers,
            "X-API-Version": API_RESPONSE_VERSION,
            "Vary": "Accept-Encoding, X-API-Version, Origin",
            "Content-Type": `${mimeType}; charset=utf-8`,
          }),
        ),
      });
    }

    // Regular content (shouldn't reach here, but just in case)
    return new Response(content, {
      status: options.status || 200,
      headers: normalizeHeaders(
        new Headers({
          ...headers,
          "X-API-Version": API_RESPONSE_VERSION,
          "Vary": "Accept-Encoding, X-API-Version, Origin",
        }),
      ),
    });
  }

  private static getContentTypeHeaders(
    mimeType: string,
    options: StampResponseOptions,
  ) {
    if (mimeType.includes("html")) {
      return {
        ...getHtmlHeaders(options),
        "Content-Type": `${mimeType}; charset=utf-8`,
      };
    }

    if (mimeType.includes("javascript")) {
      return {
        ...getRecursiveHeaders(options),
        "Content-Type": `${mimeType}; charset=utf-8`,
      };
    }

    if (mimeType.includes("image/")) {
      return {
        ...getSecurityHeaders(options),
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      };
    }

    // Text-based content types
    if (
      mimeType.includes("text/") ||
      mimeType.includes("application/json") ||
      mimeType.includes("xml")
    ) {
      return {
        ...getSecurityHeaders(options),
        "Content-Type": `${mimeType}; charset=utf-8`,
      };
    }

    // Default headers for other types
    return {
      ...getSecurityHeaders(options),
      "Content-Type": mimeType,
    };
  }

  static stampNotFound(options: ResponseOptions = {}) {
    return new Response(null, {
      status: options.status || 404,
      headers: normalizeHeaders(
        new Headers({
          ...getHtmlHeaders({ forceNoCache: true }),
          "X-API-Version": API_RESPONSE_VERSION,
          "Vary": "Accept-Encoding, X-API-Version, Origin",
          ...(options.headers || {}),
        }),
      ),
    });
  }

  static jsonResponse(data: unknown, options: ResponseOptions = {}) {
    return new Response(JSON.stringify(data), {
      status: options.status || 200,
      headers: normalizeHeaders(
        new Headers({
          ...getSecurityHeaders({ forceNoCache: false }),
          "Content-Type": "application/json",
          ...(options.headers || {}),
        }),
      ),
    });
  }
}
