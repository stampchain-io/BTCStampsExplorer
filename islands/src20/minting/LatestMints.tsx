const LatestMints = () => {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="purple-gradient4 text-3xl tablet:text-6xl font-black">
        LATEST MINTS
      </h1>
      <p className="text-2xl tablet:text-5xl text-[#AA00FF]">BLOCK #860325</p>
      <div className="grid grid-cols-4 tablet:grid-cols-8">
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
