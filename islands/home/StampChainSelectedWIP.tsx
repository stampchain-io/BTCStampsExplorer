export const HomeStampChainSelected = () => {
  return (
    <div>
      <p className="bg-text-purple bg-clip-text text-transparent text-4xl mobileLg:text-7xl font-black">
        <span className="italic">STAMPCHAIN</span> SELECTED
      </p>
      <p className="text-stamp-primary text-3xl mobileLg:text-6xl font-extralight">
        BESPOKE BITCOIN ART
      </p>
      <div className="flex flex-col mobileLg:flex-row gap-16">
        <div className="flex flex-col justify-between">
          <div>
            <p className="bg-text-gray-4 bg-clip-text text-transparent flex flex-col text-3xl mobileLg:text-6xl font-bold">
              CURATED STAMPS
              <span className="text-2xl mobileLg:text-5xl font-light">
                RELEASED EVERY MONTH
              </span>
            </p>
            <p className="text-stamp-text-primary font-medium text-xl mobileLg:text-4xl">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean
              diam libero, faucibus ut sagittis at, rutrum nec eros. Donec sit
              amet blandit arcu. Nullam ultrices a mauris non efficitur. Morbi
              in purus a erat mollis tincidunt eget sit amet velit.
            </p>
          </div>
          <div>
            <p className="font-extralight text-stamp-purple-highlight text-right text-xl mobileLg:text-4xl">
              S1 - OCTOBER
            </p>
            <p className="bg-text-purple-2 bg-clip-text text-transparent font-black text-4xl mobileLg:text-7xl">
              CONNOISSEUR
            </p>
            <p className="text-stamp-purple-highlight text-xl mobileLg:text-4xl font-extralight">
              BY <span className="font-bold">VIVA LA VANDAL</span>
            </p>
            <div className="flex gap-4 mobileLg:gap-12 mt-2 mobileLg:mt-5 font-extrabold">
              <img src="/img/home/fullscreen.png" alt="Fullscreen" />
              <a
                href="#"
                className="border-2 border-stamp-primary text-stamp-primary w-[136px] h-[60px] flex justify-center items-center rounded-md"
              >
                DETAILS
              </a>
              <a
                href="#"
                className="bg-stamp-primary text-stamp-button-text w-[136px] h-[60px] flex justify-center items-center rounded-md"
              >
                BUY
              </a>
            </div>
          </div>
        </div>
        <img src="/img/home/stamp.png" alt="Stamp" />
      </div>
    </div>
  );
};
