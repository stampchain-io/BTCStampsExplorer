/**
 * @fileoverview FreshSRC20Gallery - Fresh.js-compatible SRC-20 gallery
 * @description Replaces SRC20Gallery with Fresh.js partial navigation and
 * maintains existing sorting functionality (ASC/DESC)
 */

import { SRC20CardSm } from "$components/card/SRC20CardSm.tsx";
import type { EnrichedSRC20Row } from "$globals";
import { LoadingIcon } from "$icon";
import { Pagination } from "$islands/datacontrol/Pagination.tsx";
import { useEffect, useMemo, useState } from "preact/hooks";

// ===== TYPES =====

interface FreshSRC20GalleryProps {
  /** Initial SRC-20 data from server */
  initialData: EnrichedSRC20Row[];
  /** Initial pagination state */
  initialPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  /** Wallet address for API calls */
  address: string;
  /** Initial sort value - maintaining existing ASC/DESC functionality */
  initialSort: "ASC" | "DESC";
  /** Page identifier for conditional rendering */
  fromPage?: string;
  /** Show loading skeleton during transitions */
  showLoadingSkeleton?: boolean;
  /** Enable Fresh.js partial navigation */
  enablePartialNavigation?: boolean;
}

interface FreshNavigationOptions {
  /** Use f-partial for smooth transitions */
  usePartial?: boolean;
  /** Scroll to element after navigation */
  scrollTarget?: string;
  /** Update URL parameters */
  updateUrl?: boolean;
}

// ===== COMPONENT =====

