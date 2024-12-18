import { useState } from "preact/hooks";
import { Button } from "$components/shared/Button.tsx";

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
    <div
      className={open2
        ? `absolute z-10 right-0 w-full mobileLg:w-[360px]`
        : `relative flex items-center`}
    >
      {open2 && (
        <>
          <input
            type="text"
            className="w-full mobileLg:w-[360px] min-w-[260px]  tablet:min-w-[360px] h-7 mobileLg:h-9 bg-stamp-purple px-4 py-2 pr-9 rounded-md text-[13px] text-black placeholder:text-black placeholder:uppercase"
            placeholder="stamp #, CPID, wallet address or tx_hash"
            value={searchTerm}
            onInput={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
            onKeyPress={handleKeyPress}
          />
          <img
            src="/img/stamp/search-glass.png"
            alt="Search icon"
            className="absolute top-1.5 right-2 mobileLg:top-2.5 mobileLg:right-3 cursor-pointer"
            onClick={() => handleOpen2(false)}
          />
        </>
      )}
      {!open2 && (
        <Button
          variant="icon"
          icon="/img/stamp/search-glass.png"
          iconAlt="Search icon"
          class="bg-stamp-purple rounded-stamp cursor-pointer"
          onClick={() => handleOpen2(true)}
        />
      )}
    </div>
  );
}
