/**
 * @fileoverview Fresh.js URL Synchronization for Sorting - Server-side and routing integration
 * @description Provides Fresh.js-specific URL synchronization utilities for sorting functionality,
 * including server-side URL parsing, route handler integration, and Fresh navigation patterns
 */

import type {
  SortKey,
  StampSortKey,
  WalletSortKey,
} from "$lib/types/sorting.d.ts";

// ===== SERVER-SIDE URL PARSING =====

/**
 * Parse sort parameters from Fresh.js request URL (server-side)
 */
export function parseSortFromRequest<T extends SortKey>(
  request: Request,
  validOptions: readonly T[],
  defaultSort: T,
  paramName = "sort",
): {
  sortBy: T;
  isValid: boolean;
  originalValue: string | null;
} {
  try {
    const url = new URL(request.url);
    const sortParam = url.searchParams.get(paramName);

    if (!sortParam) {
      return {
        sortBy: defaultSort,
        isValid: true,
        originalValue: null,
      };
    }

    const isValid = validOptions.includes(sortParam as T);
    return {
      sortBy: isValid ? (sortParam as T) : defaultSort,
      isValid,
      originalValue: sortParam,
    };
  } catch (error) {
    console.warn("Failed to parse sort from request:", error);
    return {
      sortBy: defaultSort,
      isValid: false,
      originalValue: null,
    };
  }
}

/**
 * Parse sort parameters from Fresh.js route context (server-side)
 */
export function parseSortFromContext<T extends SortKey>(
  ctx: { url: URL } | { request: Request },
  validOptions: readonly T[],
  defaultSort: T,
  paramName = "sort",
): {
  sortBy: T;
  isValid: boolean;
  originalValue: string | null;
} {
  try {
    // Handle both URL and Request contexts
    const url = "url" in ctx ? ctx.url : new URL(ctx.request.url);
    const sortParam = url.searchParams.get(paramName);

    if (!sortParam) {
      return {
        sortBy: defaultSort,
        isValid: true,
        originalValue: null,
      };
    }

    const isValid = validOptions.includes(sortParam as T);
    return {
      sortBy: isValid ? (sortParam as T) : defaultSort,
      isValid,
      originalValue: sortParam,
    };
  } catch (error) {
    console.warn("Failed to parse sort from context:", error);
    return {
      sortBy: defaultSort,
      isValid: false,
      originalValue: null,
    };
  }
}

// ===== FRESH.JS ROUTE HELPERS =====

/**
 * Create a Fresh.js route handler that includes sort parameter handling
 */
export function createSortAwareRoute<T extends SortKey>(config: {
  validSortOptions: readonly T[];
  defaultSort: T;
  paramName?: string;
  handler: (ctx: any, sortInfo: {
    sortBy: T;
    isValid: boolean;
    originalValue: string | null;
  }) => Response | Promise<Response>;
}): (ctx: any) => Response | Promise<Response> {
  const { validSortOptions, defaultSort, paramName = "sort", handler } = config;

  return (ctx: any) => {
    const sortInfo = parseSortFromContext(
      ctx,
      validSortOptions,
      defaultSort,
      paramName,
    );
    return handler(ctx, sortInfo);
  };
}

/**
 * Create URL with sort parameters for Fresh.js navigation
 */
export function createSortUrl(
  basePath: string,
  sortBy: SortKey,
  existingParams: URLSearchParams | Record<string, string> = {},
  paramName = "sort",
): string {
  const params = new URLSearchParams(
    typeof existingParams === "object" &&
      !(existingParams instanceof URLSearchParams)
      ? Object.entries(existingParams)
      : existingParams,
  );

  params.set(paramName, String(sortBy));

  return `${basePath}?${params.toString()}`;
}

/**
 * Extract sort-related parameters from URL for Fresh.js components
 */
