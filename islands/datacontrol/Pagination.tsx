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
            class={`rounded-md flex items-center justify-center w-7 h-7 mobile-768:h-9 mobile-768:w-9 text-sm leading-[16.5px] mobile-768:text-base mobile-768:leading-[19px] font-medium font-work-sans text-[#080808] hover:bg-[#AA00FF] 
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
            class="flex items-center justify-center bg-[#440066] hover:bg-[#AA00FF] rounded-md w-7 h-7 mobile-768:h-9 mobile-768:w-9"
          >
            <img
              src="/img/datacontrol/CaretDoubleLeft.svg"
              alt="arrow double left"
              className="w-[13px] h-[13px]"
            />
          </a>
        </li>
        <li>
          <a
            href={buildPageUrl(Math.max(1, currentPage - 1))}
            f-partial={buildPageUrl(Math.max(1, currentPage - 1))}
            class="flex items-center justify-center bg-[#440066] hover:bg-[#AA00FF] rounded-md w-7 h-7 mobile-768:h-9 mobile-768:w-9"
          >
            <img
              src="/img/datacontrol/CaretLeft.svg"
              alt="arrow left"
              className="w-[13px] h-[13px]"
            />
          </a>
        </li>
        {pageItems}
        <li>
          <a
            href={buildPageUrl(Math.min(totalPages, currentPage + 1))}
            f-partial={buildPageUrl(Math.min(totalPages, currentPage + 1))}
            class="flex items-center justify-center bg-[#440066] hover:bg-[#AA00FF] rounded-md w-7 h-7 mobile-768:h-9 mobile-768:w-9"
          >
            <img
              src="/img/datacontrol/CaretRight.svg"
              alt="arrow right"
              className="w-[13px] h-[13px]"
            />
          </a>
        </li>
        <li>
          <a
            href={buildPageUrl(totalPages)}
            f-partial={buildPageUrl(totalPages)}
            class="flex items-center justify-center bg-[#440066] hover:bg-[#AA00FF] rounded-md w-7 h-7 mobile-768:h-9 mobile-768:w-9"
          >
            <img
              src="/img/datacontrol/CaretDoubleRight.svg"
              alt="arrow double right"
              className="w-[13px] h-[13px]"
            />
          </a>
        </li>
      </ul>
    </nav>
  );
};
