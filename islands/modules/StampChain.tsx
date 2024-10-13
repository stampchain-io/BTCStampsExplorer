export const StampChainModule = () => {
  return (
    <div className="flex flex-col md:flex-row justify-between md:items-end gap-8 sm:gap-16 md:gap-32">
      <div>
        <p className="italic font-black text-4xl md:text-7xl flex flex-col  gray-gradient text-left">
          STAMPCHAIN
          <span className="not-italic text-3xl md:text-6xl font-extralight text-[#999999]">
            THE CREATORS OF BITCOIN STAMPS
          </span>
        </p>

        <p className="text-[#CCCCCC] text-base md:text-2xl font-medium">
          Your premier destination for all things Bitcoin Stamps. As the OG
          resource, we offer unparalleled expertise and tools for the Stamps
          ecosystem.
          <br />
        </p>
      </div>

      <div className="flex gap-12 font-extrabold text-sm md:text-xl justify-center">
        <a
          href="/about"
          f-partial="/about"
          className="bg-[#999999] text-black w-[90px] md:w-[136px] h-[40px] md:h-[60px] flex justify-center items-center rounded-md"
        >
          ABOUT
        </a>
      </div>
    </div>
  );
};