export function extractSortParams(
  url: string | URL | URLSearchParams,
  paramName = "sort",
): {
  sortParam: string | null;
  otherParams: URLSearchParams;
  hasSort: boolean;
} {
  let searchParams: URLSearchParams;

  if (typeof url === "string") {
    const urlObj = new URL(url, "http://localhost");
    searchParams = urlObj.searchParams;
  } else if (url instanceof URL) {
    searchParams = url.searchParams;
  } else {
    searchParams = new URLSearchParams(url);
  }

  const sortParam = searchParams.get(paramName);
  const otherParams = new URLSearchParams(searchParams);
  otherParams.delete(paramName);

  return {
    sortParam,
    otherParams,
    hasSort: Boolean(sortParam),
  };
}

// ===== FRESH.JS NAVIGATION INTEGRATION =====

/**
 * Create Fresh.js-compatible navigation function for sorting
 */
export function createFreshNavigationHandler<T extends SortKey>(config: {
  basePath: string;
  paramName?: string;
  preserveParams?: string[]; // Parameters to preserve during navigation
  onNavigate?: (sortBy: T) => void;
}) {
  const { basePath, paramName = "sort", preserveParams = [], onNavigate } =
    config;

  return (sortBy: T) => {
    try {
      // Get current URL parameters
      const currentParams = typeof globalThis.location !== "undefined"
        ? new URLSearchParams(globalThis.location.search)
        : new URLSearchParams();

      // Create new parameters, preserving specified ones
      const newParams = new URLSearchParams();

      // Preserve specified parameters
      preserveParams.forEach((param) => {
        const value = currentParams.get(param);
        if (value) {
          newParams.set(param, value);
        }
      });

      // Set sort parameter
      newParams.set(paramName, String(sortBy));

      // Create new URL
      const newUrl = `${basePath}?${newParams.toString()}`;

      // Navigate using Fresh.js patterns
      if (typeof globalThis.history !== "undefined") {
        globalThis.history.pushState(null, "", newUrl);

        // Trigger custom event for Fresh.js to handle
        const event = new CustomEvent("fresh-navigate", {
          detail: { url: newUrl, sortBy },
        });
        globalThis.dispatchEvent?.(event);
      }

      // Call callback
      onNavigate?.(sortBy);
    } catch (error) {
      console.warn("Failed to navigate with sort:", error);
    }
  };
}

/**
 * Create Fresh.js partial navigation handler for sorting (for HTMX-style updates)
 */
