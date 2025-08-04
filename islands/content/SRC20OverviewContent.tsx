/* ===== SRC20 OVERVIEW CONTENT COMPONENT ===== */
import { useState } from "preact/hooks";
import type { SRC20OverviewContentProps } from "$types/ui.d.ts";
// import type { SRC20Row } from "$types/src20.d.ts"; // Removed unused import
import { SRC20OverviewHeader } from "$header";
import { SRC20Gallery } from "$section";
import { useSSRSafeNavigation } from "$lib/hooks/useSSRSafeNavigation.ts";
import { SSRSafeUrlBuilder } from "$components/navigation/SSRSafeUrlBuilder.tsx";

/* ===== TYPES ===== */
type SortOption =
  | "TRENDING"
  | "DEPLOY"
  | "HOLDERS"
  | "PROGRESS"
  | "MARKET_CAP"
  | "VOLUME";

/* ===== COMPONENT ===== */
export function SRC20OverviewContent({
  mintingData,
  timeframe,
  sortBy,
  sortDirection,
  viewType, // 🎸 NEW: Accept viewType prop
  btcPrice, // 🚀 PERFORMANCE: Accept BTC price (for future use)
  btcPriceSource, // 🚀 PERFORMANCE: Accept BTC price source (for future use)
}: SRC20OverviewContentProps) {
  // Note: btcPrice and btcPriceSource are available for future component optimizations
  // Currently passed through context but not directly used in this component
  console.log(
    `[SRC20OverviewContent] BTC price context available: $${btcPrice} from ${btcPriceSource}`,
  );

  // ✅ SSR-SAFE: Use SSR-safe navigation hook
  const { isClient } = useSSRSafeNavigation();

  // 🤘 PUNK ROCK SIMPLIFICATION: Remove complexity, just use the data directly
  const [_currentTimeframe, setCurrentTimeframe] = useState<
    "24H" | "7D" | "30D"
  >(timeframe as "24H" | "7D" | "30D");
  const [isNavigating, setIsNavigating] = useState(false);

  // Get the current data (simplified) - all tokens are in mintingData
  const currentData = mintingData?.data || [];
  const totalPages = mintingData?.totalPages || 1;
  const currentPage = mintingData?.page || 1;
  const [currentSort, setCurrentSort] = useState<{
    filter: SortOption | null;
    direction: "asc" | "desc";
  }>({
    filter: sortBy as SortOption,
    direction: sortDirection as "asc" | "desc",
  });

  // Handle filter changes
  const handleFilterChange = (
    filter: SortOption | null,
    direction: "asc" | "desc",
  ) => {
    setCurrentSort({ filter, direction });
    setIsNavigating(true); // ✅ FRESH.JS: Set loading state

    // ✅ SSR-SAFE: Use SSR-safe URL builder for navigation
    if (isClient) {
      const url = SSRSafeUrlBuilder.fromCurrent()
        .setParam("sortBy", filter || "TRENDING")
        .setParam("sortDirection", direction)
        .setParam("page", "1") // Reset to page 1 when sorting changes
        .toString();

      // Create anchor element with f-partial attribute for Fresh.js navigation
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("f-partial", "");
      link.style.display = "none";
      document.body.appendChild(link as Node);
      link.click();
      document.body.removeChild(link as Node);
    }

    // Reset loading state after a short delay (Fresh.js will handle the actual navigation)
    setTimeout(() => setIsNavigating(false), 100);
  };

  // Handle view type changes
  const handleViewTypeChange = (viewType: string) => {
    // 🎸 MINTING BUTTON: Use the provided view type instead of toggling
    setIsNavigating(true);

    // ✅ SSR-SAFE: Use SSR-safe URL builder for navigation
    if (isClient) {
      const url = SSRSafeUrlBuilder.fromCurrent()
        .setParam("viewType", viewType)
        .setParam("page", "1") // Reset to page 1 when view changes
        .toString();

      // Create anchor element with f-partial attribute for Fresh.js navigation
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("f-partial", "");
      link.style.display = "none";
      document.body.appendChild(link as Node);
      link.click();
      document.body.removeChild(link as Node);
    }

    // Reset loading state after a short delay
    setTimeout(() => setIsNavigating(false), 100);
  };

  return (
    <div class="w-full">
      {/* ✅ FRESH.JS: Show loading overlay during navigation */}
      {isNavigating && (
        <div class="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div class="bg-stamp-card-bg rounded-lg p-4 shadow-lg">
            <div class="animate-spin w-6 h-6 border-2 border-stamp-purple-bright border-t-transparent rounded-full">
            </div>
          </div>
        </div>
      )}
      <SRC20OverviewHeader
        onViewTypeChange={handleViewTypeChange}
        viewType={viewType || "minted"} // 🔧 Fix TS2375: Provide default when undefined
        onTimeframeChange={(timeframe: string) => {
          if (
            timeframe === "24H" || timeframe === "7D" || timeframe === "30D"
          ) {
            setCurrentTimeframe(timeframe);
          }
        }}
        onFilterChange={(filter: string, direction?: "asc" | "desc") =>
          handleFilterChange(filter as SortOption | null, direction || "desc")}
        currentSort={currentSort}
      />
      <SRC20Gallery
        viewType={viewType || "minted"} // 🔧 Fix TS2375: Provide default when undefined
        fromPage="src20"
        initialData={currentData}
        timeframe={_currentTimeframe}
        currentSort={currentSort} // 🎯 NEW: Pass currentSort for table header sorting
        pagination={{
          page: currentPage,
          totalPages: totalPages,
          onPageChange: (newPage: number) => {
            // ✅ SSR-SAFE: Use SSR-safe URL builder for pagination navigation
            if (isClient) {
              const url = SSRSafeUrlBuilder.fromCurrent()
                .setParam("page", newPage.toString())
                .toString();

              // Create anchor element with f-partial attribute for Fresh.js navigation
              const link = document.createElement("a");
              link.href = url;
              link.setAttribute("f-partial", "");
              link.style.display = "none";
              document.body.appendChild(link as Node);
              link.click();
              document.body.removeChild(link as Node);
            }
          },
        }}
      />
    </div>
  );
}
