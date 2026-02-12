/*@baba-styles is not config properly*/
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
import { textSm } from "$text";

export function openSRC20Search() {
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
        `/api/v2/src20/search?q=${
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
            "src20",
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
      console.error("SRC20 Search Error:", err);
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
          tick: string;
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

interface SRC20SearchResult {
  tick: string;
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
  results: SRC20SearchResult[];
  inputRef: preact.RefObject<HTMLInputElement>;
  onSearch: () => void;
  setError: (error: string) => void;
  autoFocus?: boolean;
}) {
  // Shared hooks
  useAutoFocus(inputRef, autoFocus);
  useDebouncedSearch(searchState.value.term, onSearch);

  const handleResultClick = (tick: string) => {
    navigateSSRSafe(`/src20/${tick}`);
  };

  // Typed cast for signal results
  const results = (searchState.value.results || []) as
    SRC20SearchResult[];
  const error = searchState.value.error;

  return (
    <>
      <SearchInputField
        value={searchState.value.term}
        onChange={setSearchTerm}
        onSearch={onSearch}
        placeholder="TOKEN, ADDY OR TX HASH"
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
                  key={result.tick}
                  onClick={() => handleResultClick(result.tick)}
                  class={`${textSm} px-7.5 py-[9px] hover:bg-color-background/60 ${transitionColors} cursor-pointer`}
                >
                  {result.tick}
                </li>
              ),
            )}
          </ul>
        )
        : null}
    </>
  );
}
