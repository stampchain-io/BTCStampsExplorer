import { useEffect, useState } from "preact/hooks";

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
    window.location.href = `/src20/${tick}`;
  };

  return (
    <div class="relative flex items-center">
      {open2 && (
        <>
          <input
            type="text"
            class="min-w-[260px] md:min-w-[360px] h-[40px] bg-gradient-to-r from-[#8800CC] via-[#7700AA] to-[#660099] px-4 py-2 rounded text-[13px] text-[#8D9199]"
            placeholder="Token Name, Tx Hash, or Address"
            value={searchTerm}
            onInput={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
          />
          {results.length > 0 && (
            <ul class="absolute top-full left-0 w-full bg-white text-black z-10 max-h-60 overflow-y-auto">
              {results.map((result) => (
                <li
                  key={result.tick}
                  onClick={() => handleResultClick(result.tick)}
                  class="cursor-pointer p-2 hover:bg-gray-200"
                >
                  {result.tick}
                </li>
              ))}
            </ul>
          )}
          <img
            src="/img/stamp/search-glass.png"
            alt="Search icon"
            class="absolute top-3 right-3 cursor-pointer"
            onClick={() => handleOpen2(false)}
          />
        </>
      )}
      {!open2 && (
        <img
          src="/img/stamp/search-glass.png"
          alt="Search icon"
          class="bg-[#660099] rounded-md p-[12px] cursor-pointer"
          onClick={() => handleOpen2(true)}
        />
      )}
    </div>
  );
}
