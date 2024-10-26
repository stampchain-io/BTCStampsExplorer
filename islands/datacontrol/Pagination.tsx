import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { useNavigator } from "$islands/Navigator/NavigatorProvider.tsx";

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

export const Pagination = (
  { page, pages, page_size, type = "stamp", data_length }: {
    page: number;
    pages: number;
    page_size: number;
    type: string;
    data_length: number;
  },
) => {
  const isMobile = useIsMobile();
  const maxPagesToShow = isMobile ? 2 : 4;
  const [currentPage, setCurrentPage] = useState(page);
  const totalPages = pages;
  const { getSort, getFilter, getType } = useNavigator();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setCurrentPage(page);
    setIsClient(true);
  }, [page]);

  const buildPageUrl = useCallback((pageNum: number) => {
    if (!isClient) {
      return `/${type}?page=${pageNum}`;
    }

    const url = new URL(globalThis.location.href);
    url.searchParams.set("page", pageNum.toString());
    url.searchParams.set("limit", page_size.toString());

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

  const pageItems = useMemo(() => {
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
            class={`rounded-md flex items-center justify-center px-3 h-9 w-9 leading-tight font-semibold text-[#080808] 
              ${currentPage === p ? "bg-[#660099] " : "bg-[#440066]"}`}
          >
            {p}
          </a>
        </li>,
      );
    }
    return items;
  }, [currentPage, totalPages, maxPagesToShow, buildPageUrl]);

  if (data_length === 0) return null;

  return (
    <nav
      aria-label="Page navigation"
      className="flex items-center justify-center"
    >
      <ul class="inline-flex items-center -space-x-px text-sm gap-2">
        <li>
          <a
            href={buildPageUrl(1)}
            f-partial={buildPageUrl(1)}
            class="flex items-center justify-center px-3 leading-tight bg-[#440066] text-[#080808] rounded-md h-9 w-9"
          >
            {"<<"}
          </a>
        </li>
        <li>
          <a
            href={buildPageUrl(Math.max(1, currentPage - 1))}
            f-partial={buildPageUrl(Math.max(1, currentPage - 1))}
            class="flex items-center justify-center px-3 leading-tight bg-[#440066] text-[#080808] rounded-md h-9 w-9"
          >
            {"<"}
          </a>
        </li>
        {pageItems}
        <li>
          <a
            href={buildPageUrl(Math.min(totalPages, currentPage + 1))}
            f-partial={buildPageUrl(Math.min(totalPages, currentPage + 1))}
            class="flex items-center justify-center px-3 leading-tight bg-[#440066] text-[#080808] rounded-md h-9 w-9"
          >
            {">"}
          </a>
        </li>
        <li>
          <a
            href={buildPageUrl(totalPages)}
            f-partial={buildPageUrl(totalPages)}
            class="flex items-center justify-center px-3 leading-tight bg-[#440066] text-[#080808] rounded-md h-9 w-9"
          >
            {">>"}
          </a>
        </li>
      </ul>
    </nav>
  );
};
