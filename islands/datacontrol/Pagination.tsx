import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { useNavigator } from "$islands/Navigator/NavigatorProvider.tsx";

const MOBILE_MAX_PAGE_RANGE = 2;
const DESKTOP_MAX_PAGE_RANGE = 4;

const navArrowClassName = `
  flex items-center justify-center
  bg-stamp-purple-dark hover:bg-stamp-primary-hover rounded-md
  w-7 h-7 mobileLg:h-9 mobileLg:w-9`;
const navContentClassName = `
  flex items-center justify-center
  w-7 h-7 mobileLg:h-9 mobileLg:w-9 rounded-md hover:bg-stamp-primary-hover
  text-sm leading-[16.5px] mobileLg:text-base mobileLg:leading-[19px]
  font-medium font-work-sans text-stamp-bg-grey-darkest`;

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
}

export const Pagination = (
  { page, pages, page_size, type = "stamp", data_length, prefix }:
    PaginationProps,
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

  useEffect(() => {
    setCurrentPage(page);
    setIsClient(true);
  }, [page]);

  const buildPageUrl = useCallback((pageNum: number) => {
    if (!isClient) {
      return `/${type}?page=${pageNum}`;
    }

    const url = new URL(globalThis.location.href);

    const stampsPage = url.searchParams.get("stamps_page");
    const stampsLimit = url.searchParams.get("stamps_limit");
    const src20Page = url.searchParams.get("src20_page");
    const src20Limit = url.searchParams.get("src20_limit");

    if (stampsPage && stampsLimit) {
      url.searchParams.set("stamps_page", stampsPage);
      url.searchParams.set("stamps_limit", stampsLimit);
    }
    if (src20Page && src20Limit) {
      url.searchParams.set("src20_page", src20Page);
      url.searchParams.set("src20_limit", src20Limit);
    }

    url.searchParams.set(`${_prefix}page`, pageNum.toString());
    url.searchParams.set(`${_prefix}limit`, page_size.toString());

    const currentType = url.searchParams.get("type") || getType();
    const currentSort = url.searchParams.get("sortBy") || getSort();
    const currentFilter = url.searchParams.get("filterBy") ||
      getFilter().join(",");

    url.searchParams.set("type", currentType);
    url.searchParams.set("sortBy", currentSort);
    if (currentFilter) {
      url.searchParams.set("filterBy", currentFilter);
    } else {
      url.searchParams.delete("filterBy");
    }

    return url.toString();
  }, [isClient, type, page_size, getSort, getFilter, getType]);

  const renderPageLink = (pageNum: number, icon: string) => (
    <li key={icon}>
      <a
        href={buildPageUrl(pageNum)}
        f-partial={buildPageUrl(pageNum)}
        class={navArrowClassName}
      >
        <img
          src={`/img/datacontrol/${icon}.svg`}
          alt={`arrow ${icon.toLowerCase()}`}
          class="w-[13px] h-[13px]"
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
            f-partial={pageUrl}
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
  }, [currentPage, totalPages, maxPagesToShow, buildPageUrl]);

  if (data_length === 0) return null;

  return (
    <nav
      aria-label="Page navigation"
      class="flex items-center justify-center"
    >
      <ul class="inline-flex items-center -space-x-px text-sm gap-2">
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
