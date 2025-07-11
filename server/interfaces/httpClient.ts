/**
 * HTTP Client Interface for Dependency Injection
 * Abstracts HTTP operations for better testability
 */

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  ok: boolean;
}

export interface HttpRequestConfig {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface HttpClient {
  /**
   * Perform an HTTP request
   */
  request<T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>>;

  /**
   * GET request
   */
  get<T = any>(url: string, config?: Omit<HttpRequestConfig, "method">): Promise<HttpResponse<T>>;

  /**
   * POST request
   */
  post<T = any>(url: string, data?: any, config?: Omit<HttpRequestConfig, "method" | "body">): Promise<HttpResponse<T>>;

  /**
   * PUT request
   */
  put<T = any>(url: string, data?: any, config?: Omit<HttpRequestConfig, "method" | "body">): Promise<HttpResponse<T>>;

  /**
   * DELETE request
   */
  delete<T = any>(url: string, config?: Omit<HttpRequestConfig, "method">): Promise<HttpResponse<T>>;
}

/**
 * Default HTTP Client implementation using fetch
 */
export class FetchHttpClient implements HttpClient {
  private defaultTimeout: number = 10000; // 10 seconds
  private defaultRetries: number = 3;
  private defaultRetryDelay: number = 1000; // 1 second

  constructor(options?: {
    defaultTimeout?: number;
    defaultRetries?: number;
    defaultRetryDelay?: number;
  }) {
    if (options?.defaultTimeout) this.defaultTimeout = options.defaultTimeout;
    if (options?.defaultRetries) this.defaultRetries = options.defaultRetries;
    if (options?.defaultRetryDelay) this.defaultRetryDelay = options.defaultRetryDelay;
  }

  async request<T = any>(url: string, config: HttpRequestConfig = {}): Promise<HttpResponse<T>> {
    const {
      method = "GET",
      headers = {},
      body,
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      retryDelay = this.defaultRetryDelay,
    } = config;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const fetchConfig: RequestInit = {
          method,
          headers,
          signal: controller.signal,
        };

        if (body && method !== "GET") {
          fetchConfig.body = typeof body === "string" ? body : JSON.stringify(body);
          if (!headers["Content-Type"]) {
            headers["Content-Type"] = "application/json";
          }
        }

        const response = await fetch(url, fetchConfig);
        clearTimeout(timeoutId);

        // Parse response data
        let data: T;
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          data = await response.json();
        } else {
          data = await response.text() as T;
        }

        // Convert headers to plain object
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        const httpResponse: HttpResponse<T> = {
          data,
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          ok: response.ok,
        };

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return httpResponse;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < retries) {
          // Exponential backoff
          const delay = retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    clearTimeout(timeoutId);
    throw lastError!;
  }

  async get<T = any>(url: string, config?: Omit<HttpRequestConfig, "method">): Promise<HttpResponse<T>> {
    return await this.request<T>(url, { ...config, method: "GET" });
  }

  async post<T = any>(url: string, data?: any, config?: Omit<HttpRequestConfig, "method" | "body">): Promise<HttpResponse<T>> {
    return await this.request<T>(url, { ...config, method: "POST", body: data });
  }

  async put<T = any>(url: string, data?: any, config?: Omit<HttpRequestConfig, "method" | "body">): Promise<HttpResponse<T>> {
    return await this.request<T>(url, { ...config, method: "PUT", body: data });
  }

  async delete<T = any>(url: string, config?: Omit<HttpRequestConfig, "method">): Promise<HttpResponse<T>> {
    return await this.request<T>(url, { ...config, method: "DELETE" });
  }
}