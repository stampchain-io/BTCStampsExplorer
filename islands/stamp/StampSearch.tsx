import { useState } from "preact/hooks";

export function StampSearchClient() {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = () => {
    if (searchTerm.trim()) {
      window.location.href = `/stamp/${searchTerm.trim()}`;
    }
  };

  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div class="relative inline-block">
      <input
        type="text"
        className="min-w-[220px] md:min-w-[460px] h-[54px] bg-[#3F2A4E] px-4 py-2 rounded text-[13px] text-[#8D9199]"
        placeholder="Search stamps"
        value={searchTerm}
        onInput={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
        onKeyPress={handleKeyPress}
      />
      <img
        src="/img/icon_search.svg"
        alt="Search icon"
        class="absolute top-4 right-6 cursor-pointer"
        onClick={handleSearch}
      />
    </div>
  );
}
