export const GetStampingModule = () => {
  return (
    <div className="flex flex-col tablet:flex-row justify-between tablet:items-end gap-8 tablet:gap-16 desktop:gap-32">
      <div>
        <p className="font-black text-4xl tablet:text-7xl flex flex-col gray-gradient4 text-left">
          GET STAMPING
          <span className="text-3xl tablet:text-6xl font-extralight text-[#999999]">
            IMMORTALISE YOUR ART
          </span>
        </p>

        <p className="text-[#CCCCCC] text-base tablet:text-2xl font-medium">
          Effortlessly create immutableBitcoin Stamps with custom fee selection
          and optional Posh Stamp Collection naming options. Supports low-fi
          pixel art (png/jpg/gif) and hi-res vector art (svg/html) up to 64kB.
          Explore SRC-721R for recursive stamps with unlimited size constraints.
        </p>
      </div>

      <div className="flex flex-col gap-9 min-w-[336px]">
        <div className="flex tablet:gap-6 gap-1 font-extrabold text-sm tablet:text-xl tablet:justify-center justify-end">
          <a
            href="/faq"
            f-partial="/faq"
            className="border tablet:border-2 border-[#999999] text-[#999999] w-[90px] tablet:w-[136px] h-[40px] tablet:h-[60px] flex justify-center items-center rounded-md"
          >
            FAQ
          </a>
          <a
            href="/stamping/stamp"
            f-partial="/stamping/stamp"
            className="bg-[#999999] text-black w-[90px] tablet:w-[136px] h-[40px] tablet:h-[60px] flex justify-center items-center rounded-md"
          >
            STAMP
          </a>
        </div>
        <div className="flex  tablet:gap-6 gap-1 text-xs tablet:text-lg text-[#666666] tablet:flex-row flex-col">
          <p className=" text-end tablet:text-start ">
            $<span className="font-bold">
              60,935.68
            </span>
          </p>
          <p className="font-medium  text-end tablet:text-start">
            Fees: <span className="font-bold">8 sat/vB</span> $0.68
          </p>
        </div>
      </div>
    </div>
  );
};
