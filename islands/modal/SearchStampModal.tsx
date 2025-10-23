/* @baba - commentary + global styles */
import { Icon } from "$icon";
import { closeModal, openModal, searchState } from "$islands/modal/states.ts";
import { ModalSearchBase } from "$layout";
import { textSm } from "$text";
import { useEffect } from "preact/hooks";

export function openStampSearch() {
  const inputRef = { current: null } as preact.RefObject<HTMLInputElement>;

  // Helper functions
  const isHexString = (str: string): boolean => {
    return /^[a-fA-F0-9]+$/.test(str);
  };

  const validateBitcoinAddress = async (address: string) => {
    // First check format
    const isValidFormat = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(address);
    if (!isValidFormat) return false;

    try {
      const response = await fetch(
        `https://blockchain.info/rawaddr/${address}`,
      );
      if (!response.ok) return false;
      const data = await response.json();
      return data.n_tx > 0;
    } catch (error) {
      console.log("Validate Bitcoin Address Error=========>", error);
      return false;
    }
  };

  const validateBitcoinTx = async (txHash: string) => {
    try {
      const response = await fetch(`https://blockchain.info/rawtx/${txHash}`);
      if (!response.ok) return false;

      const data = await response.json();
      // Check if response has basic tx properties
      return !!(data && data.hash && data.ver);
    } catch (error) {
      console.log("Validate BitCoin Tx Error=========>", error);
      return false;
    }
  };

  const handleSearch = async () => {
    const currentTerm = searchState.value.term;
    console.log("handleSearch executing with term:", currentTerm);

    if (!currentTerm) {
      console.log("Search term is empty, returning");
      searchState.value = {
        ...searchState.value,
        error: "NO RESULTS FOUND\nEmpty query\nPlease enter a search term",
      };
      return;
    }

    try {
      searchState.value = { ...searchState.value, error: "" };
      const query = currentTerm.trim();
      console.log("Processing search with query:", query);

      // Handle potential tx hash (any hex string > 16 chars that's not a CPID)
      if (isHexString(query) && query.length > 16 && !query.startsWith("A")) {
        // Check format and blockchain validity
        if (query.length !== 64 || !(await validateBitcoinTx(query))) {
          searchState.value = {
            ...searchState.value,
            error:
              `NO TRANSACTION FOUND\n${query}\nThe transaction hash isn't valid`,
          };
          return;
        }

        try {
          const stampResponse = await fetch(`/api/v2/stamps/${query}?q=search`);
          const responseData = await stampResponse.json();

          if (
            stampResponse.ok && responseData.data && responseData.data.stamp
          ) {
            // SSR-safe browser environment check
            if (typeof globalThis === "undefined" || !globalThis?.location) {
              return; // Cannot navigate during SSR
            }
            globalThis.location.href = `/stamp/${query}`;
            return;
          }
        } catch (error) {
          console.log("Stamp Search Error=========>", error);
        }

        // Not a stamp but valid tx - open blockchain explorer
        globalThis.open(
          `https://www.blockchain.com/explorer/transactions/btc/${query}`,
          "_blank",
        );
        return;
      }

      // Check for Bitcoin address formats
      if (/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(query)) {
        const isValidAndActive = await validateBitcoinAddress(query);
        if (isValidAndActive) {
          // SSR-safe browser environment check
          if (typeof globalThis === "undefined" || !globalThis?.location) {
            return; // Cannot navigate during SSR
          }
          globalThis.location.href = `/wallet/${query}`;
          return;
        }
        searchState.value = {
          ...searchState.value,
          error:
            `NO ADDY FOUND\n${query}\nThe Bitcoin address doesn't seem to exist`,
        };
        return;
      }

      // Check for CPID format (starts with 'A' or 'a' followed by at least 5 numeric chars)
      if (/^[Aa]\d{5,}$/.test(query)) {
        try {
          const response = await fetch(
            `/api/v2/stamps/${query.toUpperCase()}?q=search`,
          );
          const responseData = await response.json();

          if (response.ok && responseData.data && responseData.data.stamp) {
            // SSR-safe browser environment check
            if (typeof globalThis === "undefined" || !globalThis?.location) {
              return; // Cannot navigate during SSR
            }
            globalThis.location.href = `/stamp/${query.toUpperCase()}`;
            return;
          }
        } catch (error) {
          console.log("Stamp Search Error=========>", error);
          searchState.value = {
            ...searchState.value,
            error:
              `NO STAMP FOUND\n${query}\nThe CPID doesn't seem to be valid`,
          };
          return;
        }
      }

      // Check for stamp number
      if (/^[-]?\d+$/.test(query)) {
        try {
          const response = await fetch(`/api/v2/stamps/${query}?q=search`);
          const responseData = await response.json();

          if (response.ok && responseData.data && responseData.data.stamp) {
            // SSR-safe browser environment check
            if (typeof globalThis === "undefined" || !globalThis?.location) {
              return; // Cannot navigate during SSR
            }
            globalThis.location.href = `/stamp/${query}`;
            return;
          }
        } catch (error) {
          console.log("Stamp Search Error=========>", error);
          searchState.value = {
            ...searchState.value,
            error:
              `NO STAMP FOUND\n#${query}\nThe stamp you are looking for doesn't exist`,
          };
          return;
        }
      }

      searchState.value = {
        ...searchState.value,
        error:
          `NO RESULTS FOUND\n${query}\nSorry, can't figure out what you're looking for`,
      };
    } catch (err) {
      console.error("Search error:", err);
      searchState.value = {
        ...searchState.value,
        error:
          `SYSTEM ERROR\n${currentTerm}\nSomething went wrong, please try again`,
      };
    }
  }; // plain function; not a hook

  // Open modal
  searchState.value = { term: "", error: "" };
  const modalContent = (
    <ModalSearchBase
      title="Search Stamps"
      onClose={() => {
        searchState.value = { term: "", error: "" };
        closeModal();
      }}
    >
      <SearchContent
        searchTerm={searchState.value.term}
        setSearchTerm={(term) => {
          searchState.value = { ...searchState.value, term };
        }}
        error={searchState.value.error}
        setError={(error) => {
          searchState.value = { ...searchState.value, error };
        }}
        inputRef={inputRef}
        onSearch={handleSearch}
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
  setError: (error: string) => void;
  inputRef: preact.RefObject<HTMLInputElement>;
  onSearch: () => void;
  autoFocus?: boolean;
}) {
  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [autoFocus]);

  useEffect(() => {
    console.log("Error state changed:", searchState.value.error);
  }, [searchState.value.error]);

  const handleKeyDown = (e: KeyboardEvent) => {
    console.log(
      "KeyDown in SearchContent:",
      e.key,
      "Current term:",
      searchState.value.term,
    );
    if (e.key === "Enter") {
      e.preventDefault();
      onSearch();
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        placeholder="STAMP #, CPID, ADDY OR TX HASH"
        value={searchState.value.term}
        onInput={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
        onKeyDown={handleKeyDown}
        autoFocus={autoFocus}
        class={`relative z-modal h-12 w-full bg-color-background/50 pl-7.5 pr-[68px]  font-mediun text-sm text-color-neutral-light placeholder:bg-color-background/50 placeholder:font-light placeholder:!text-color-neutral no-outline ${
          searchState.value.error ? "rounded-t-3xl" : "rounded-3xl"
        }`}
      />
      <div
        class="absolute z-[3] right-6 top-[11px] cursor-pointer"
        onClick={onSearch}
      >
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
      {searchState.value.error && (
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
                      : index === searchState.value.error.split("\n").length - 1
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
      )}
    </>
  );
}
