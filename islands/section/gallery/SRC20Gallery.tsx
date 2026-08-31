/* ===== SRC20 GALLERY COMPONENT ===== */
// @baba - add token cards specific to wallet page
import { PaginationButtons, ViewAllButton } from "$button";
import {
  SRC20Minting,
  SRC20MintingCompact,
  SRC20Overview,
  SRC20OverviewCompact,
} from "$card";
import { useLoadingSkeleton } from "$lib/hooks/useLoadingSkeleton.ts";
import { unicodeEscapeToEmoji } from "$lib/utils/ui/formatting/emojiUtils.ts";
import { subtitlePrimary, titlePrimary } from "$text";
import type { EnrichedSRC20Row } from "$types/src20.d.ts";
import type { SRC20GalleryProps } from "$types/ui.d.ts";
import { useEffect, useMemo, useState } from "preact/hooks";

/* ===== TYPES ===== */

/* ===== COMPONENT ===== */
export function SRC20Gallery({
  initialData,
  fromPage = "src20",
  viewType,
  title,
  subTitle,
  pagination,
  timeframe,
  serverData,
  currentSort,
}: SRC20GalleryProps) {
  const [data, setData] = useState<EnrichedSRC20Row[]>(initialData || []); // 🎯 FIXED: Use EnrichedSRC20Row
  const [isLoading, setIsLoading] = useState(!initialData && !serverData);

  // 🚀 PREACT OPTIMIZATION: Memoized data processing
  const processedData: EnrichedSRC20Row[] = useMemo(() => {
    return data.map((item: EnrichedSRC20Row) => ({
      ...item,
      tick: unicodeEscapeToEmoji(item.tick),
    }));
  }, [data]);

  // 🚀 DENO FRESH 2.3+ OPTIMIZATION: Server-side data is already enriched and filtered
  useEffect(() => {
    if (serverData) {
      setData(serverData.data);
      setIsLoading(false);
    }
  }, [serverData]);

  // Sync data from initialData (used by the /src20 page). Fresh preserves island
  // state across partial navigations, so without this the table would keep
  // showing stale rows after a filter/view/timeframe change.
  useEffect(() => {
    if (serverData) return; // serverData-driven pages (home) handled above
    setData(initialData || []);
    setIsLoading(false);
  }, [initialData]);

  // 🚀 SIMPLIFIED: Basic image click handler
  const handleImageClick = (_imgSrc: string) => {
    // TODO(@dev): Implement image click handler
  };

  // 🚀 DENO FRESH 2.3+ OPTIMIZATION: Simplified card component selection
  const CardComponent = useMemo(() => {
    // For /src20 page, use full-size cards
    if (fromPage === "src20" || fromPage === "stamping/src20") {
      return viewType === "minted" ? SRC20Overview : SRC20Minting;
    }
    // For other pages (home, wallet), use small cards
    return viewType === "minted" ? SRC20OverviewCompact : SRC20MintingCompact;
  }, [viewType, fromPage]);

  // 🚀 PREACT OPTIMIZATION: Memoized card props
  const cardProps = useMemo(() => ({
    data: processedData,
    fromPage,
    ...(timeframe && { timeframe }), // Only pass timeframe if it exists
    onImageClick: handleImageClick,
    ...(currentSort && { currentSort }), // Only pass currentSort if it exists
  }), [processedData, fromPage, timeframe, handleImageClick, currentSort]);

  // Always call hooks at the top level
  const skeletonClasses = useLoadingSkeleton(
    isLoading,
    "src20-skeleton h-[400px]",
  );

  if (isLoading) {
    return <div class={skeletonClasses} />;
  }

  return (
    <div class="w-full">
      {title && (
        <h1
          class={`${titlePrimary} ${
            fromPage === "home" && viewType === "minting" ? "opacity-0" : ""
          }`}
        >
          {title}
        </h1>
      )}
      {subTitle && (
        <h2
          class={`${subtitlePrimary} ${
            viewType === "minting" ? "text-left tablet:text-right" : ""
          }`}
        >
          {subTitle}
        </h2>
      )}

      <CardComponent {...cardProps} />

      {fromPage === "home" && (
        <div class="flex justify-end -mt-3">
          <ViewAllButton
            href={`/src20${viewType === "minting" ? "?viewType=minting" : ""}`}
          />
        </div>
      )}

      {pagination && (
        <PaginationButtons
          page={pagination.page}
          totalPages={pagination.totalPages}
          {...(fromPage === "wallet" ? { prefix: "src20" } : {})}
          {...(pagination.onPageChange
            ? { onPageChange: pagination.onPageChange }
            : {})}
        />
      )}
    </div>
  );
}
