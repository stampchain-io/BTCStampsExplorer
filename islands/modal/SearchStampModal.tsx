/* @baba - commentary + global styles */
import { useCallback, useEffect, useRef } from "preact/hooks";
import { Button } from "$components/button/ButtonOLD.tsx";
import { ModalSearchBase } from "$layout";
import { closeModal, openModal, searchState } from "$islands/modal/states.ts";
import { textSm } from "$text";

export function SearchStampModal({
  showButton = true,
}: {
  showButton?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleSearch = useCallback(async () => {
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
  }, []); // No dependencies needed since we're using signals

  const handleOpenSearch = () => {
    console.log("Opening search modal");
    searchState.value = { term: "", error: "" }; // Reset state
    const modalContent = (
      <ModalSearchBase
        onClose={() => {
          console.log("Modal closing, resetting state");
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
          autoFocus={true}
        />
      </ModalSearchBase>
    );
    openModal(modalContent, "scaleDownUp");
  };

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
    <div class="relative">
      {showButton && (
        <Button
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
          onClick={handleOpenSearch}
          role="button"
          aria-label="Search"
        />
      )}
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

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
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
        class={`relative z-[2] h-12 w-full !bg-[#221826] pl-[18px] pr-[52px] font-mediun text-sm text-stamp-grey-light placeholder:!bg-[#221826] placeholder:font-light placeholder:!text-stamp-grey no-outline ${
          searchState.value.error ? "rounded-t-md" : "rounded-md"
        }`}
      />
      <div
        class="absolute z-[3] right-4 top-[14px] cursor-pointer"
        onClick={onSearch}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          class={`w-5 h-5 ${
            searchState.value.error
              ? "fill-stamp-grey-light"
              : "fill-stamp-grey"
          }`}
          aria-hidden="true"
        >
          <path d="M29.0611 26.9387L23.1248 21C24.9047 18.6805 25.7357 15.7709 25.4492 12.8614C25.1627 9.95181 23.7802 7.26016 21.5821 5.33244C19.3841 3.40471 16.535 2.38527 13.613 2.4809C10.6909 2.57653 7.9146 3.78008 5.84728 5.8474C3.77996 7.91472 2.57641 10.691 2.48078 13.6131C2.38514 16.5351 3.40459 19.3842 5.33231 21.5823C7.26004 23.7803 9.95169 25.1628 12.8613 25.4493C15.7708 25.7358 18.6804 24.9048 20.9998 23.125L26.9411 29.0674C27.0806 29.207 27.2463 29.3177 27.4286 29.3932C27.6109 29.4687 27.8063 29.5076 28.0036 29.5076C28.2009 29.5076 28.3963 29.4687 28.5786 29.3932C28.7609 29.3177 28.9265 29.207 29.0661 29.0674C29.2056 28.9279 29.3163 28.7623 29.3918 28.58C29.4673 28.3977 29.5062 28.2023 29.5062 28.0049C29.5062 27.8076 29.4673 27.6122 29.3918 27.4299C29.3163 27.2476 29.2056 27.082 29.0661 26.9424L29.0611 26.9387ZM5.49983 14C5.49983 12.3188 5.99835 10.6754 6.93234 9.2776C7.86633 7.87979 9.19385 6.79032 10.747 6.14698C12.3002 5.50363 14.0093 5.3353 15.6581 5.66328C17.3069 5.99125 18.8215 6.8008 20.0102 7.98954C21.199 9.17829 22.0085 10.6928 22.3365 12.3417C22.6645 13.9905 22.4961 15.6996 21.8528 17.2528C21.2095 18.8059 20.12 20.1334 18.7222 21.0674C17.3244 22.0014 15.681 22.5 13.9998 22.5C11.7462 22.4976 9.58554 21.6014 7.99198 20.0078C6.39842 18.4142 5.50215 16.2536 5.49983 14Z" />
        </svg>
      </div>
      {searchState.value.error && (
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
                      : index === searchState.value.error.split("\n").length - 1
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
      )}
    </>
  );
}
