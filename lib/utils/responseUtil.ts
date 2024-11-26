import { getCacheConfig, RouteType } from "$server/services/cacheService.ts";

// Update this when making breaking changes to response format
const API_RESPONSE_VERSION = "v2.2";

interface ResponseOptions {
  forceNoCache?: boolean;
  routeType?: RouteType;
}

export class ResponseUtil {
  static success(data: unknown, options: ResponseOptions = {}) {
    if (options.routeType) {
      return this.successWithCache(data, options);
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-API-Version": API_RESPONSE_VERSION,
      },
    });
  }

  static successWithCache(data: unknown, options: ResponseOptions) {
    const { duration, staleWhileRevalidate, staleIfError } = getCacheConfig(
      options.routeType || RouteType.DYNAMIC,
    );

    // Force no-cache if specified or duration is 0
    if (options.forceNoCache || duration === 0) {
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, must-revalidate",
          "X-API-Version": API_RESPONSE_VERSION,
        },
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

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": cacheControl,
        "CDN-Cache-Control": cacheControl,
        "Cloudflare-CDN-Cache-Control": cacheControl,
        "Surrogate-Control": `max-age=${duration}`,
        "Vary": "Accept-Encoding, X-API-Version",
        "X-API-Version": API_RESPONSE_VERSION,
      },
    });
  }

  static custom<T>(
    body: T,
    status: number,
    headers?: HeadersInit,
  ): Response {
    const defaultHeaders = {
      "Content-Type": "application/json",
      "X-API-Version": API_RESPONSE_VERSION,
    };
    const responseHeaders = headers
      ? { ...defaultHeaders, ...headers }
      : defaultHeaders;

    return new Response(
      body instanceof ArrayBuffer || body instanceof Uint8Array
        ? body
        : JSON.stringify(body),
      {
        status,
        headers: responseHeaders,
      },
    );
  }

  static badRequest(message: string) {
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          "X-API-Version": API_RESPONSE_VERSION,
        },
      },
    );
  }

  static notFound(message: string) {
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          "X-API-Version": API_RESPONSE_VERSION,
        },
      },
    );
  }

  static internalError(error: unknown, message?: string) {
    console.error(error);
    return new Response(
      JSON.stringify({
        error: message || "Internal server error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          "X-API-Version": API_RESPONSE_VERSION,
        },
      },
    );
  }
}
