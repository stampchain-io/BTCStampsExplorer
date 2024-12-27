import { useEffect, useRef, useState } from "preact/hooks";
import { Button } from "$components/shared/Button.tsx";

export function SRC20SearchClient(
  { open2, handleOpen2 }: {
    open2: boolean;
    handleOpen2: (open: boolean) => void;
  },
) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open2) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [open2]);

  const handleSearch = async () => {
    if (searchTerm.trim()) {
      const response = await fetch(
        `/api/v2/src20/search?q=${encodeURIComponent(searchTerm.trim())}`,
      );
      const data = await response.json();
      setResults(data.data);
    } else {
      setResults([]);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearch();
    }, 300); // Debounce the search input by 300ms

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    const handleKeyboardShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleOpen2(true);
      }
      if (e.key === "Escape" && open2) {
        handleOpen2(false);
      }
    };

    document.addEventListener("keydown", handleKeyboardShortcut);
    return () =>
      document.removeEventListener("keydown", handleKeyboardShortcut);
  }, [open2]);

  const handleResultClick = (tick: string) => {
    globalThis.location.href = `/src20/${tick}`;
  };

  const modalBgBlur =
    "fixed inset-0 z-50 flex items-start tablet:items-center justify-center overflow-hidden bg-[#000000] bg-opacity-60 backdrop-filter backdrop-blur-md";

  const animatedInputContainer = `
    relative rounded-md !bg-[#100318]
    before:absolute before:inset-[-2px] before:rounded-md before:z-[1]
    before:bg-[conic-gradient(from_var(--angle),#660099,#8800CC,#AA00FF,#8800CC,#660099)]
    before:[--angle:0deg] before:animate-rotate
    hover:before:bg-[conic-gradient(from_var(--angle),#AA00FF,#AA00FF,#AA00FF,#AA00FF,#AA00FF)]
    focus-within:before:bg-[conic-gradient(from_var(--angle),#AA00FF,#AA00FF,#AA00FF,#AA00FF,#AA00FF)]
  `;

  return (
    <>
      <Button
        variant="icon"
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            class="fill-black"
            role="button"
            aria-label="Search"
          >
            <path d="M29.0611 26.9387L23.1248 21C24.9047 18.6805 25.7357 15.7709 25.4492 12.8614C25.1627 9.95181 23.7802 7.26016 21.5821 5.33244C19.3841 3.40471 16.535 2.38527 13.613 2.4809C10.6909 2.57653 7.9146 3.78008 5.84728 5.8474C3.77996 7.91472 2.57641 10.691 2.48078 13.6131C2.38514 16.5351 3.40459 19.3842 5.33231 21.5823C7.26004 23.7803 9.95169 25.1628 12.8613 25.4493C15.7708 25.7358 18.6804 24.9048 20.9998 23.125L26.9411 29.0674C27.0806 29.207 27.2463 29.3177 27.4286 29.3932C27.6109 29.4687 27.8063 29.5076 28.0036 29.5076C28.2009 29.5076 28.3963 29.4687 28.5786 29.3932C28.7609 29.3177 28.9265 29.207 29.0661 29.0674C29.2056 28.9279 29.3163 28.7623 29.3918 28.58C29.4673 28.3977 29.5062 28.2023 29.5062 28.0049C29.5062 27.8076 29.4673 27.6122 29.3918 27.4299C29.3163 27.2476 29.2056 27.082 29.0661 26.9424L29.0611 26.9387ZM5.49983 14C5.49983 12.3188 5.99835 10.6754 6.93234 9.2776C7.86633 7.87979 9.19385 6.79032 10.747 6.14698C12.3002 5.50363 14.0093 5.3353 15.6581 5.66328C17.3069 5.99125 18.8215 6.8008 20.0102 7.98954C21.199 9.17829 22.0085 10.6928 22.3365 12.3417C22.6645 13.9905 22.4961 15.6996 21.8528 17.2528C21.2095 18.8059 20.12 20.1334 18.7222 21.0674C17.3244 22.0014 15.681 22.5 13.9998 22.5C11.7462 22.4976 9.58554 21.6014 7.99198 20.0078C6.39842 18.4142 5.50215 16.2536 5.49983 14Z" />
          </svg>
        }
        iconAlt="Search"
        class="hover:bg-stamp-purple-bright hover:border-stamp-purple-bright cursor-pointer"
        onClick={() => handleOpen2(true)}
        role="button"
        aria-label="Search"
      />

      {open2 && (
        <div
          class={modalBgBlur}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleOpen2(false);
          }}
        >
          <div
            class="w-[90%] max-w-[600px] mt-[72px] tablet:mt-0"
            ref={searchContainerRef}
          >
            <div className={animatedInputContainer}>
              <div class="relative group [&>input:focus~div>svg]:fill-stamp-purple-bright">
                <input
                  type="text"
                  placeholder="TICKER, TX HASH OR ADDY"
                  value={searchTerm}
                  onInput={(e) =>
                    setSearchTerm((e.target as HTMLInputElement).value)}
                  class="relative z-[2] h-[54px] mobileLg:h-[60px] w-full !bg-[#100318] rounded-md pl-6 pr-14 text-base mobileLg:text-lg font-light text-stamp-grey-light placeholder:!bg-[#100318] placeholder:!text-stamp-grey outline-none focus:!bg-[#100318] no-outline"
                  autoFocus
                />
                <div class="absolute z-[3] right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 32 32"
                    class="w-6 h-6 fill-stamp-purple group-hover:fill-stamp-purple-bright"
                    aria-hidden="true"
                  >
                    <path d="M29.0611 26.9387L23.1248 21C24.9047 18.6805 25.7357 15.7709 25.4492 12.8614C25.1627 9.95181 23.7802 7.26016 21.5821 5.33244C19.3841 3.40471 16.535 2.38527 13.613 2.4809C10.6909 2.57653 7.9146 3.78008 5.84728 5.8474C3.77996 7.91472 2.57641 10.691 2.48078 13.6131C2.38514 16.5351 3.40459 19.3842 5.33231 21.5823C7.26004 23.7803 9.95169 25.1628 12.8613 25.4493C15.7708 25.7358 18.6804 24.9048 20.9998 23.125L26.9411 29.0674C27.0806 29.207 27.2463 29.3177 27.4286 29.3932C27.6109 29.4687 27.8063 29.5076 28.0036 29.5076C28.2009 29.5076 28.3963 29.4687 28.5786 29.3932C28.7609 29.3177 28.9265 29.207 29.0661 29.0674C29.2056 28.9279 29.3163 28.7623 29.3918 28.58C29.4673 28.3977 29.5062 28.2023 29.5062 28.0049C29.5062 27.8076 29.4673 27.6122 29.3918 27.4299C29.3163 27.2476 29.2056 27.082 29.0661 26.9424L29.0611 26.9387ZM5.49983 14C5.49983 12.3188 5.99835 10.6754 6.93234 9.2776C7.86633 7.87979 9.19385 6.79032 10.747 6.14698C12.3002 5.50363 14.0093 5.3353 15.6581 5.66328C17.3069 5.99125 18.8215 6.8008 20.0102 7.98954C21.199 9.17829 22.0085 10.6928 22.3365 12.3417C22.6645 13.9905 22.4961 15.6996 21.8528 17.2528C21.2095 18.8059 20.12 20.1334 18.7222 21.0674C17.3244 22.0014 15.681 22.5 13.9998 22.5C11.7462 22.4976 9.58554 21.6014 7.99198 20.0078C6.39842 18.4142 5.50215 16.2536 5.49983 14Z" />
                  </svg>
                </div>
                {results.length > 0 && (
                  <ul class="absolute top-full left-0 right-0 mt-2 !bg-[#100318] rounded-md border-2 border-stamp-purple-bright text-stamp-grey-light font-bold text-base leading-tight z-20 max-h-[240px] overflow-y-auto scrollbar-purple">
                    {results.map((result) => (
                      <li
                        key={result.tick}
                        onClick={() => handleResultClick(result.tick)}
                        class="cursor-pointer px-6 py-3 hover:bg-stamp-purple transition-colors"
                      >
                        {result.tick}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