export default function FreshSRC20Gallery({
  initialData,
  initialPagination,
  address,
  initialSort,
  fromPage = "wallet",
  showLoadingSkeleton = true,
  enablePartialNavigation = true,
}: FreshSRC20GalleryProps) {
  // ===== STATE =====
  const [tokens, setTokens] = useState<EnrichedSRC20Row[]>(initialData);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSort, setCurrentSort] = useState<"ASC" | "DESC">(initialSort);

  // ===== FRESH PERFORMANCE OPTIMIZATION =====
  // Memoize tokens to prevent unnecessary re-renders when market data hasn't changed
  const memoizedTokens = useMemo(() => {
    // Create a stable reference for the token array based on market data values
    return tokens.map((token) => ({
      ...token,
      // Add a computed field for memoization stability using available market data
      _marketDataHash: token.market_data
        ? `${token.market_data.floor_unit_price}-${token.market_data.volume24}-${token.market_data.mcap}`
        : "no-market-data",
    }));
  }, [
    // Re-memoize when:
    tokens.length, // Number of tokens changes
    tokens.map((t) => t.tick).join(","), // Token composition changes
    tokens.map((t) => {
      const md = t.market_data;
      return md ? `${md.floor_unit_price}-${md.volume24}-${md.mcap}` : "none";
    }).join(","), // Market data values change
  ]);

  // ===== COMPUTED VALUES =====
  // const isWalletPage = fromPage === "wallet" ||
  //   (typeof globalThis !== "undefined" &&
  //     globalThis.location?.pathname?.includes("/wallet/"));

  // ===== FRESH.JS NAVIGATION =====
  const navigateWithFresh = async (
    url: string,
    options: FreshNavigationOptions = {},
  ) => {
    const {
      usePartial = enablePartialNavigation,
      scrollTarget = "src20-section",
      updateUrl = true,
    } = options;

    if (!enablePartialNavigation) {
      // Fallback to standard navigation with SSR protection
      if (typeof globalThis === "undefined" || !globalThis?.location) {
        return; // Cannot navigate during SSR
      }
      globalThis.location.href = url;
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use Fresh.js f-partial navigation
      if (usePartial && typeof globalThis !== "undefined") {
        // Check if the target element has f-partial attribute
        const targetElement = document.getElementById(scrollTarget);
        if (targetElement && targetElement.getAttribute("f-partial")) {
          // Update URL without full page reload
          if (updateUrl) {
            const urlObj = new URL(url, globalThis.location.origin);
            globalThis.history.pushState({}, "", urlObj.toString());
          }

          // Trigger Fresh.js partial reload
          const freshEvent = new CustomEvent("fresh-partial-reload", {
            detail: {
              url: url,
              target: scrollTarget,
            },
          });
          document.dispatchEvent(freshEvent);

          // Fresh.js will handle the partial reload automatically
          return;
        }
      }

      // Fallback to manual fetch if Fresh.js not available
      const response = await fetch(url, {
        headers: {
          "X-API-Version": "2.3",
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch SRC-20 tokens: ${response.status}`);
      }

      const data = await response.json();

      // Update state with new data
      setTokens(data.data || []);
      setPagination(data.pagination || initialPagination);

      // Scroll to target element
      if (scrollTarget && typeof globalThis !== "undefined") {
        const targetElement = document.getElementById(scrollTarget);
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }
    } catch (err) {
      console.error("Fresh navigation error:", err);
      setError(err instanceof Error ? err.message : "Navigation failed");
    } finally {
      setLoading(false);
    }
  };

  // ===== API URL BUILDER =====
  const buildApiUrl = (page: number, sort: "ASC" | "DESC"): string => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: pagination.limit.toString(),
      sortBy: sort,
      includeMintData: "true",
    });

    return `/api/v2/src20/balance/${address}?${params.toString()}`;
  };

  // ===== EVENT HANDLERS =====
  const handlePageChange = async (page: number) => {
    const url = buildApiUrl(page, currentSort);
    await navigateWithFresh(url);

    // Ensure anchor scrolling happens after data update
    setTimeout(() => {
      const targetElement = document.getElementById("src20-section");
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 200); // Slightly longer delay to ensure DOM update
  };

  const handleSortChange = async (newSort: "ASC" | "DESC") => {
    setCurrentSort(newSort);

    // Update URL params to reflect sort change
    if (typeof globalThis !== "undefined") {
      const url = new URL(globalThis.location.href);
      url.searchParams.set("src20SortBy", newSort);
      url.searchParams.delete("src20_page"); // Reset to page 1 on sort change
      url.searchParams.set("anchor", "src20");
      globalThis.history.pushState({}, "", url.toString());
    }

    // Fetch new data with sort (reset to page 1)
    const apiUrl = buildApiUrl(1, newSort);
    await navigateWithFresh(apiUrl);

    // Ensure anchor scrolling happens after data update
    setTimeout(() => {
      const targetElement = document.getElementById("src20-section");
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 200); // Slightly longer delay to ensure DOM update
  };

  // ===== EFFECTS =====

  // Listen for external sort changes (e.g., from SortButton)
  useEffect(() => {
    if (typeof globalThis === "undefined") return;

    const handleSortEvent = (event: CustomEvent) => {
      const { sortBy } = event.detail;
      if (
        sortBy && (sortBy === "ASC" || sortBy === "DESC") &&
        sortBy !== currentSort
      ) {
        handleSortChange(sortBy);
      }
    };

    globalThis.addEventListener(
      "src20-sort-change",
      handleSortEvent as EventListener,
    );

    return () => {
      globalThis.removeEventListener(
        "src20-sort-change",
        handleSortEvent as EventListener,
      );
    };
  }, [currentSort]);

  // Listen for Fresh.js partial reload events
  useEffect(() => {
    if (typeof globalThis === "undefined") return;

    const handleFreshPartialReload = async (event: CustomEvent) => {
      const { url, target } = event.detail;
      if (
        target === "src20-section" &&
        url.includes(`/api/v2/src20/balance/${address}`)
      ) {
        console.log("Fresh.js SRC-20 partial reload:", url);

        // Extract sort parameter from URL
        const urlObj = new URL(url, globalThis.location.origin);
        const sortParam = urlObj.searchParams.get("sortBy") ||
          urlObj.searchParams.get("src20SortBy");
        const newSort = (sortParam === "ASC" || sortParam === "DESC")
          ? sortParam
          : currentSort;

        // Update sort if it changed
        if (newSort !== currentSort) {
          setCurrentSort(newSort);
        }

        // Fetch new data
        try {
          setLoading(true);
          setError(null);

          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(
              `Failed to fetch SRC-20 tokens: ${response.status}`,
            );
          }

          const data = await response.json();

          // Update state with new data
          setTokens(data.data || []);
          setPagination({
            page: data.page || 1,
            limit: data.limit || pagination.limit,
            total: data.total || 0,
            totalPages: data.totalPages || 1,
          });

          // Scroll to section after data loads
          setTimeout(() => {
            const targetElement = document.getElementById("src20-section");
            if (targetElement) {
              targetElement.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }
          }, 100);
        } catch (err) {
          const errorMessage = err instanceof Error
            ? err.message
            : "Failed to reload SRC-20 tokens";
          setError(errorMessage);
          console.error("Fresh.js SRC-20 partial reload error:", err);
        } finally {
          setLoading(false);
        }
      }
    };

    document.addEventListener(
      "fresh-partial-reload",
      handleFreshPartialReload as unknown as EventListener,
    );

    return () => {
      document.removeEventListener(
        "fresh-partial-reload",
        handleFreshPartialReload as unknown as EventListener,
      );
    };
  }, [address]);

  // ===== LOADING SKELETON =====
  const renderLoadingSkeleton = () => {
    if (!showLoadingSkeleton) return null;

    return (
      <div class="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded-lg">
        <div class="flex flex-col items-center gap-4">
          <LoadingIcon />
          <div class="text-white text-sm">Loading SRC-20 tokens...</div>
        </div>
      </div>
    );
  };

  // ===== ERROR DISPLAY =====
  const renderError = () => {
    if (!error) return null;

    return (
      <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
        <div class="text-red-400 text-sm">
          Error: {error}
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null);
            handlePageChange(pagination.page);
          }}
          class="mt-2 text-xs text-red-300 hover:text-red-100 underline"
        >
          Retry
        </button>
      </div>
    );
  };

  // ===== RENDER =====
  return (
    <div class="relative">
      {/* Error Display */}
      {renderError()}

      {/* Loading Overlay */}
      {loading && renderLoadingSkeleton()}

      {/* SRC-20 Token Table */}
      <div class="relative">
        <SRC20CardSm
          data={memoizedTokens}
          fromPage={fromPage as "src20" | "wallet" | "stamping/src20" | "home"}
          onImageClick={(imgSrc: string) => {
            console.log("SRC-20 image clicked:", imgSrc);
            // TODO(@dev): Implement image modal or navigation
          }}
        />
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div class="mt-6">
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            prefix="src20"
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