export function createPartialNavigationHandler<T extends SortKey>(config: {
  targetSelector?: string;
  updateMethod?: "replace" | "append" | "prepend";
  preserveScroll?: boolean;
}) {
  const {
    targetSelector = "[data-sort-content]",
    updateMethod = "replace",
    preserveScroll = true,
  } = config;

  return async (sortBy: T, apiEndpoint: string) => {
    try {
      // Create request URL with sort parameter
      const url = new URL(apiEndpoint, globalThis.location?.origin);
      url.searchParams.set("sort", String(sortBy));

      // Add Fresh.js partial headers
      const response = await fetch(url, {
        headers: {
          "Accept": "text/html",
          "X-Fresh-Partial": "true",
        },
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const html = await response.text();
      const targetElement = document.querySelector(targetSelector);

      if (!targetElement) {
        console.warn(`Target element not found: ${targetSelector}`);
        return;
      }

      // Preserve scroll position if requested
      const scrollPosition = preserveScroll
        ? { x: globalThis.scrollX || 0, y: globalThis.scrollY || 0 }
        : null;

      // Update content
      switch (updateMethod) {
        case "replace":
          targetElement.innerHTML = html;
          break;
        case "append":
          targetElement.insertAdjacentHTML("beforeend", html);
          break;
        case "prepend":
          targetElement.insertAdjacentHTML("afterbegin", html);
          break;
      }

      // Restore scroll position
      if (scrollPosition && preserveScroll) {
        globalThis.scrollTo?.(scrollPosition.x, scrollPosition.y);
      }
    } catch (error) {
      console.error("Partial navigation failed:", error);
      // Fallback to full page navigation
      if (typeof globalThis === "undefined" || !globalThis?.location) {
        return; // Cannot navigate during SSR
      }
      const fallbackUrl = new URL(apiEndpoint, globalThis.location.origin);
      fallbackUrl.searchParams.set("sort", String(sortBy));
      globalThis.location.href = fallbackUrl.toString();
    }
  };
}

// ===== VALIDATION & SECURITY =====

/**
 * Validate and sanitize sort parameters for security
 */
export function sanitizeSortParam(
  sortParam: string | null,
  allowedChars = /^[a-zA-Z0-9_-]+$/,
  maxLength = 50,
): string | null {
  if (!sortParam) return null;

  // Basic length check
  if (sortParam.length > maxLength) {
    console.warn(`Sort parameter too long: ${sortParam.length} > ${maxLength}`);
    return null;
  }

  // Character validation
  if (!allowedChars.test(sortParam)) {
    console.warn(`Invalid characters in sort parameter: ${sortParam}`);
    return null;
  }

  return sortParam;
}

/**
 * Create secure sort parameter parser with validation
 */
export function createSecureSortParser<T extends SortKey>(
  validOptions: readonly T[],
  defaultSort: T,
) {
  return (input: string | null): { sortBy: T; isValid: boolean } => {
    if (!input) {
      return { sortBy: defaultSort, isValid: true };
    }

    const sanitized = sanitizeSortParam(input);
    if (!sanitized) {
      return { sortBy: defaultSort, isValid: false };
    }

    const isValid = validOptions.includes(sanitized as T);
    return {
      sortBy: isValid ? (sanitized as T) : defaultSort,
      isValid,
    };
  };
}

// ===== PRESET CONFIGURATIONS =====

/**
 * Wallet sort configuration for Fresh.js routes
 */
export const WALLET_SORT_CONFIG = {
  validOptions: [
    "DESC",
    "ASC",
    "value_desc",
    "value_asc",
    "quantity_desc",
    "quantity_asc",
    "stamp_desc",
    "stamp_asc",
    "recent_desc",
    "recent_asc",
  ] as const satisfies readonly WalletSortKey[],
  defaultSort: "DESC" as WalletSortKey,
  paramName: "sort",
  preserveParams: ["page", "limit", "address"],
};

/**
 * Stamp sort configuration for Fresh.js routes
 */
export const STAMP_SORT_CONFIG = {
  validOptions: [
    "DESC",
    "ASC",
    "block_index_desc",
    "block_index_asc",
    "stamp_number_desc",
    "stamp_number_asc",
    "supply_desc",
    "supply_asc",
  ] as const satisfies readonly StampSortKey[],
  defaultSort: "DESC" as StampSortKey,
  paramName: "sort",
  preserveParams: ["page", "limit"],
};

// ===== UTILITY EXPORTS =====

/**
 * Create wallet-specific route handler
 */
export const createWalletSortRoute = (
  handler: (
    ctx: any,
    sortInfo: {
      sortBy: WalletSortKey;
      isValid: boolean;
      originalValue: string | null;
    },
  ) => Response | Promise<Response>,
) =>
(ctx: any) => {
  const sortInfo = parseSortFromContext(
    ctx,
    WALLET_SORT_CONFIG.validOptions,
    WALLET_SORT_CONFIG.defaultSort,
    WALLET_SORT_CONFIG.paramName,
  );
  return handler(ctx, sortInfo);
};

/**
 * Create stamp-specific route handler
 */
export const createStampSortRoute = (
  handler: (
    ctx: any,
    sortInfo: {
      sortBy: StampSortKey;
      isValid: boolean;
      originalValue: string | null;
    },
  ) => Response | Promise<Response>,
) =>
(ctx: any) => {
  const sortInfo = parseSortFromContext(
    ctx,
    STAMP_SORT_CONFIG.validOptions,
    STAMP_SORT_CONFIG.defaultSort,
    STAMP_SORT_CONFIG.paramName,
  );
  return handler(ctx, sortInfo);
};

/**
 * Wallet sort URL creator
 */
export const createWalletSortUrl = (
  basePath: string,
  sortBy: WalletSortKey,
  existingParams?: URLSearchParams,
) =>
  createSortUrl(basePath, sortBy, existingParams, WALLET_SORT_CONFIG.paramName);

/**
 * Stamp sort URL creator
 */
export const createStampSortUrl = (
  basePath: string,
  sortBy: StampSortKey,
  existingParams?: URLSearchParams,
) =>
  createSortUrl(basePath, sortBy, existingParams, STAMP_SORT_CONFIG.paramName);
