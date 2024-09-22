export function Footer() {
  return (
    <div
      className={"px-2 text-[#7200B4] font-bold flex flex-col gap-5 my-5 max-w-7xl w-full mx-auto"}
    >
      <div className={"py-2 md:py-10 xl:py-20 flex flex-col gap-4"}>
        <div
          className={"flex flex-col md:flex-row justify-between gap-4 text-sm md:text-lg"}
        >
          <div
            className={"text-left flex flex-col justify-center md:justify-between gap-1 w-full"}
          >
            <div className={"flex flex-col gap-1 items-center md:items-start"}>
              <p
                className={"bg-clip-text text-transparent bg-gradient-to-r from-[#440066] to-[#AA00FF] text-4xl md:text-7xl font-black italic"}
              >
                STAMPCHAIN<span className={"font-extralight"}>.IO</span>
              </p>
              <p className={"text-base md:text-2xl font-light"}>
                IMMORTALISED ART - STORED ON BITCOIN
              </p>
              <div className={"flex gap-6"}>
                <a href="#">
                  <img
                    src="/img/footer/EnvelopeSimple.png"
                    className={"w-11 h-10"}
                  />
                </a>
                <a href="https://x.com/Stampchain">
                  <img src="/img/footer/XLogo.png" />
                </a>
                <a href="https://t.me/BitcoinStamps">
                  <img src="/img/footer/TelegramLogo.png" />
                </a>
                <a href="https://discord.gg/PCZU6xrt">
                  <img src="/img/footer/DiscordLogo.png" />
                </a>
                <a href="https://github.com/stampchain-io/">
                  <img src="/img/footer/GithubLogo.png" />
                </a>
              </div>
            </div>
          </div>

          <div className={"flex justify-center md:justify-between w-full"}>
            <div className={"text-left hidden md:flex flex-col gap-1"}>
              <p className={"text-2xl font-black"}>ART STAMPS</p>
              <a href="#">
                All
              </a>
              <a href="#">
                COLLECTIONS
              </a>
              <a href="#">
                STAMPING
              </a>
            </div>

            <div
              className={"text-right flex flex-col items-center md:items-end gap-1"}
            >
              <p className={"text-2xl font-black hidden md:block"}>RESOURCES</p>
              <div className={"flex flex-row md:flex-col gap-1"}>
                <a
                  href="/about"
                  f-partial={"/about"}
                >
                  ABOUT
                </a>
                <a
                  href="/faq"
                  f-partial={"/faq"}
                >
                  FAQ
                </a>
                <a
                  href="https://github.com/stampchain-io/"
                  className={"hidden md:block"}
                >
                  GITHUB
                </a>
                <a
                  href="/presskit"
                  f-partial={"/presskit"}
                >
                  PRESS KIT
                </a>
                <a href="#">
                  TERMS OF SERVICE
                </a>
              </div>
              <a href="#" className={"text-[#440066]"}>
                STAMPCHAIN @ 2024
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
