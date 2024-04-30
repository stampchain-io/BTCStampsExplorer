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
    <input
      type="text"
      className="min-w-80 bg-[#262424] px-4 py-2 border border-[#8A8989] rounded-lg"
      placeholder="Search stamp..."
      onInput={handleSearch}
    />
  );
}
