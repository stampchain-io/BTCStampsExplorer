/**
 * Fresh.js Navigation Utilities
 *
 * SSR-safe navigation helpers for Fresh.js partial navigation.
 * Provides browser environment checks to prevent SSR errors.
 *
 * Key Functions:
 * - safeNavigate(): SSR-safe URL navigation with fallback
 * - getSearchParams(): SSR-safe URLSearchParams access
 * - navigateWithFresh(): Fresh.js partial navigation with parameters
 * - getUrlParam(): SSR-safe URL parameter reading
 * - isBrowser(): Environment detection for SSR safety
 */

/* ===== SSR-SAFE ENVIRONMENT HELPERS ===== */

/**
 * SSR-safe URL helper to get current URL
 * @param fallback - Fallback URL for SSR environment
 * @returns Current URL or fallback
 */
export const getCurrentUrl = (fallback: string = "/"): string => {
  if (typeof globalThis === "undefined" || !globalThis?.location) {
    return fallback; // Safe fallback during SSR
  }
  return globalThis.location.href;
};

/**
 * SSR-safe window width helper
 * @returns Window width or fallback for SSR
 */
export const getWindowWidth = (): number => {
  if (typeof globalThis === "undefined" || !globalThis?.innerWidth) {
    return 1024; // Safe fallback during SSR (desktop size)
  }
  return globalThis.innerWidth;
};

/**
 * SSR-safe window height helper
 * @returns Window height or fallback for SSR
 */
export const getWindowHeight = (): number => {
  if (typeof globalThis === "undefined" || !globalThis?.innerHeight) {
    return 768; // Safe fallback during SSR
  }
  return globalThis.innerHeight;
};

/**
 * Check if we're in a browser environment
 * @returns True if in browser, false if in SSR
 */
export const isBrowser = (): boolean => {
  return typeof globalThis !== "undefined" &&
    globalThis?.location !== undefined;
};

/**
 * SSR-safe navigation helper - replaces direct globalThis.location.href assignments
 * @param url - URL to navigate to
 * @param options - Navigation options (optional)
 */
export const safeNavigate = (
  url: string,
  options?: { replace?: boolean },
): void => {
  if (!isBrowser()) {
    return; // Safe no-op during SSR
  }

  if (options?.replace) {
    globalThis.location.replace(url);
  } else {
    globalThis.location.href = url;
  }
};

/**
 * SSR-safe URLSearchParams getter
 * @param fallbackSearch - Fallback search string for SSR (optional)
 * @returns URLSearchParams object or empty params for SSR
 */
export const getSearchParams = (fallbackSearch?: string): URLSearchParams => {
  if (!isBrowser()) {
    return new URLSearchParams(fallbackSearch || ""); // Safe fallback during SSR
  }

  return new URLSearchParams(globalThis.location.search);
};

/* ===== FRESH.JS NAVIGATION HELPERS ===== */

/**
 * SSR-safe navigation helper with Fresh.js partial navigation
 * @param params - URL parameters to set
 * @param anchor - Anchor to set
 * @param baseUrl - Base URL (optional, uses current if not provided)
 */
export const navigateWithFresh = (
  params: Record<string, string>,
  anchor?: string,
  baseUrl?: string,
): void => {
  if (!isBrowser()) {
    return; // Safe no-op during SSR
  }

  const currentUrl = baseUrl || getCurrentUrl();
  const url = new URL(currentUrl);

  // Set parameters
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  // Set anchor if provided
  if (anchor) {
    url.searchParams.set("anchor", anchor);
  }

  // Use Fresh.js partial navigation
  safeNavigate(url.toString());
};

/**
 * SSR-safe navigation helper for single page parameter
 * @param pageParam - Page parameter name
 * @param pageValue - Page value
 * @param baseUrl - Base URL (optional)
 */
export const navigateToPage = (
  pageParam: string,
  pageValue: string,
  baseUrl?: string,
): void => {
  if (!isBrowser()) {
    return; // Safe no-op during SSR
  }

  const currentUrl = baseUrl || getCurrentUrl();
  const url = new URL(currentUrl);
  url.searchParams.set(pageParam, pageValue);

  // Use Fresh.js partial navigation
  safeNavigate(url.toString());
};

