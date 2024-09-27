export const GetStampingModule = () => {
  return (
    <div className="flex flex-col md:flex-row justify-between md:items-end gap-8 sm:gap-16 md:gap-32">
      <div>
        <p className="italic font-black text-4xl md:text-7xl flex flex-col bg-clip-text text-transparent bg-gradient-to-r from-[#666666] to-[#999999] text-left">
          GET STAMPING
          <span className="not-italic text-3xl md:text-6xl font-extralight text-[#999999]">
            IMMORTALISE YOUR ART
          </span>
        </p>

        <p className="text-[#CCCCCC] text-base md:text-2xl font-medium">
          Stamp Posh or Classic stamps cheap and effortlessly with built in
          compression tools, custom fee selection and frictionless Posh naming
          options.<br />
          <br />
          Support for png/jpg/gif low-fi pixel art and hi-res svg/html vector
          art - up to 64kB.
        </p>
      </div>

      <div className="flex flex-col gap-9 min-w-[336px]">
        <div className="flex gap-6 font-extrabold text-sm md:text-xl justify-center">
          <a
            href="/faq"
            f-partial="/faq"
            className="border md:border-2 border-[#999999] text-[#999999] w-[90px] md:w-[136px] h-[40px] md:h-[60px] flex justify-center items-center rounded-md"
          >
            FAQ
          </a>
          <a
            href="/stamping/stamp"
            f-partial="/stamping/stamp"
            className="bg-[#999999] text-black w-[90px] md:w-[136px] h-[40px] md:h-[60px] flex justify-center items-center rounded-md"
          >
            STAMP
          </a>
        </div>
        <div className="flex gap-6 text-xs md:text-lg text-[#666666]">
          <p>
            $<span className="font-bold">60,935.68</span>
          </p>
          <p className="font-medium">
            Fees: <span className="font-bold">8 sat/vB</span> $0.68
          </p>
        </div>
      </div>
    </div>
  );
};
