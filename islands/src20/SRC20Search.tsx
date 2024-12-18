import { useEffect, useState } from "preact/hooks";
import { Button } from "$components/shared/Button.tsx";

export function SRC20SearchClient(
  { open2, handleOpen2 }: {
    open2: boolean;
    handleOpen2: (open: boolean) => void;
  },
) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);

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

  const handleResultClick = (tick: string) => {
    globalThis.location.href = `/src20/${tick}`;
  };

  return (
    <div
      class={open2
        ? "absolute right-0 z-10 w-full mobileLg:w-[360px]"
        : "relative flex items-center"}
    >
      {open2 && (
        <>
          <input
            type="text"
            class={`w-full mobileLg:w-[360px] tablet:min-w-[360px] h-7 mobileLg:h-9 purple-bg-gradient pl-3 pr-2 py-3 text-[12px] leading-[14px] text-[#333333] font-bold placeholder:text-[#333333] outline-none ${
              results.length > 0 ? "rounded-t" : "rounded"
            }`}
            placeholder="Token Name, Tx Hash, or Address"
            value={searchTerm}
            onInput={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
          />
          {results.length > 0 && (
            <ul class="absolute top-full left-0 w-full purple-bg-gradient rounded-b text-[#999999] font-bold text-[12px] leading-[14px] z-10 max-h-60 overflow-y-auto">
              {results.map((result) => (
                <li
                  key={result.tick}
                  onClick={() => handleResultClick(result.tick)}
                  class="cursor-pointer p-2 hover:bg-gray-600"
                >
                  {result.tick}
                </li>
              ))}
            </ul>
          )}
          <img
            src="/img/stamp/search-glass.png"
            alt="Search icon"
            class="absolute top-1.5 mobileLg:top-[11px] right-[9px] cursor-pointer w-[18px] h-[18px]"
            onClick={() => handleOpen2(false)}
          />
        </>
      )}
      {!open2 && (
        <Button
          variant="icon"
          icon="/img/stamp/search-glass.png"
          iconAlt="Search icon"
          class="bg-[#660099] rounded-md cursor-pointer"
          onClick={() => handleOpen2(true)}
        />
      )}
    </div>
  );
}
