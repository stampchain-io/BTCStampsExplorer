import { useEffect, useState } from "preact/hooks";
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
  const startPage = Math.max(1, currentPage - maxPagesToShow);
  const endPage = Math.min(totalPages, currentPage + maxPagesToShow);
  const pageItems = [];
  const { getSort, getFilter, getType } = useNavigator();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setCurrentPage(page);
    setIsClient(true);
  }, [page]);

  const buildPageUrl = (pageNum: number) => {
    if (!isClient) {
      return `/${type}?page=${pageNum}`;
    }

    const url = new URL(globalThis.location.href);
    url.searchParams.set("page", pageNum.toString());
    url.searchParams.set("limit", page_size.toString());

    // Preserve existing parameters
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
  };

  for (let p = startPage; p <= endPage; p++) {
    const pageUrl = buildPageUrl(p);
    pageItems.push(
      <li key={p}>
        <a
          href={pageUrl}
          f-partial={pageUrl}
          class={`flex items-center justify-center px-3 h-8 leading-tight font-semibold
            ${
            currentPage === p
              ? "bg-[#240048] text-white"
              : "bg-[#5E1BA1] text-[#EDEDED]"
          }`}
        >
          {p}
        </a>
      </li>,
    );
  }

  return (
    <>
      {(data_length != 0) && (
        <nav
          aria-label="Page navigation"
          className="flex items-center justify-center"
        >
          <ul class="inline-flex items-center -space-x-px text-sm gap-2">
            <li>
              <a
                href={buildPageUrl(1)}
                f-partial={buildPageUrl(1)}
                class="flex items-center justify-center px-3 h-8 leading-tight bg-[#5E1BA1] text-white"
              >
                {"<<"}
              </a>
            </li>
            <li>
              <a
                href={buildPageUrl(Math.max(1, currentPage - 1))}
                f-partial={buildPageUrl(Math.max(1, currentPage - 1))}
                class="flex items-center justify-center px-3 h-8 leading-tight bg-[#5E1BA1] text-white"
              >
                {"<"}
              </a>
            </li>
            {pageItems}
            <li>
              <a
                href={buildPageUrl(Math.min(totalPages, currentPage + 1))}
                f-partial={buildPageUrl(Math.min(totalPages, currentPage + 1))}
                class="flex items-center justify-center px-3 h-8 leading-tight bg-[#5E1BA1] text-white"
              >
                {">"}
              </a>
            </li>
            <li>
              <a
                href={buildPageUrl(totalPages)}
                f-partial={buildPageUrl(totalPages)}
                class="flex items-center justify-center px-3 h-8 leading-tight bg-[#5E1BA1] text-white"
              >
                {">>"}
              </a>
            </li>
          </ul>
        </nav>
      )}
    </>
  );
};
