import { useState } from "preact/hooks";

export function StampSearchClient(
  { open2, handleOpen2 }: {
    open2: boolean;
    handleOpen2: (open: boolean) => void;
  },
) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = () => {
    if (searchTerm.trim()) {
      globalThis.location.href = `/stamp/${searchTerm.trim()}`;
    }
  };

  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div class="relative flex items-center">
      {open2 && (
        <>
          <input
            type="text"
            className="min-w-[260px] md:min-w-[360px] h-[40px] bg-gradient-to-r from-[#8800CC] via-[#7700AA] to-[#660099] px-4 py-2 rounded text-[13px] text-[#8D9199]"
            placeholder="stamp #, CPID, wallet address, tx_hash"
            value={searchTerm}
            onInput={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
            onKeyPress={handleKeyPress}
          />
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
