const LatestMints = () => {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="bg-clip-text text-transparent bg-gradient-to-r from-[#AA00FF] via-[#660099] to-[#440066] text-3xl md:text-6xl font-black">
        LATEST MINTS
      </h1>
      <p className="text-2xl md:text-5xl text-[#AA00FF]">BLOCK #860325</p>
      <div className="grid grid-cols-4 md:grid-cols-8">
        {Array(16).fill(null).map((_, index) => {
          return (
            <img
              key={index}
              src="/img/mock.png"
              alt={`Mock image ${index + 1}`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default LatestMints;
