import { IS_BROWSER } from "$fresh/runtime.ts";
import { useEffect, useState } from "preact/hooks";

/**
 * SSR-safe hook for accessing location data and navigation
 * Provides a unified interface for all location-based operations
 */
export function useSSRSafeNavigation(fallbackUrl = "/") {
  const [currentUrl, setCurrentUrl] = useState<URL | null>(null);
  const [searchParams, setSearchParams] = useState<URLSearchParams>(
    new URLSearchParams(),
  );
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (IS_BROWSER && globalThis.location) {
      setIsClient(true);
      const url = new URL(globalThis.location.href);
      setCurrentUrl(url);
      setSearchParams(new URLSearchParams(url.search));

      // Listen for navigation changes
      const handleNavigation = () => {
        const newUrl = new URL(globalThis.location.href);
        setCurrentUrl(newUrl);
        setSearchParams(new URLSearchParams(newUrl.search));
      };

      globalThis.addEventListener("popstate", handleNavigation);
      globalThis.addEventListener("fresh-navigate", handleNavigation);

      return () => {
        globalThis.removeEventListener("popstate", handleNavigation);
        globalThis.removeEventListener("fresh-navigate", handleNavigation);
      };
    }
    return; // Explicit return for non-browser case
  }, []);

  /**
   * Navigate to a URL with SSR safety
   */
  const navigate = (url: string | URL, options?: { replace?: boolean }) => {
    if (!IS_BROWSER || !globalThis.location) return;

    const targetUrl = typeof url === "string" ? url : url.toString();

    if (options?.replace) {
      globalThis.location.replace(targetUrl);
    } else {
      globalThis.location.href = targetUrl;
    }
  };

  /**
   * Update URL parameters without navigation
   */
  const updateSearchParams = (updater: (params: URLSearchParams) => void) => {
    if (!IS_BROWSER || !globalThis.location) return;

    const url = new URL(globalThis.location.href);
    updater(url.searchParams);
    globalThis.history.pushState({}, "", url.toString());

    // Update local state
    setCurrentUrl(url);
    setSearchParams(new URLSearchParams(url.search));
  };

  /**
   * Get a URL for SSR-safe operations
   */
  const getUrl = (): URL => {
    if (currentUrl) return currentUrl;
    return new URL(fallbackUrl, "http://localhost");
  };

  return {
    currentUrl,
    searchParams,
    isClient,
    navigate,
    updateSearchParams,
    getUrl,
    // Convenience methods
    getSearchParam: (key: string) => searchParams.get(key),
    setSearchParam: (key: string, value: string) => {
      updateSearchParams((params) => params.set(key, value));
    },
    deleteSearchParam: (key: string) => {
      updateSearchParams((params) => params.delete(key));
    },
  };
}

/**
 * Type-safe wrapper for getting URL in SSR context
 */
export function getSSRSafeUrl(fallbackUrl = "/"): URL {
  if (IS_BROWSER && globalThis.location) {
    return new URL(globalThis.location.href);
  }
  return new URL(fallbackUrl, "http://localhost");
}
