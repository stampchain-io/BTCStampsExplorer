import { useEffect, useState } from "preact/hooks";

export interface SearchResult {
  id?: string;
  tick?: string;
  [key: string]: any;
}

interface SearchProps {
  open: boolean;
  handleOpen: (open: boolean) => void;
  placeholder: string;
  searchEndpoint: string;
  onResultClick: (result: SearchResult) => void;
  resultDisplay: (result: SearchResult) => string;
}

export function Search({
  open,
  handleOpen,
  placeholder,
  searchEndpoint,
  onResultClick,
  resultDisplay,
}: SearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSearch = async () => {
    if (searchTerm.trim()) {
      const response = await fetch(
        `${searchEndpoint}${encodeURIComponent(searchTerm.trim())}`,
      );
      const data = await response.json();
      setResults(data.data || []);
    } else {
      setResults([]);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <div class="relative flex items-center">
      {open && (
        <>
          <input
            type="text"
            class="min-w-[260px] tablet:min-w-[360px] h-[40px] purple-bg-gradient px-4 py-2 rounded text-[13px] text-[#8D9199]"
            placeholder={placeholder}
            value={searchTerm}
            onInput={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
          />
          {results.length > 0 && (
            <ul class="absolute top-full left-0 w-full bg-white text-black z-10 max-h-60 overflow-y-auto">
              {results.map((result) => (
                <li
                  key={result.tick || JSON.stringify(result)}
                  onClick={() => onResultClick(result)}
                  class="cursor-pointer p-2 hover:bg-gray-200"
                >
                  {resultDisplay(result)}
                </li>
              ))}
            </ul>
          )}
          <img
            src="/img/stamp/search-glass.png"
            alt="Search icon"
            class="absolute top-3 right-3 cursor-pointer"
            onClick={() => handleOpen(false)}
          />
        </>
      )}
      {!open && (
        <img
          src="/img/stamp/search-glass.png"
          alt="Search icon"
          class="bg-[#660099] rounded-md p-[12px] cursor-pointer"
          onClick={() => handleOpen(true)}
        />
      )}
    </div>
  );
}
