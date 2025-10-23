/*@baba-styles is not config properly*/
import { Icon } from "$icon";
import { closeModal, openModal, searchState } from "$islands/modal/states.ts";
import { ModalSearchBase, transitionColors } from "$layout";
import { textSm } from "$text";
import { useEffect } from "preact/hooks";

export function openSRC20Search() {
  const inputRef = { current: null } as preact.RefObject<HTMLInputElement>;

  const handleSearch = async () => {
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
        {
          headers: {
            "X-API-Version": "2.3",
          },
        },
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
  };

  // Open modal
  searchState.value = { term: "", error: "", results: [] };
  const modalContent = (
    <ModalSearchBase
      title="Search SRC-20 Tokens"
      onClose={() => {
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
  openModal(modalContent, "slideDownUp");
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
    // SSR-safe browser environment check
    if (typeof globalThis === "undefined" || !globalThis?.location) {
      return; // Cannot navigate during SSR
    }
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
        class={`relative z-modal h-12 w-full bg-color-background/50 pl-7.5 pr-[68px] font-medium text-sm text-color-neutral-light placeholder:bg-color-background/50 placeholder:font-light placeholder:!text-color-neutral no-outline ${
          searchState.value.error ||
            (searchState.value.results?.length ?? 0) > 0
            ? "rounded-t-3xl"
            : "rounded-3xl"
        }`}
      />
      <div class="absolute z-[3] right-6 top-[11px] cursor-pointer">
        <Icon
          type="icon"
          name="search"
          weight="bold"
          size="xs"
          color="custom"
          className={`w-5 h-5 ${
            searchState.value.error
              ? "stroke-color-neutral-light"
              : "stroke-color-neutral"
          }`}
        />
      </div>

      {searchState.value.error
        ? (
          <ul class="bg-color-background/50 rounded-b-3xl z-modal overflow-y-auto">
            <li class="flex flex-col items-center justify-end pt-1.5 pb-3 px-7.5">
              <img
                src="/img/placeholder/broken.png"
                alt="No results"
                class="w-[84px] pb-3"
              />
              <span class="text-center w-full">
                {searchState.value.error.split("\n").map((text, index) => (
                  <div
                    key={index}
                    class={`${
                      index === 0
                        ? "font-light text-base text-color-neutral-light"
                        : index ===
                            searchState.value.error.split("\n").length - 1
                        ? textSm
                        : "font-medium text-sm text-color-neutral pt-0.5 pb-1"
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
          <ul class="max-h-[266px] bg-color-background/50 rounded-b-3xl z-modal overflow-y-auto scrollbar-background-overlay [&::-webkit-scrollbar]:!rounded-[2px] [&::-webkit-scrollbar]:!w-[4px]">
            {searchState.value.results.map((result: { tick: string }) => (
              <li
                key={result.tick}
                onClick={() => handleResultClick(result.tick)}
                class={`${textSm} px-7.5 py-[9px] hover:bg-color-background/60 ${transitionColors} cursor-pointer`}
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
