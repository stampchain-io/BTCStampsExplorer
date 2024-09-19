export const HomeStampchain = () => {
  return (
    <div
      className={"flex flex-col md:flex-row justify-between md:items-end gap-16 md:gap-32"}
    >
      <div>
        <p
          className={"italic font-black text-4xl md:text-7xl flex flex-col bg-clip-text text-transparent bg-gradient-to-r from-[#666666] to-[#999999] text-left"}
        >
          STAMPCHAIN
          <span
            className={"not-italic text-3xl md:text-6xl font-extralight text-[#999999]"}
          >
            THE CREATORS OF BITCOIN STAMPS
          </span>
        </p>

        <p className={"text-[#CCCCCC] text-2xl font-medium"}>
          Brought to you by the creators of Bitcoin Stamps. Stampchain is the OG
          resource for all things Stamps.
          <br />
        </p>
      </div>

      <div className={"flex gap-12 font-extrabold text-xl justify-center"}>
        <a
          href="/about"
          className={"bg-[#999999] text-black w-[136px] h-[60px] flex justify-center items-center rounded-md"}
        >
          ABOUT
        </a>
      </div>
    </div>
  );
};
