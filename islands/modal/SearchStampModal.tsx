/* @baba - commentary + global styles */
import { closeModal, openModal, searchState } from "$islands/modal/states.ts";
import { SearchErrorDisplay } from "$islands/modal/SearchErrorDisplay.tsx";
import { SearchInputField } from "$islands/modal/SearchInputField.tsx";
import { ModalSearchBase, transitionColors } from "$layout";
import { generateSearchErrorMessage } from "$lib/utils/data/search/searchInputClassifier.ts";
import {
  navigateSSRSafe,
  useAutoFocus,
  useDebouncedSearch,
} from "$lib/utils/ui/search/searchHooks.ts";

export function openStampSearch() {
  const inputRef = {
    current: null,
  } as preact.RefObject<HTMLInputElement>;

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
        `/api/v2/stamps/search?q=${
          encodeURIComponent(currentTerm.trim())
        }`,
        {
          headers: {
            "X-API-Version": "2.3",
          },
        },
      );
      const data = await response.json();

      if (
        !response.ok || !data.data || data.data.length === 0
      ) {
        searchState.value = {
          ...searchState.value,
          error: generateSearchErrorMessage(
            currentTerm.trim(),
            "stamp",
          ),
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
      console.error("Stamp Search Error:", err);
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
      title="Search Stamps"
      onClose={() => {
        searchState.value = {
          term: "",
          error: "",
          results: [],
        };
        closeModal();
      }}
    >
      <SearchContent
        searchTerm={searchState.value.term}
        setSearchTerm={(term) => {
          searchState.value = { ...searchState.value, term };
        }}
        error={searchState.value.error}
        results={(searchState.value.results || []) as Array<{
          stamp: number;
          cpid: string;
          preview: string;
          mimetype: string;
          creator: string;
        }>}
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

interface StampSearchResult {
  stamp: number;
  cpid: string;
  preview: string;
  mimetype: string;
  creator: string;
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
  results: StampSearchResult[];
  inputRef: preact.RefObject<HTMLInputElement>;
  onSearch: () => void;
  setError: (error: string) => void;
  autoFocus?: boolean;
}) {
  // Shared hooks
  useAutoFocus(inputRef, autoFocus);
  useDebouncedSearch(searchState.value.term, onSearch);

  const handleResultClick = (stamp: number | string) => {
    navigateSSRSafe(`/stamp/${stamp}`);
  };

  // Typed cast for signal results
  const results = (searchState.value.results || []) as
    StampSearchResult[];
  const error = searchState.value.error;

  return (
    <>
      <SearchInputField
        value={searchState.value.term}
        onChange={setSearchTerm}
        onSearch={onSearch}
        placeholder="STAMP #, CPID, ADDY OR TX HASH"
        inputRef={inputRef}
        autoFocus={autoFocus}
        hasResults={results.length > 0}
        hasError={!!error}
      />

      {error
        ? <SearchErrorDisplay error={error} />
        : results.length > 0
        ? (
          <ul class="max-h-[266px] bg-color-background/50 rounded-b-3xl z-modal overflow-y-auto scrollbar-background-overlay [&::-webkit-scrollbar]:!rounded-[2px] [&::-webkit-scrollbar]:!w-[4px]">
            {results.map(
              (result) => (
                <li
                  key={result.stamp}
                  onClick={() => handleResultClick(result.stamp)}
                  class={`flex items-center gap-3 px-7.5 py-2 hover:bg-color-background/60 ${transitionColors} cursor-pointer`}
                >
                  <img
                    src={result.preview}
                    alt={`Stamp ${result.stamp}`}
                    class="w-10 h-10 rounded object-cover"
                  />
                  <div class="flex flex-col flex-1">
                    <span class="text-sm font-medium text-color-grey-light">
                      #{result.stamp} - {result.cpid}
                    </span>
                    <span class="text-xs text-color-grey truncate">
                      {result.creator}
                    </span>
                  </div>
                </li>
              ),
            )}
          </ul>
        )
        : null}
    </>
  );
}
