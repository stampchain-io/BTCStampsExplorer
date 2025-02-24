import { useEffect, useState } from "preact/hooks";
import { PaginationProps } from "$types/pagination.d.ts";

const MOBILE_MAX_PAGE_RANGE = 2;
const DESKTOP_MAX_PAGE_RANGE = 4;

const _navArrow = `
  flex items-center justify-center
  bg-stamp-purple-dark hover:bg-stamp-primary-hover rounded-md
  w-7 h-7 mobileLg:h-9 mobileLg:w-9`;
const navContent = `
  flex items-center justify-center
  w-7 h-7 mobileLg:h-9 mobileLg:w-9 rounded-md hover:bg-stamp-primary-hover
  text-sm leading-[16.5px] mobileLg:text-base mobileLg:leading-[19px]
  font-medium text-black`;

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(globalThis.innerWidth < 768);
    };

    handleResize();
    globalThis.addEventListener("resize", handleResize);
    return () => globalThis.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
};

export function Pagination({
  page,
  totalPages,
  prefix = "",
  onPageChange,
}: PaginationProps) {
  const isMobile = useIsMobile();
  const maxPageRange = isMobile
    ? MOBILE_MAX_PAGE_RANGE
    : DESKTOP_MAX_PAGE_RANGE;

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
    const buttonClass = isCurrentPage
      ? `${navContent} bg-stamp-purple`
      : `${navContent} bg-stamp-purple-dark`;

    return (
      <button
        class={buttonClass}
        onClick={() => handlePageChange(pageNum)}
        disabled={isCurrentPage}
      >
        {icon
          ? (
            <img
              src={`/img/datacontrol/${icon}.svg`}
              alt={`arrow ${icon.toLowerCase()}`}
              class="w-[14px] h-[14px] mobileLg:w-[18px] mobileLg:h-[18px]"
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
      <ul class="inline-flex items-center -space-x-px gap-[9px] mobileLg:gap-3">
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
