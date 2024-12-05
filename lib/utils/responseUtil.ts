import { getCacheConfig, RouteType } from "$server/services/cacheService.ts";
import {
  getHtmlHeaders,
  getRecursiveHeaders,
  getSecurityHeaders,
} from "$lib/utils/securityHeaders.ts";

// Update this when making breaking changes to response format
const API_RESPONSE_VERSION = "v2.2.1";

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
      return this.successWithCache(data, options);
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...getSecurityHeaders({ forceNoCache: true }),
        "Content-Type": "application/json",
        "X-API-Version": API_RESPONSE_VERSION,
        ...(options.headers || {}),
      },
    });
  }

  static successWithCache(data: unknown, options: ResponseOptions): Response {
    const { duration, staleWhileRevalidate, staleIfError } = getCacheConfig(
      options.routeType || RouteType.DYNAMIC,
    );

    if (options.forceNoCache || duration === 0) {
      return this.success(data, { ...options, forceNoCache: true });
    }

    const cacheControl = [
      "public",
      `max-age=${duration}`,
      staleWhileRevalidate
        ? `stale-while-revalidate=${staleWhileRevalidate}`
        : "",
      staleIfError ? `stale-if-error=${staleIfError}` : "",
    ].filter(Boolean).join(", ");

    const headers = {
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
    };

    return new Response(JSON.stringify(data), {
      status: 200,
      headers,
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
        headers: {
          ...getSecurityHeaders(options),
          "Content-Type": "application/json",
          "X-API-Version": API_RESPONSE_VERSION,
          ...(options.headers || {}),
        },
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
        headers: {
          ...getSecurityHeaders({ forceNoCache: true }),
          "Content-Type": "application/json",
          "X-API-Version": API_RESPONSE_VERSION,
          ...(options.headers || {}),
        },
      },
    );
  }

  static notFound(message: string, options: ResponseOptions = {}) {
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 404,
        headers: {
          ...getSecurityHeaders({ forceNoCache: true }),
          "Content-Type": "application/json",
          "X-API-Version": API_RESPONSE_VERSION,
          ...(options.headers || {}),
        },
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
        headers: {
          ...getSecurityHeaders({ forceNoCache: true }),
          "Content-Type": "application/json",
          "X-API-Version": API_RESPONSE_VERSION,
          ...(options.headers || {}),
        },
      },
    );
  }

  // Stamp-specific response methods
  static stampResponse(
    content: string | null,
    mimeType: string,
    options: StampResponseOptions = {},
  ) {
    // Get appropriate headers based on content type
    const headers = this.getContentTypeHeaders(mimeType, options);

    // Handle binary content (images, audio, video, etc.)
    if (options.binary && content) {
      try {
        const binaryString = atob(content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        return new Response(bytes, {
          status: options.status || 200,
          headers: new Headers({
            ...headers,
            ...options.headers,
            "Content-Length": bytes.length.toString(),
          }),
        });
      } catch (error) {
        console.error("Failed to convert base64 to binary:", error);
        return this.internalError(error, "Failed to process binary content");
      }
    }

    // Handle text-based content (already decoded in controller)
    const isTextBased = mimeType.includes("text/") ||
      mimeType.includes("javascript") ||
      mimeType.includes("application/json") ||
      mimeType.includes("xml");

    if (isTextBased) {
      return new Response(content, {
        status: options.status || 200,
        headers: new Headers({
          ...headers,
          ...options.headers,
          "Content-Type": `${mimeType}; charset=utf-8`,
          // Only add CF-No-Transform for HTML and JS
          ...(mimeType.includes("html") || mimeType.includes("javascript")
            ? { "CF-No-Transform": "true" }
            : {}),
        }),
      });
    }

    // Regular content (shouldn't reach here, but just in case)
    return new Response(content, {
      status: options.status || 200,
      headers: new Headers({
        ...headers,
        ...options.headers,
      }),
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
      headers: new Headers({
        ...getHtmlHeaders({ forceNoCache: true }),
        ...(options.headers || {}),
      }),
    });
  }

  static jsonResponse(data: unknown, options: ResponseOptions = {}) {
    return new Response(JSON.stringify(data), {
      status: options.status || 200,
      headers: new Headers({
        ...getSecurityHeaders({ forceNoCache: false }),
        "Content-Type": "application/json",
        ...(options.headers || {}),
      }),
    });
  }
}
