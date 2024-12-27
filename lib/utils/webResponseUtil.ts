import {
  getBinaryContentHeaders,
  getHtmlHeaders,
  getRecursiveHeaders,
  getSecurityHeaders,
} from "$lib/utils/securityHeaders.ts";
import { normalizeHeaders } from "$lib/utils/headerUtils.ts";
import { getCacheConfig, RouteType } from "$server/services/cacheService.ts";
import { API_RESPONSE_VERSION } from "./apiResponseUtil.ts";

export interface WebResponseOptions {
  status?: number;
  headers?: Record<string, string>;
  forceNoCache?: boolean;
  routeType?: RouteType;
  raw?: boolean;
}

export interface StampResponseOptions extends WebResponseOptions {
  binary?: boolean;
  encoding?: string;
}

export class WebResponseUtil {
  static success(data: unknown, options: WebResponseOptions = {}): Response {
    const headers = {
      ...getSecurityHeaders({
        forceNoCache: options.forceNoCache ?? false,
        context: "web",
      }),
      "Content-Type": "application/json",
      "X-API-Version": API_RESPONSE_VERSION,
      ...(options.headers || {}),
    };

    if (options.routeType) {
      const { duration, staleWhileRevalidate, staleIfError } = getCacheConfig(
        options.routeType,
      );

      if (!options.forceNoCache && duration > 0) {
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
          "Vary": "Accept-Encoding, X-API-Version",
        });
      }
    }

    return new Response(JSON.stringify(data), {
      status: options.status || 200,
      headers: normalizeHeaders(headers),
    });
  }

  static stampResponse(
    content: string | null,
    mimeType: string,
    options: StampResponseOptions = {},
  ): Response {
    const baseHeaders = this.getContentTypeHeaders(mimeType, options);
    const headers = new Headers({
      ...baseHeaders,
      ...options.headers,
      "X-API-Version": API_RESPONSE_VERSION,
    });

    // Binary content handling
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

    // Text content handling
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

    // Regular content
    return new Response(content, {
      status: options.status || 200,
      headers: normalizeHeaders(headers),
    });
  }

  static stampNotFound(options: WebResponseOptions = {}): Response {
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

  static notFound(
    message = "Not Found",
    options: WebResponseOptions = {},
  ): Response {
    return new Response(JSON.stringify({ error: message }), {
      status: 404,
      headers: normalizeHeaders({
        ...getSecurityHeaders({ forceNoCache: true }),
        "Content-Type": "application/json",
        "X-API-Version": API_RESPONSE_VERSION,
        ...(options.headers || {}),
      }),
    });
  }

  static internalError(
    error: unknown,
    message = "Internal server error",
    options: WebResponseOptions = {},
  ): Response {
    console.error("Internal Error:", error);
    return new Response(
      JSON.stringify({ error: message }),
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

  static jsonResponse(
    data: unknown,
    options: WebResponseOptions = {},
  ): Response {
    return new Response(JSON.stringify(data), {
      status: options.status || 200,
      headers: normalizeHeaders(
        new Headers({
          ...getSecurityHeaders({ forceNoCache: false }),
          "Content-Type": "application/json",
          "X-API-Version": API_RESPONSE_VERSION,
          ...(options.headers || {}),
        }),
      ),
    });
  }

  static custom<T>(
    body: T,
    status: number,
    options: WebResponseOptions = {},
  ): Response {
    // For 204 No Content or null body, return response without body
    if (status === 204 || body === null || body === undefined) {
      return new Response(null, {
        status,
        headers: normalizeHeaders({
          ...getSecurityHeaders(options),
          "X-API-Version": API_RESPONSE_VERSION,
          ...(options.headers || {}),
        }),
      });
    }

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

  static badRequest(
    message: string,
    options: WebResponseOptions = {},
  ): Response {
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

  static redirect(
    location: string,
    status = 302,
    options: WebResponseOptions = {},
  ): Response {
    return new Response(null, {
      status,
      headers: normalizeHeaders({
        ...(options.headers || {}),
        Location: location,
        "X-API-Version": API_RESPONSE_VERSION,
      }),
    });
  }

  private static getContentTypeHeaders(
    mimeType: string,
    options: StampResponseOptions,
  ): HeadersInit {
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

    return {
      ...getSecurityHeaders(options),
      "Content-Type": mimeType,
    };
  }
}
