export const HomeStampChainSelected = () => {
  return (
    <div>
      <p
        className={"bg-clip-text text-transparent bg-gradient-to-r from-[#440066] to-[#8800CC] text-4xl md:text-7xl font-black"}
      >
        <span className={"italic"}>STAMPCHAIN</span> SELECTED
      </p>
      <p className={"text-[#8800CC] text-3xl md:text-6xl font-extralight"}>
        BESPOKE BITCOIN ART
      </p>
      <div className={"flex flex-col md:flex-row gap-16"}>
        <div className={"flex flex-col justify-between"}>
          <div>
            <p
              className={"bg-clip-text text-transparent bg-gradient-to-r from-[#666666] to-[#999999] flex flex-col text-3xl md:text-6xl font-bold"}
            >
              CURATED STAMPS
              <span className={"text-2xl md:text-5xl font-light"}>
                RELEASED EVERY MONTH
              </span>
            </p>
            <p className={"text-[#999999] font-medium text-xl md:text-4xl"}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean
              diam libero, faucibus ut sagittis at, rutrum nec eros. Donec sit
              amet blandit arcu. Nullam ultrices a mauris non efficitur. Morbi
              in purus a erat mollis tincidunt eget sit amet velit.
            </p>
          </div>
          <div>
            <p
              className={"font-extralight text-[#AA00FF] text-right text-xl md:text-4xl"}
            >
              S1 - OCTOBER
            </p>
            <p
              className={"bg-clip-text text-transparent bg-gradient-to-r from-[#440066] to-[#AA00FF] font-black text-4xl md:text-7xl"}
            >
              CONNOISSEUR
            </p>
            <p className={"text-[#AA00FF] text-xl md:text-4xl font-extralight"}>
              BY <span className={"font-bold"}>VIVA LA VANDAL</span>
            </p>
            <div className={"flex gap-4 md:gap-12 mt-2 md:mt-5 font-extrabold"}>
              <img src="/img/home/fullscreen.png" />
              <a
                href="#"
                className={"border-2 border-[#8800CC] text-[#8800CC] w-[136px] h-[60px] flex justify-center items-center rounded-md"}
              >
                DETAILS
              </a>
              <a
                href="#"
                className={"bg-[#8800CC] text-[#330033] w-[136px] h-[60px] flex justify-center items-center rounded-md"}
              >
                BUY
              </a>
            </div>
          </div>
        </div>

        <img src="/img/home/stamp.png" />
      </div>
    </div>
  );
};
