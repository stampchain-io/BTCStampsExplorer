let cachedToken: string | null = null;
let tokenExpiry: number | null = null;
const TOKEN_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export async function getCSRFToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const response = await fetch("/api/internal/csrfToken");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (!data.token) {
      throw new Error("No token received from server");
    }

    // Cache the token
    cachedToken = data.token;
    tokenExpiry = Date.now() + TOKEN_CACHE_DURATION;

    return data.token;
  } catch (error) {
    console.error("Error fetching CSRF token:", error);
    // In development, return a dummy token if fetch fails
    if (globalThis.location?.hostname === "localhost") {
      console.warn("Development mode: Using dummy CSRF token");
      return "dev-csrf-token";
    }
    throw error;
  }
}

export function clearCSRFTokenCache(): void {
  cachedToken = null;
  tokenExpiry = null;
}

// Helper function for making authenticated requests
export async function makeAuthenticatedRequest(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  try {
    const csrfToken = await getCSRFToken();

    const headers = new Headers(options.headers || {});
    headers.set("X-CSRF-Token", csrfToken);

    return fetch(url, {
      ...options,
      headers,
    });
  } catch (error) {
    // In development, try request without CSRF token
    if (globalThis.location?.hostname === "localhost") {
      console.warn("Development mode: Attempting request without CSRF token");
      return fetch(url, options);
    }
    throw error;
  }
}
