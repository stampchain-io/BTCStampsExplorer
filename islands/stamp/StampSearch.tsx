export function StampSearchClient() {
  const handleSearch = (event) => {
    const searchTerm = event.target.value;
    // if (!isNaN(Number(searchTerm))) {
    // const stampId = parseInt(searchTerm);
    // Redirect to /stamp/[id] route with the stampId
    window.location.href = `/stamp/${searchTerm}`;
    // }
  };

  return (
    <div class="relative inline-block">
      <input
        type="text"
        className="min-w-[250px] md:min-w-[460px] h-[54px] bg-[#3F2A4E] px-4 py-2 rounded text-[13px] text-[#8D9199]"
        placeholder="Search stamps"
        onInput={handleSearch}
      />
      <img
        src="/img/icon_search.svg"
        alt="Search icon"
        class="absolute top-4 right-6"
      />
    </div>
  );
}
