import { h } from "preact";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { useNavigator } from "$islands/Navigator/NavigatorProvider.tsx";
import { useURLUpdate } from "$lib/hooks/useURLUpdate.ts";

const MOBILE_MAX_PAGE_RANGE = 2;
const DESKTOP_MAX_PAGE_RANGE = 4;

const navArrow = `
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

interface PaginationProps {
  page: number;
  pages: number;
  page_size: number;
  type: string;
  data_length: number;
  prefix?: string;
  onChange?: (page: number) => void;
  onPageChange?: (page: number) => void;
}

export const Pagination = (
  {
    page,
    pages,
    page_size,
    type = "stamp",
    data_length,
    prefix,
    onChange,
    onPageChange,
  }: PaginationProps,
) => {
  const isMobile = useIsMobile();
  const maxPagesToShow = isMobile
    ? MOBILE_MAX_PAGE_RANGE
    : DESKTOP_MAX_PAGE_RANGE;
  const [currentPage, setCurrentPage] = useState(page);
  const totalPages = pages;
  const { getSort, getFilter, getType } = useNavigator();
  const [isClient, setIsClient] = useState(false);
  const _prefix = prefix ? `${prefix}_` : "";
  const { updateURL } = useURLUpdate();

  useEffect(() => {
    setCurrentPage(page);
    setIsClient(true);
  }, [page]);

  const handlePageChange = useCallback((pageNum: number) => {
    setCurrentPage(pageNum);
    const params: Record<string, string> = {
      [`${_prefix}page`]: pageNum.toString(),
      [`${_prefix}limit`]: page_size.toString(),
      anchor: prefix || "",
      type: getType(),
      sortBy: getSort(),
    };

    const filterBy = getFilter().join(",");
    if (filterBy) {
      params.filterBy = filterBy;
    }

    updateURL(params);
    onChange?.(pageNum);
    onPageChange?.(pageNum);
  }, [
    _prefix,
    page_size,
    prefix,
    getType,
    getSort,
    getFilter,
    updateURL,
    onChange,
    onPageChange,
  ]);

  const buildPageUrl = useCallback((pageNum: number) => {
    if (!isClient) {
      return `/${type}?page=${pageNum}`;
    }

    const url = new URL(globalThis.location.href);
    url.searchParams.set(`${_prefix}page`, pageNum.toString());
    url.searchParams.set(`${_prefix}limit`, page_size.toString());
    return url.toString();
  }, [isClient, type, page_size, _prefix]);

  const renderPageLink = (pageNum: number, icon: string) => (
    <li key={icon}>
      <a
        href={buildPageUrl(pageNum)}
        onClick={(e) => {
          e.preventDefault();
          handlePageChange(pageNum);
        }}
        class={navArrowClassName}
      >
        <img
          src={`/img/datacontrol/${icon}.svg`}
          alt={`arrow ${icon.toLowerCase()}`}
          class="w-[14px] h-[14px] mobileLg:w-[18px] mobileLg:h-[18px]"
        />
      </a>
    </li>
  );

  const [pageItems] = useMemo(() => {
    const startPage = Math.max(1, currentPage - maxPagesToShow);
    const endPage = Math.min(totalPages, currentPage + maxPagesToShow);
    const items = [];

    for (let p = startPage; p <= endPage; p++) {
      const pageUrl = buildPageUrl(p);
      items.push(
        <li key={p}>
          <a
            href={pageUrl}
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(p);
            }}
            class={navContentClassName + " " +
              (currentPage === p
                ? " bg-stamp-purple "
                : " bg-stamp-purple-dark")}
          >
            {p}
          </a>
        </li>,
      );
    }
    return [items];
  }, [currentPage, totalPages, maxPagesToShow, buildPageUrl, handlePageChange]);

  if (totalPages === 1) return null;

  if (data_length === 0) return null;

  return (
    <nav
      aria-label="Page navigation"
      class="flex items-center justify-center"
    >
      <ul class="inline-flex items-center -space-x-px gap-[9px] mobileLg:gap-3">
        {currentPage !== 1 && (
          <>
            {renderPageLink(1, "CaretDoubleLeft")}
            {renderPageLink(Math.max(1, currentPage - 1), "CaretLeft")}
          </>
        )}
        {pageItems}
        {currentPage < totalPages && (
          <>
            {renderPageLink(
              Math.min(totalPages, currentPage + 1),
              "CaretRight",
            )}
            {renderPageLink(totalPages, "CaretDoubleRight")}
          </>
        )}
      </ul>
    </nav>
  );
};
