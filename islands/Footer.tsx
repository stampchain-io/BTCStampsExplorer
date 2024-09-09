export function Footer() {
  return (
    <div
      className={"px-2 text-[#7200B4] font-bold flex flex-col gap-5 my-5 max-w-7xl w-full mx-auto"}
    >
      <div className={"py-2 md:py-10 xl:py-20 flex flex-col gap-4"}>
        <div
          className={"flex flex-col-reverse md:flex-row justify-between gap-4 text-sm md:text-lg"}
        >
          <div
            className={"text-left flex flex-col justify-between gap-1 w-full"}
          >
            <div className={"flex flex-col gap-1"}>
              <p
                className={"bg-clip-text text-transparent bg-gradient-to-r from-[#440066] to-[#AA00FF] text-4xl md:text-7xl font-black italic"}
              >
                STAMPCHAIN<span className={"font-extralight"}>.IO</span>
              </p>
              <p className={"text-base md:text-2xl font-light"}>
                IMMORTALISED ART - STORED ON BITCOIN
              </p>
              <div className={"flex gap-6"}>
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

          <div className={"flex justify-between w-full"}>
            <div className={"text-left flex flex-col gap-1"}>
              <p className={"text-2xl font-black"}>STAMPS</p>
              <a href="#">
                View All
              </a>
              <a href="#">
                Selected Series
              </a>
              <a href="#">
                Vendingmachine
              </a>
              <a href="#">
                Stamping
              </a>
              <a href="#">
                Collab
              </a>
            </div>

            <div className={"text-right flex flex-col gap-1"}>
              <p className={"text-2xl font-black"}>RESOURCES</p>
              <a
                href="/faq"
                f-partial={"/faq"}
              >
                FAQ
              </a>
              <a href="https://github.com/stampchain-io/">
                GitHub
              </a>
              <a
                href="/presskit"
                f-partial={"/presskit"}
              >
                Press Kit
              </a>
              <a href="#">
                Support
              </a>
              <a href="#">
                Disclaimer
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
