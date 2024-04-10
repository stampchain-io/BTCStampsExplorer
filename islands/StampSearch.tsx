export function StampSearchClient() {
  const handleSearch = (event) => {
    const searchTerm = event.target.value;
    // if (!isNaN(Number(searchTerm))) {
    // const stampId = parseInt(searchTerm);
    // Redirect to /stamp/[id] route with the stampId
    window.location.href = `/stamp/${searchTerm}`;
    console.log("ssssss");
    // }
  };

  return (
    <input
      type="text"
      className="h-1/2 w-full p-2 border-2 border-black rounded-lg bg-gray-800"
      placeholder="Search for a Stamp, CPID, Transaction, or Address"
      onInput={handleSearch}
    />
  );
}
