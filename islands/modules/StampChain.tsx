export const StampChainModule = () => {
  return (
    <div class="
      flex flex-col tablet:flex-row justify-between tablet:items-end gap-8 mobileLg:gap-16 tablet:gap-32
      px-3 tablet:px-6 desktop:px-12 
      max-w-desktop w-full mx-auto
    ">
      <div>
        <p className="italic font-black text-4xl tablet:text-7xl flex flex-col gray-gradient4 text-left">
          STAMPCHAIN
          <span className="not-italic text-3xl tablet:text-6xl font-extralight text-[#999999]">
            THE CREATORS OF BITCOIN STAMPS
          </span>
        </p>

        <p className="text-[#CCCCCC] text-base tablet:text-2xl font-medium">
          Your premier destination for all things Bitcoin Stamps. As the OG
          resource, we offer unparalleled expertise and tools for the Stamps
          ecosystem.
          <br />
        </p>
      </div>

      <div className="flex gap-12 font-extrabold text-sm tablet:text-xl justify-center">
        <a
          href="/about"
          f-partial="/about"
          className="bg-[#999999] text-black w-[90px] tablet:w-[136px] h-[40px] tablet:h-[60px] flex justify-center items-center rounded-md"
        >
          ABOUT
        </a>
      </div>
    </div>
  );
};
