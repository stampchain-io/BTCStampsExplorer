/**
 * Example migration of Pagination component to use SSR-safe navigation
 * This shows how to migrate from direct globalThis.location usage
 */

import { Icon } from "$icon";
import { safeNavigate } from "$utils/navigation/freshNavigationUtils.ts";
import type { JSX } from "preact";

interface PaginationProps {
  page: number;
  totalPages: number;
  maxPageRange?: number;
  onPageChange?: (page: number) => void;
  prefix?: string;
  class?: string;
}

export const PaginationSSRSafe = ({
  page,
  totalPages,
  maxPageRange = 2,
  onPageChange,
  prefix,
  class: className = "",
}: PaginationProps): JSX.Element | null => {
  const navArrow =
    "rounded-none border-none h-6 w-6 hover:bg-stamp-purple-md active:bg-stamp-purple-dark transition-all flex items-center justify-center text-white";
  const navContent =
    "min-w-8 text-xs font-semibold font-mono hover:bg-stamp-purple-md rounded-none active:bg-stamp-purple-dark border-none text-center py-1 px-2 text-white transition-all";

  const handlePageChange = (newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage);
      return;
    }

    // Use Fresh partial navigation if available, fallback to URL parameter update
    const url = new URL(globalThis.location?.href || "http://localhost:8000");
    const paramName = prefix ? `${prefix}_page` : "page";
    url.searchParams.set(paramName, newPage.toString());

    // Try Fresh partial navigation first
    safeNavigate(url.toString());
  };

  const renderPageButton = (pageNum: number, iconName?: string) => {
    const isCurrentPage = pageNum === page;
    const baseClass = iconName ? navArrow : navContent;
    const buttonClass = isCurrentPage
      ? `${baseClass} bg-stamp-purple`
      : `${baseClass} bg-stamp-purple-dark`;

    return (
      <button
        type="button"
        class={buttonClass}
        onClick={() => handlePageChange(pageNum)}
        disabled={isCurrentPage}
      >
        {iconName
          ? (
            <Icon
              type="icon"
              name={iconName}
              weight="bold"
              size="xxs"
              color="custom"
              className="stroke-black"
            />
          )
          : <span>{pageNum}</span>}
      </button>
    );
  };

  if (totalPages <= 1) return null;

  // Calculate the range of pages to show
  let startPage = Math.max(1, page - maxPageRange);
  let endPage = Math.min(totalPages, page + maxPageRange);

  // Adjust the range if we're near the start or end
  if (page <= maxPageRange) {
    endPage = Math.min(totalPages, maxPageRange * 2 + 1);
  }
  if (page > totalPages - maxPageRange) {
    startPage = Math.max(1, totalPages - maxPageRange * 2);
  }

  return (
    <nav
      aria-label="Page navigation"
      class={`flex items-center justify-center ${className}`}
    >
      <ul class="inline-flex items-center -space-x-px gap-3">
        {/* First and Previous */}
        {page > 1 && (
          <>
            {renderPageButton(1, "caretDoubleLeft")}
            {renderPageButton(page - 1, "caretLeft")}
          </>
        )}

        {/* Show ellipsis if there are pages before the range */}
        {startPage > 1 && (
          <>
            {page < 1 && renderPageButton(1)}
            <span class="text-stamp-purple-dark">...</span>
          </>
        )}

        {/* Page numbers */}
        {Array.from(
          { length: endPage - startPage + 1 },
          (_, i) => startPage + i,
        )
          .map((pageNum) => renderPageButton(pageNum))}

        {/* Show ellipsis if there are pages after the range */}
        {endPage < totalPages && (
          <>
            <span class="text-stamp-purple-dark">...</span>
            {page > totalPages && renderPageButton(totalPages)}
          </>
        )}

        {/* Next and Last */}
        {page < totalPages && (
          <>
            {renderPageButton(page + 1, "caretRight")}
            {renderPageButton(totalPages, "caretDoubleRight")}
          </>
        )}
      </ul>
    </nav>
  );
};
