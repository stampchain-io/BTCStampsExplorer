export function PageControl(
  { page, pages, page_size, type = "stamp" }: {
    page: number;
    pages: number;
    page_size: number;
    type: "cursed" | "stamp";
  },
) {
  const maxPagesToShow = 5;
  const currentPage = page;
  const totalPages = pages;
  const startPage = Math.max(1, currentPage - maxPagesToShow);
  const endPage = Math.min(totalPages, currentPage + maxPagesToShow);
  const pageItems = [];

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
  );
}