/**
 * SSR-safe pagination handler factory
 * @param pageParam - URL parameter name for page
 * @param anchorName - Anchor name for navigation
 * @returns SSR-safe pagination handler
 */
export const createPaginationHandler = (
  pageParam: string,
  anchorName: string,
) => {
  return (page: number) => {
    navigateWithFresh(
      { [pageParam]: page.toString() },
      anchorName,
    );
  };
};

/**
 * SSR-safe sort handler factory
 * @param sortParam - URL parameter name for sort
 * @param anchorName - Anchor name for navigation
 * @param resetPageParam - Page parameter to reset to 1 (optional)
 * @returns SSR-safe sort handler
 */
export const createSortHandler = (
  sortParam: string,
  anchorName: string,
  resetPageParam?: string,
) => {
  return (sortValue: string) => {
    const params: Record<string, string> = {
      [sortParam]: sortValue,
    };

    // Reset to page 1 when sorting
    if (resetPageParam) {
      params[resetPageParam] = "1";
    }

    navigateWithFresh(params, anchorName);
  };
};

/* ===== FRESH.JS PARTIAL RELOAD HELPERS ===== */

/**
 * Dispatch Fresh.js partial reload event
 * @param target - Target element or selector (optional)
 */
export const dispatchFreshPartialReload = (target?: string | Element): void => {
  if (!isBrowser()) {
    return; // Safe no-op during SSR
  }

  const event = new CustomEvent("fresh-partial-reload", {
    detail: { target },
  });

  globalThis.dispatchEvent(event);
};

/**
 * Add Fresh.js partial navigation attributes to an element
 * @param element - Element to add attributes to
 * @param href - Partial navigation href
 */
export const addFreshPartialAttributes = (
  element: Element,
  href: string,
): void => {
  if (!isBrowser()) {
    return; // Safe no-op during SSR
  }

  element.setAttribute("f-partial", href);
  element.setAttribute("target", "_top");
};

/* ===== URL PARAMETER HELPERS ===== */

/**
 * SSR-safe URL parameter getter
 * @param paramName - Parameter name to get
 * @param fallback - Fallback value if parameter not found
 * @returns Parameter value or fallback
 */
export const getUrlParam = (
  paramName: string,
  fallback: string = "",
): string => {
  if (!isBrowser()) {
    return fallback; // Safe fallback during SSR
  }

  const url = new URL(getCurrentUrl());
  return url.searchParams.get(paramName) || fallback;
};

/**
 * SSR-safe URL parameter setter (without navigation)
 * @param paramName - Parameter name to set
 * @param value - Parameter value
 * @param baseUrl - Base URL (optional)
 * @returns Updated URL string
 */
export const setUrlParam = (
  paramName: string,
  value: string,
  baseUrl?: string,
): string => {
  if (!isBrowser()) {
    return baseUrl || "/"; // Safe fallback during SSR
  }

  const currentUrl = baseUrl || getCurrentUrl();
  const url = new URL(currentUrl);
  url.searchParams.set(paramName, value);

  return url.toString();
};

/* ===== ANCHOR NAVIGATION HELPERS ===== */

/**
 * SSR-safe smooth scroll to anchor
 * @param anchorId - Anchor ID to scroll to
 * @param offset - Offset from top (optional)
 */
export const scrollToAnchor = (anchorId: string, offset: number = 0): void => {
  if (!isBrowser()) {
    return; // Safe no-op during SSR
  }

  const element = globalThis.document.getElementById(anchorId);
  if (element) {
    const elementPosition = element.offsetTop;
    const offsetPosition = elementPosition - offset;

    globalThis.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  }
};

/**
 * SSR-safe anchor scroll with timeout (useful after Fresh.js navigation)
 * @param anchorId - Anchor ID to scroll to
 * @param timeout - Timeout in milliseconds
 * @param offset - Offset from top (optional)
 */
export const scrollToAnchorWithTimeout = (
  anchorId: string,
  timeout: number = 100,
  offset: number = 0,
): void => {
  if (!isBrowser()) {
    return; // Safe no-op during SSR
  }

  setTimeout(() => {
    scrollToAnchor(anchorId, offset);
  }, timeout);
};
