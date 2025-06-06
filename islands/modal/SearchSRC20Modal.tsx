/*@baba-styles is not config properly*/
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { ModalSearchBase } from "$layout";
import { closeModal, openModal, searchState } from "$islands/modal/states.ts";
import { textSm } from "$text";
import { Icon } from "$icon";
import { tooltipIcon } from "$notification";

// Extend the searchState type to include results
declare module "$islands/modal/states" {
  interface SearchState {
    results?: Array<{ tick: string }>;
  }
}

export function SearchSRC20Modal({
  showButton = true,
}: {
  showButton?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Add tooltip state
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [allowTooltip, setAllowTooltip] = useState(true);
  const tooltipTimeoutRef = useRef<number | null>(null);

  const handleSearch = useCallback(async () => {
    const currentTerm = searchState.value.term;

    if (!currentTerm?.trim()) {
      searchState.value = {
        ...searchState.value,
        error: "",
        results: [],
      };
      return;
    }

    try {
      const response = await fetch(
        `/api/v2/src20/search?q=${encodeURIComponent(currentTerm.trim())}`,
      );
      const data = await response.json();

      if (!response.ok || !data.data || data.data.length === 0) {
        searchState.value = {
          ...searchState.value,
          error:
            `NO TOKEN FOUND\n${currentTerm.trim()}\nThe token ticker isn't recognized`,
          results: [],
        };
        return;
      }

      searchState.value = {
        ...searchState.value,
        error: "",
        results: data.data,
      };
    } catch (err) {
      console.error("SRC20 Search Error======>", err);
      searchState.value = {
        ...searchState.value,
        error: "AN ERROR OCCURRED\nPlease try again later",
        results: [],
      };
    }
  }, []);

  const handleOpenSearch = () => {
    console.log("Opening search modal");
    searchState.value = { term: "", error: "", results: [] };
    const modalContent = (
      <ModalSearchBase
        onClose={() => {
          console.log("Modal closing, resetting state");
          searchState.value = { term: "", error: "", results: [] };
          closeModal();
        }}
      >
        <SearchContent
          searchTerm={searchState.value.term}
          setSearchTerm={(term) => {
            searchState.value = { ...searchState.value, term };
          }}
          error={searchState.value.error}
          results={searchState.value.results || []}
          inputRef={inputRef}
          onSearch={handleSearch}
          setError={(error) => {
            searchState.value = { ...searchState.value, error };
          }}
          autoFocus
        />
      </ModalSearchBase>
    );
    openModal(modalContent, "scaleDownUp");
  };

  // Add tooltip handlers
  const handleMouseEnter = () => {
    if (allowTooltip) {
      if (tooltipTimeoutRef.current) {
        globalThis.clearTimeout(tooltipTimeoutRef.current);
      }
      tooltipTimeoutRef.current = globalThis.setTimeout(() => {
        setIsTooltipVisible(true);
      }, 1500);
    }
  };

  const handleMouseLeave = () => {
    if (tooltipTimeoutRef.current) {
      globalThis.clearTimeout(tooltipTimeoutRef.current);
    }
    setIsTooltipVisible(false);
    setAllowTooltip(true);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        globalThis.clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyboardShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleOpenSearch();
      }
    };

    document.addEventListener("keydown", handleKeyboardShortcut);
    return () =>
      document.removeEventListener("keydown", handleKeyboardShortcut);
  }, []);

  return (
    <div className="relative">
      {showButton && (
        <Icon
          type="iconLink"
          name="search"
          weight="bold"
          size="custom"
          color="purple"
          className="mt-[6px] w-[23px] h-[23px] tablet:w-5 tablet:h-5"
          onClick={() => {
            handleOpenSearch();
            setIsTooltipVisible(false);
            setAllowTooltip(false);
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          role="button"
        />
      )}
      <div
        className={`${tooltipIcon} ${
          isTooltipVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        SEARCH
      </div>
    </div>
  );
}

function SearchContent({
  setSearchTerm,
  inputRef,
  onSearch,
  autoFocus = false,
}: {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  error: string;
  results: Array<{ tick: string }>;
  inputRef: preact.RefObject<HTMLInputElement>;
  onSearch: () => void;
  setError: (error: string) => void;
  autoFocus?: boolean;
}) {
  // Auto-focus effect
  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [autoFocus]);

  // Debounced search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      onSearch();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchState.value.term]);

  const handleResultClick = (tick: string) => {
    globalThis.location.href = `/src20/${tick}`;
  };

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        placeholder="TOKEN, ADDY OR TX HASH"
        value={searchState.value.term}
        onInput={(e) => {
          const newTerm = (e.target as HTMLInputElement).value;
          setSearchTerm(newTerm);
        }}
        autoFocus={autoFocus}
        class={`relative z-[2] h-12 w-full !bg-[#221826] pl-[18px] pr-[52px] font-medium text-sm text-stamp-grey-light placeholder:!bg-[#221826] placeholder:font-light placeholder:!text-stamp-grey no-outline ${
          searchState.value.error ||
            (searchState.value.results?.length ?? 0) > 0
            ? "rounded-t-md"
            : "rounded-md"
        }`}
      />
      <div class="absolute z-[3] right-4 top-[11px] cursor-pointer">
        <Icon
          type="icon"
          name="search"
          weight="bold"
          size="xs"
          color="custom"
          className={`w-5 h-5 ${
            searchState.value.error
              ? "fill-stamp-grey-light"
              : "fill-stamp-grey"
          }`}
        />
      </div>

      {searchState.value.error
        ? (
          <ul class="!bg-[#221826] rounded-b-md z-[2] overflow-y-auto">
            <li class="flex flex-col items-center justify-end pt-1.5 pb-3 px-[18px]">
              <img
                src="/img/broken.png"
                alt="No results"
                class="w-[84px] pb-3"
              />
              <span class="text-center w-full">
                {searchState.value.error.split("\n").map((text, index) => (
                  <div
                    key={index}
                    class={`${
                      index === 0
                        ? "font-light text-base text-stamp-grey-light"
                        : index ===
                            searchState.value.error.split("\n").length - 1
                        ? textSm
                        : "font-medium text-sm text-stamp-grey pt-0.5 pb-1"
                    } break-all overflow-hidden`}
                  >
                    {text}
                  </div>
                ))}
              </span>
            </li>
          </ul>
        )
        : searchState.value.results && searchState.value.results.length > 0
        ? (
          <ul class="max-h-[266px] !bg-[#221826] rounded-b-md z-[2] overflow-y-auto scrollbar-black [&::-webkit-scrollbar]:!rounded-[2px] [&::-webkit-scrollbar]:!w-[4px]">
            {searchState.value.results.map((result: { tick: string }) => (
              <li
                key={result.tick}
                onClick={() => handleResultClick(result.tick)}
                class={`${textSm} px-[18px] py-[9px] hover:bg-[#2f2032] transition-colors duration-300 cursor-pointer`}
              >
                {result.tick}
              </li>
            ))}
          </ul>
        )
        : null}
    </>
  );
}
