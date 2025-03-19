import { useEffect, useRef, useState } from "preact/hooks";
import { Button } from "$components/shared/Button.tsx";

export function SRC20SearchClient({
  open2,
  handleOpen2,
  showButton = true,
}: {
  open2: boolean;
  handleOpen2: (open: boolean) => void;
  showButton?: boolean;
}) {
  const [visible, setVisible] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (!open2) {
      setSearchTerm("");
      setError("");
      setResults([]);
    }
  }, [open2]);

  useEffect(() => {
    if (open2) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [open2]);

  const handleSearch = async () => {
    if (searchTerm.trim()) {
      try {
        const response = await fetch(
          `/api/v2/src20/search?q=${encodeURIComponent(searchTerm.trim())}`,
        );
        const data = await response.json();

        if (!response.ok || !data.data || data.data.length === 0) {
          setError(
            `NO TOKEN FOUND\n${searchTerm.trim()}\nThe token ticker isn't recognized`,
          );
          setResults([]);
          return;
        }

        setError("");
        setResults(data.data);
      } catch (err) {
        console.log("Src20 Search Error======>", err);
        setError("AN ERROR OCCURRED\nPlease try again later");
        setResults([]);
      }
    } else {
      setResults([]);
      setError("");
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
        if (!open2) {
          handleOpen2(true);
        } else {
          handleOpen2(false);
        }
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

  const modalBgTop =
    "fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-70 backdrop-filter backdrop-blur-md overflow-y-auto";
  const modalSearch =
    "w-[90%] max-w-[480px] mobileLg:max-w-[580px] my-12 mobileLg:my-[72px] tablet:my-24";
  const animatedBorderGrey = `
  relative rounded-md !bg-[#080808] p-[2px]
  before:absolute before:inset-0 before:rounded-md before:z-[1]
  before:bg-[conic-gradient(from_var(--angle),#666666,#999999,#CCCCCC,#999999,#666666)]
  before:[--angle:0deg] before:animate-rotate
  [&>*]:relative [&>*]:z-[2] [&>*]:rounded-md [&>*]:bg-[#080808]
`;

  return (
    <>
      {showButton && (
        <Button
          onMouseEnter={() => setVisible(true)}
          onMouseLeave={() => setVisible(false)}
          variant="icon"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 32 32"
              role="button"
              aria-label="Search"
            >
              <path d="M29.0611 26.9387L23.1248 21C24.9047 18.6805 25.7357 15.7709 25.4492 12.8614C25.1627 9.95181 23.7802 7.26016 21.5821 5.33244C19.3841 3.40471 16.535 2.38527 13.613 2.4809C10.6909 2.57653 7.9146 3.78008 5.84728 5.8474C3.77996 7.91472 2.57641 10.691 2.48078 13.6131C2.38514 16.5351 3.40459 19.3842 5.33231 21.5823C7.26004 23.7803 9.95169 25.1628 12.8613 25.4493C15.7708 25.7358 18.6804 24.9048 20.9998 23.125L26.9411 29.0674C27.0806 29.207 27.2463 29.3177 27.4286 29.3932C27.6109 29.4687 27.8063 29.5076 28.0036 29.5076C28.2009 29.5076 28.3963 29.4687 28.5786 29.3932C28.7609 29.3177 28.9265 29.207 29.0661 29.0674C29.2056 28.9279 29.3163 28.7623 29.3918 28.58C29.4673 28.3977 29.5062 28.2023 29.5062 28.0049C29.5062 27.8076 29.4673 27.6122 29.3918 27.4299C29.3163 27.2476 29.2056 27.082 29.0661 26.9424L29.0611 26.9387ZM5.49983 14C5.49983 12.3188 5.99835 10.6754 6.93234 9.2776C7.86633 7.87979 9.19385 6.79032 10.747 6.14698C12.3002 5.50363 14.0093 5.3353 15.6581 5.66328C17.3069 5.99125 18.8215 6.8008 20.0102 7.98954C21.199 9.17829 22.0085 10.6928 22.3365 12.3417C22.6645 13.9905 22.4961 15.6996 21.8528 17.2528C21.2095 18.8059 20.12 20.1334 18.7222 21.0674C17.3244 22.0014 15.681 22.5 13.9998 22.5C11.7462 22.4976 9.58554 21.6014 7.99198 20.0078C6.39842 18.4142 5.50215 16.2536 5.49983 14Z" />
            </svg>
          }
          iconAlt="Search"
          onClick={() => handleOpen2(true)}
          role="button"
          aria-label="Search"
        />
      )}

      {visible && (
        <div
          role="tooltip"
          className="absolute bottom-full right-[0.3px] mb-2 z-10 px-3 py-2 text-sm font-medium text-white bg-stamp-bg-grey-darkest rounded-lg shadow-md"
        >
          Search
          <div className="tooltip-arrow" />
        </div>
      )}

      {open2 && (
        <div
          class={modalBgTop}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleOpen2(false);
          }}
        >
          <div class={modalSearch} ref={searchContainerRef}>
            <div className={animatedBorderGrey}>
              <div class="relative flex flex-col max-h-[90%] overflow-hidden">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="TOKEN, ADDY OR TX HASH"
                  value={searchTerm}
                  onInput={(e) => {
                    setSearchTerm((e.target as HTMLInputElement).value);
                    setError("");
                  }}
                  class={`relative z-[2] h-[48px] mobileLg:h-[54px] w-full !bg-[#080808] pl-[18px] pr-[52px] mobileLg:pr-[58px] text-sm mobileLg:text-base font-medium text-stamp-grey-light placeholder:!bg-[#080808] placeholder:font-light placeholder:!text-stamp-grey no-outline ${
                    error || results.length > 0 ? "rounded-t-md" : "rounded-md"
                  }`}
                  autoFocus
                />
                <div class="absolute z-[3] right-4 mobileLg:right-[18px] top-[14px] mobileLg:top-[15px] pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 32 32"
                    class={`w-[20px] h-[20px] mobileLg:w-6 mobileLg:h-6 ${
                      error ? "fill-stamp-grey-light" : "fill-stamp-grey"
                    }`}
                    aria-hidden="true"
                  >
                    <path d="M29.0611 26.9387L23.1248 21C24.9047 18.6805 25.7357 15.7709 25.4492 12.8614C25.1627 9.95181 23.7802 7.26016 21.5821 5.33244C19.3841 3.40471 16.535 2.38527 13.613 2.4809C10.6909 2.57653 7.9146 3.78008 5.84728 5.8474C3.77996 7.91472 2.57641 10.691 2.48078 13.6131C2.38514 16.5351 3.40459 19.3842 5.33231 21.5823C7.26004 23.7803 9.95169 25.1628 12.8613 25.4493C15.7708 25.7358 18.6804 24.9048 20.9998 23.125L26.9411 29.0674C27.0806 29.207 27.2463 29.3177 27.4286 29.3932C27.6109 29.4687 27.8063 29.5076 28.0036 29.5076C28.2009 29.5076 28.3963 29.4687 28.5786 29.3932C28.7609 29.3177 28.9265 29.207 29.0661 29.0674C29.2056 28.9279 29.3163 28.7623 29.3918 28.58C29.4673 28.3977 29.5062 28.2023 29.5062 28.0049C29.5062 27.8076 29.4673 27.6122 29.3918 27.4299C29.3163 27.2476 29.2056 27.082 29.0661 26.9424L29.0611 26.9387ZM5.49983 14C5.49983 12.3188 5.99835 10.6754 6.93234 9.2776C7.86633 7.87979 9.19385 6.79032 10.747 6.14698C12.3002 5.50363 14.0093 5.3353 15.6581 5.66328C17.3069 5.99125 18.8215 6.8008 20.0102 7.98954C21.199 9.17829 22.0085 10.6928 22.3365 12.3417C22.6645 13.9905 22.4961 15.6996 21.8528 17.2528C21.2095 18.8059 20.12 20.1334 18.7222 21.0674C17.3244 22.0014 15.681 22.5 13.9998 22.5C11.7462 22.4976 9.58554 21.6014 7.99198 20.0078C6.39842 18.4142 5.50215 16.2536 5.49983 14Z" />
                  </svg>
                </div>

                {error && (
                  <ul class="!bg-[#080808] rounded-b-md z-[2] overflow-y-auto">
                    <li class="flex flex-col items-center justify-end pt-1.5 mobileLg:pt-3 pb-3 px-[18px]">
                      <img
                        src="/img/broken.png"
                        alt="No results"
                        class="w-[84px] mobileLg:w-[96px] pb-3"
                      />
                      <span class="text-center w-full">
                        {error.split("\n").map((text, index) => (
                          <div
                            key={index}
                            class={`${
                              index === 0
                                ? "text-base mobileLg:text-lg font-light text-stamp-grey-light"
                                : index === error.split("\n").length - 1
                                ? "text-sm mobileLg:text-base font-medium text-stamp-grey-light"
                                : "text-xs mobileLg:text-sm font-medium text-stamp-grey pt-0.5 pb-1"
                            } break-all overflow-hidden`}
                          >
                            {text}
                          </div>
                        ))}
                      </span>
                    </li>
                  </ul>
                )}
                {results.length > 0 && !error && (
                  <ul class="max-h-[190px] mobileLg:max-h-[180px] !bg-[#080808] rounded-b-md z-[2] overflow-y-auto [&::-webkit-scrollbar-track]:bg-[#333333] [&::-webkit-scrollbar-thumb]:bg-[#999999] [&::-webkit-scrollbar-thumb:hover]:bg-[#CCCCCC]">
                    {results.map((result) => (
                      <li
                        key={result.tick}
                        onClick={() => handleResultClick(result.tick)}
                        class="cursor-pointer px-[18px] py-[9px] mobileLg:py-1.5 hover:bg-stamp-grey/20 transition-colors text-sm mobileLg:text-base font-medium text-stamp-grey-light"
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
