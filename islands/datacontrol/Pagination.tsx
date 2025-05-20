import { useEffect, useState } from "preact/hooks";
import { PaginationProps } from "$types/pagination.d.ts";

// Update pagination range constants
const MOBILESM_MAX_PAGE_RANGE = 0;
const MOBILEMD_MAX_PAGE_RANGE = 2;
const TABLET_MAX_PAGE_RANGE = 3;
const DESKTOP_MAX_PAGE_RANGE = 4;

const navArrow = `
  flex items-center justify-center
  w-9 h-9 rounded-md hover:bg-stamp-purple-bright`;
const navContent = `
  flex items-center justify-center
  h-9 desktop:pt-0.5 px-[14px] rounded-md hover:bg-stamp-purple-bright
  font-medium text-black text-sm leading-[16.5px]`;

// Update useIsMobile to handle multiple breakpoints
const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState("mobileSm");

  useEffect(() => {
    const handleResize = () => {
      const width = globalThis.innerWidth;
      if (width < 568) {
        setScreenSize("mobileSm");
      } else if (width < 768) {
        setScreenSize("mobileMd");
      } else if (width < 1024) {
        setScreenSize("mobileLg");
      } else {
        setScreenSize("tablet");
      }
    };

    handleResize();
    globalThis.addEventListener("resize", handleResize);
    return () => globalThis.removeEventListener("resize", handleResize);
  }, []);

  return screenSize;
};

export function Pagination({
  page,
  totalPages,
  prefix = "",
  onPageChange,
}: PaginationProps) {
  const screenSize = useScreenSize();

  // Update maxPageRange logic based on screen size
  const getMaxPageRange = (size: string) => {
    switch (size) {
      case "mobileSm":
        return MOBILESM_MAX_PAGE_RANGE;
      case "mobileMd":
        return MOBILEMD_MAX_PAGE_RANGE;
      case "mobileLg":
        return TABLET_MAX_PAGE_RANGE;
      case "tablet":
        return DESKTOP_MAX_PAGE_RANGE;
      default:
        return MOBILESM_MAX_PAGE_RANGE;
    }
  };

  const maxPageRange = getMaxPageRange(screenSize);

  const handlePageChange = (newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage);
      return;
    }

    // Legacy URL-based navigation if no onPageChange provided
    const url = new URL(globalThis.location.href);
    url.searchParams.set(
      prefix ? `${prefix}_page` : "page",
      newPage.toString(),
    );
    globalThis.location.href = url.toString();
  };

  const renderPageButton = (pageNum: number, icon?: string) => {
    const isCurrentPage = pageNum === page;
    // Use navArrow class for caret buttons, otherwise use navContent
    const baseClass = icon ? navArrow : navContent;
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
        {icon
          ? (
            <img
              src={`/img/datacontrol/${icon}.svg`}
              alt={`arrow ${icon.toLowerCase()}`}
              class="w-4 h-4"
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
    <nav aria-label="Page navigation" class="flex items-center justify-center">
      <ul class="inline-flex items-center -space-x-px gap-3">
        {/* First and Previous */}
        {page > 1 && (
          <>
            {renderPageButton(1, "CaretDoubleLeft")}
            {renderPageButton(page - 1, "CaretLeft")}
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
        {Array.from({ length: endPage - startPage + 1 }, (_, i) =>
          startPage + i)
          .map((pageNum) =>
            renderPageButton(pageNum)
          )}

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
            {renderPageButton(page + 1, "CaretRight")}
            {renderPageButton(totalPages, "CaretDoubleRight")}
          </>
        )}
      </ul>
    </nav>
  );
}
