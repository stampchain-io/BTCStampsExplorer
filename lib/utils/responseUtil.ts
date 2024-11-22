export class ResponseUtil {
  static success<T>(data: T, status: number = 200): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  static successArray<T>(data: T[], status: number = 200): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  static error(message: string, status: number = 400): Response {
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  static custom<T>(
    body: T,
    status: number,
    headers?: HeadersInit,
  ): Response {
    const defaultHeaders = { "Content-Type": "application/json" };
    const responseHeaders = headers
      ? { ...defaultHeaders, ...headers }
      : defaultHeaders;

    return new Response(
      // Only stringify if the body isn't already BufferLike
      body instanceof ArrayBuffer || body instanceof Uint8Array
        ? body
        : JSON.stringify(body),
      {
        status,
        headers: responseHeaders,
      },
    );
  }

  static notFound(message: string = "Resource not found"): Response {
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  static handleError(error: unknown, defaultMessage: string): Response {
    console.error(error);
    const message = error instanceof Error ? error.message : defaultMessage;
    return this.error(message, 500);
  }
}
