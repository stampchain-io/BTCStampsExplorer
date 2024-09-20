export const GetStampingModule = () => {
  return (
    <div
      className={"flex flex-col md:flex-row justify-between md:items-end gap-16 md:gap-32"}
    >
      <div>
        <p
          className={"italic font-black text-4xl md:text-7xl flex flex-col bg-clip-text text-transparent bg-gradient-to-r from-[#666666] to-[#999999] text-left"}
        >
          GET STAMPING
          <span
            className={"not-italic text-3xl md:text-6xl font-extralight text-[#999999]"}
          >
            IMMORTALISE YOUR ART
          </span>
        </p>

        <p className={"text-[#CCCCCC] text-2xl font-medium"}>
          Stamp Posh or Classic stamps cheap and effortlessly with built in
          compression tools, custom fee selection and frictionless Posh naming
          options.<br />
          <br />
          Support for png/jpg/gif low-fi pixel art and hi-res svg/html vector
          art - up to 65kB.
        </p>
      </div>

      <div className={"flex gap-12 font-extrabold text-xl justify-center"}>
        <a
          href="/stamping/stamp"
          className={"border-2 border-[#999999] text-[#999999] w-[136px] h-[60px] flex justify-center items-center rounded-md"}
        >
          FAQ
        </a>
        <a
          href="/faq"
          className={"bg-[#999999] text-black w-[136px] h-[60px] flex justify-center items-center rounded-md"}
        >
          STAMP
        </a>
      </div>
    </div>
  );
};
