import { useNavigator } from "$islands/Navigator/navigator.tsx";
import { StampCard } from "$components/StampCard.tsx";
import { StampRow } from "globals";
import { useEffect, useState } from "preact/hooks";

const sortData = (stamps: StampRow[], sortBy: string) => {
  if (sortBy == "Supply") {
    return [...stamps.sort((a: StampRow, b: StampRow) => a.supply - b.supply)];
  } else if (sortBy == "Block") {
    return [
      ...stamps.sort((a: StampRow, b: StampRow) =>
        a.block_index - b.block_index
      ),
    ];
  } else if (sortBy == "Stamp") {
    return [...stamps.sort((a: StampRow, b: StampRow) => a.stamp - b.stamp)];
  } else return [...stamps];
};

const filterData = (stamps: StampRow[], filterBy: string[]) => {
  if (filterBy.length == 0) {
    return stamps;
  }
  return stamps.filter((stamp) =>
    filterBy.find((option) =>
      stamp.stamp_mimetype.indexOf(option.toLowerCase()) >= 0
    ) != null
  );
};

export function PageControl(
  { page, pages, page_size, type = "stamp", stamps = [] }: {
    page: number;
    pages: number;
    page_size: number;
    type: "cursed" | "stamp";
    stamps: [];
  },
) {
  const maxPagesToShow = 5;
  const currentPage = page;
  const totalPages = pages;
  const startPage = Math.max(1, currentPage - maxPagesToShow);
  const endPage = Math.min(totalPages, currentPage + maxPagesToShow);
  const pageItems = [];
  const { filterOption, sortOption } = useNavigator();
  const [content, setContent] = useState<StampRow[]>([]);

  useEffect(() => {
    if (stamps.length > 0) {
      console.log(filterOption);
      setContent(filterData(sortData(stamps, sortOption), filterOption));
      console.log("sortby ", sortOption, sortData(stamps, sortOption)[0]);
    }
  }, [sortOption, filterOption]);

  for (let p = startPage; p <= endPage; p++) {
    pageItems.push(
      <li key={p}>
        <a
          href={`/${type}?page=${p}&limit=${page_size}`}
          f-partial={`/${type}?page=${p}&limit=${page_size}`}
          class={`flex items-center justify-center px-3 h-8 leading-tight font-medium hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-white
            ${
            currentPage === p
              ? "bg-white text-gray-800 dark:bg-gray-400 dark:text-black font-semibold"
              : "text-gray-500 bg-white dark:text-gray-400 dark:bg-gray-800"
          }`}
        >
          {p}
        </a>
      </li>,
    );
  }

  return (
    <>
      <nav aria-label="Page navigation">
        <ul class="inline-flex items-center -space-x-px text-sm">
          <li>
            <a
              href={`/${type}?page=1&limit=${page_size}`}
              f-partial={`/${type}?page=1&limit=${page_size}`}
              class="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-r-0 border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              {"<<"}
            </a>
          </li>
          <li>
            <a
              href={`/${type}?page=${
                Math.max(1, currentPage - 1)
              }&limit=${page_size}`}
              f-partial={`/${type}?page=${
                Math.max(1, currentPage - 1)
              }&limit=${page_size}`}
              class="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-r-0 border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              {"<"}
            </a>
          </li>
          {pageItems}
          <li>
            <a
              href={`/${type}?page=${
                Math.min(totalPages, currentPage + 1)
              }&limit=${page_size}`}
              f-partial={`/${type}?page=${
                Math.min(totalPages, currentPage + 1)
              }&limit=${page_size}`}
              class="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              {">"}
            </a>
          </li>
          <li>
            <a
              href={`/${type}?page=${totalPages}&limit=${page_size}`}
              f-partial={`/${type}?page=${totalPages}&limit=${page_size}`}
              class="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-l-0 border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              {">>"}
            </a>
          </li>
        </ul>
      </nav>
      <div name="stamps">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 py-6 transition-opacity duration-700 ease-in-out">
          {content.map((stamp: StampRow) => (
            <StampCard stamp={stamp} kind="stamp" />
          ))}
        </div>
      </div>
    </>
  );
}
