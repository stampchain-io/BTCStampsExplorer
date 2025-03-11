import { useEffect, useState } from "preact/hooks";
import { useURLUpdate } from "$client/hooks/useURLUpdate.ts";
import { Button } from "$components/shared/Button.tsx";

interface SortProps {
  initSort?: "ASC" | "DESC" | undefined;
  onChangeSort?: (newSort: "ASC" | "DESC") => void;
  sortParam?: string;
  searchparams: URLSearchParams;
}

export function MultiSort(
  { initSort = "ASC", onChangeSort, sortParam = "sortBy", searchparams }:
    SortProps,
) {
  const [open, setOpen] = useState<boolean>(false);
  const [sort, setSort] = useState<"ASC" | "DESC">(
    searchparams.get("sortOrder")?.includes("asc") ? "ASC" : "DESC",
  );
  const [option, setOption] = useState<"stamp" | "price">(
    searchparams.get("sortOrder")?.includes("index") ? "stamp" : "price",
  );

  const { updateURL } = useURLUpdate();

  const handleOption = (selected: "stamp" | "price") => {
    setOption(selected);
    setOpen(false);
  };

  // useEffect(() => {
  //   if (initSort) {
  //     setSort(initSort);
  //   }
  // }, [initSort]);

  useEffect(() => {
    updateURL({ [sortParam]: sort });
  }, [sort, sortParam]);

  const handleMultiSort = () => {
    const url = new URL(globalThis.location.href);
    const currentSort = url.searchParams.get("sortOrder");

    // Define sort mapping for each option
    const sortMap: Record<string, { asc: string; desc: string }> = {
      stamp: { asc: "index_asc", desc: "index_desc" },
      price: { asc: "price_asc", desc: "price_desc" },
    };

    if (!option || !sortMap[option]) return;

    // Toggle sorting order
    const isAscending = currentSort === sortMap[option].asc;
    const newParam = isAscending ? sortMap[option].desc : sortMap[option].asc;
    const newSort = isAscending ? "DESC" : "ASC";

    // Update state and trigger callback
    setSort(newSort);
    onChangeSort?.(newSort);

    // Update URL and reload page
    url.searchParams.set("sortOrder", newParam);
    globalThis.location.href = url.toString();
  };

  return (
    <div class="row flex relative">
      <Button
        onClick={() => setOpen(!open)}
        data-dropdown-toggle="sort-dropdown"
        class="flex items-center justify-center bg-transparent hover:bg-transparent text-stamp-grey border-r-0 w-auto h-[30px] mobileLg:h-9 p-0 px-1 border-2 border-stamp-purple hover:border-stamp-purple-bright group cursor-pointer rounded-md rounded-r-none"
      >
        {option}
      </Button>
      <Button
        variant="icon"
        class="rounded-md rounded-l-none"
        icon={sort === "DESC"
          ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 32 32"
              role="button"
              aria-label="Sort ascending"
            >
              <path d="M16 16C16 16.3978 15.842 16.7794 15.5607 17.0607C15.2794 17.342 14.8978 17.5 14.5 17.5H6C5.60218 17.5 5.22064 17.342 4.93934 17.0607C4.65804 16.7794 4.5 16.3978 4.5 16C4.5 15.6022 4.65804 15.2206 4.93934 14.9393C5.22064 14.658 5.60218 14.5 6 14.5H14.5C14.8978 14.5 15.2794 14.658 15.5607 14.9393C15.842 15.2206 16 15.6022 16 16ZM6 9.5H22.5C22.8978 9.5 23.2794 9.34196 23.5607 9.06066C23.842 8.77936 24 8.39782 24 8C24 7.60218 23.842 7.22064 23.5607 6.93934C23.2794 6.65804 22.8978 6.5 22.5 6.5H6C5.60218 6.5 5.22064 6.65804 4.93934 6.93934C4.65804 7.22064 4.5 7.60218 4.5 8C4.5 8.39782 4.65804 8.77936 4.93934 9.06066C5.22064 9.34196 5.60218 9.5 6 9.5ZM12.5 22.5H6C5.60218 22.5 5.22064 22.658 4.93934 22.9393C4.65804 23.2206 4.5 23.6022 4.5 24C4.5 24.3978 4.65804 24.7794 4.93934 25.0607C5.22064 25.342 5.60218 25.5 6 25.5H12.5C12.8978 25.5 13.2794 25.342 13.5607 25.0607C13.842 24.7794 14 24.3978 14 24C14 23.6022 13.842 23.2206 13.5607 22.9393C13.2794 22.658 12.8978 22.5 12.5 22.5ZM29.0613 19.9387C28.9219 19.7989 28.7563 19.688 28.574 19.6122C28.3917 19.5365 28.1962 19.4976 27.9988 19.4976C27.8013 19.4976 27.6059 19.5365 27.4235 19.6122C27.2412 19.688 27.0756 19.7989 26.9363 19.9387L24.5 22.375V14C24.5 13.6022 24.342 13.2206 24.0607 12.9393C23.7794 12.658 23.3978 12.5 23 12.5C22.6022 12.5 22.2206 12.658 21.9393 12.9393C21.658 13.2206 21.5 13.6022 21.5 14V22.375L19.0613 19.935C18.7795 19.6532 18.3973 19.4949 17.9988 19.4949C17.6002 19.4949 17.218 19.6532 16.9363 19.935C16.6545 20.2168 16.4961 20.599 16.4961 20.9975C16.4961 21.396 16.6545 21.7782 16.9363 22.06L21.9363 27.06C22.0756 27.1998 22.2412 27.3108 22.4235 27.3865C22.6059 27.4622 22.8013 27.5012 22.9988 27.5012C23.1962 27.5012 23.3917 27.4622 23.574 27.3865C23.7563 27.3108 23.9219 27.1998 24.0613 27.06L29.0613 22.06C29.3425 21.7787 29.5006 21.3972 29.5006 20.9994C29.5006 20.6016 29.3425 20.2201 29.0613 19.9387Z" />
            </svg>
          )
          : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 32 32"
              role="button"
              aria-label="Sort descending"
            >
              <path d="M4.5 16C4.5 15.6022 4.65804 15.2206 4.93934 14.9393C5.22064 14.658 5.60218 14.5 6 14.5H14.5C14.8978 14.5 15.2794 14.658 15.5607 14.9393C15.842 15.2206 16 15.6022 16 16C16 16.3978 15.842 16.7793 15.5607 17.0607C15.2794 17.342 14.8978 17.5 14.5 17.5H6C5.60218 17.5 5.22064 17.342 4.93934 17.0607C4.65804 16.7793 4.5 16.3978 4.5 16ZM6 9.49999H12.5C12.8978 9.49999 13.2794 9.34196 13.5607 9.06065C13.842 8.77935 14 8.39782 14 7.99999C14 7.60217 13.842 7.22064 13.5607 6.93933C13.2794 6.65803 12.8978 6.49999 12.5 6.49999H6C5.60218 6.49999 5.22064 6.65803 4.93934 6.93933C4.65804 7.22064 4.5 7.60217 4.5 7.99999C4.5 8.39782 4.65804 8.77935 4.93934 9.06065C5.22064 9.34196 5.60218 9.49999 6 9.49999ZM22.5 22.5H6C5.60218 22.5 5.22064 22.658 4.93934 22.9393C4.65804 23.2206 4.5 23.6022 4.5 24C4.5 24.3978 4.65804 24.7793 4.93934 25.0606C5.22064 25.342 5.60218 25.5 6 25.5H22.5C22.8978 25.5 23.2794 25.342 23.5607 25.0606C23.842 24.7793 24 24.3978 24 24C24 23.6022 23.842 23.2206 23.5607 22.9393C23.2794 22.658 22.8978 22.5 22.5 22.5ZM29.0613 9.93874L24.0613 4.93874C23.9219 4.7989 23.7563 4.68795 23.574 4.61224C23.3917 4.53653 23.1962 4.49756 22.9988 4.49756C22.8013 4.49756 22.6059 4.53653 22.4235 4.61224C22.2412 4.68795 22.0756 4.7989 21.9363 4.93874L16.9363 9.93874C16.6545 10.2205 16.4961 10.6027 16.4961 11.0012C16.4961 11.3998 16.6545 11.7819 16.9363 12.0637C17.218 12.3455 17.6002 12.5038 17.9988 12.5038C18.3973 12.5038 18.7795 12.3455 19.0613 12.0637L21.5 9.62499V18C21.5 18.3978 21.658 18.7793 21.9393 19.0607C22.2206 19.342 22.6022 19.5 23 19.5C23.3978 19.5 23.7794 19.342 24.0607 19.0607C24.342 18.7793 24.5 18.3978 24.5 18V9.62499L26.9387 12.065C27.0783 12.2045 27.2439 12.3152 27.4262 12.3907C27.6085 12.4662 27.8039 12.5051 28.0012 12.5051C28.1986 12.5051 28.394 12.4662 28.5763 12.3907C28.7586 12.3152 28.9242 12.2045 29.0637 12.065C29.2033 11.9255 29.314 11.7598 29.3895 11.5775C29.465 11.3952 29.5039 11.1998 29.5039 11.0025C29.5039 10.8052 29.465 10.6098 29.3895 10.4275C29.314 10.2452 29.2033 10.0795 29.0637 9.93999L29.0613 9.93874Z" />
            </svg>
          )}
        iconAlt={`Sort ${sort === "DESC" ? "ascending" : "descending"}`}
        onClick={handleMultiSort}
      />
      <div
        id="sort-dropdown"
        class={`z-10 ${
          open ? "" : "hidden"
        } bg-stamp-purple-darkest border-2 border-stamp-purple hover:border-stamp-purple-bright rounded-lg shadow-sm w-[11.8rem] absolute top-9`}
      >
        <ul
          class="py-2 text-sm text-gray-700 dark:text-gray-200"
          aria-labelledby="dropdownDefaultButton"
        >
          <li>
            <a
              href="#"
              class="block px-4 py-2 hover:bg-stamp-primary-light text-stamp-grey"
              onClick={() => handleOption("stamp")}
            >
              Stamp
            </a>
          </li>
          <li>
            <a
              href="#"
              class="block px-4 py-2 hover:bg-stamp-primary-light text-stamp-grey"
              onClick={() => handleOption("price")}
            >
              Price
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
