

/**
 * Handles the request and returns a response with a redirect status code.
 * @param req - The request object.
 * @returns The response object with a redirect status code.
 */
export function handler(req: Request): Response {
  return new Response("", {
    status: 307,
    headers: { Location: "/block/last" },
  });
}
