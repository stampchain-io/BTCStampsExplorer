export const HomeGetStamping = () => {
  return (
    <div className={"flex flex-col md:flex-row justify-between md:items-end"}>
      <p
        className={"italic font-black text-4xl md:text-7xl flex flex-col bg-clip-text text-transparent bg-gradient-to-r from-[#666666] to-[#999999]"}
      >
        GET STAMPING
        <span
          className={"not-italic text-3xl md:text-6xl font-extralight text-[#999999]"}
        >
          IMMORTALISE YOUR ART
        </span>
      </p>

      <div className={"flex gap-12 font-extrabold text-xl"}>
        <a
          href="#"
          className={"border-2 border-[#999999] text-[#999999] w-[136px] h-[60px] flex justify-center items-center rounded-md"}
        >
          FAQ
        </a>
        <a
          href="#"
          className={"bg-[#999999] text-black w-[136px] h-[60px] flex justify-center items-center rounded-md"}
        >
          STAMP
        </a>
      </div>
    </div>
  );
};
