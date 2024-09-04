export function Footer() {
  return (
    <div
      className={"px-2 text-[#7200B4] font-bold flex flex-col gap-5 my-5 max-w-7xl w-full mx-auto"}
    >
      {
        /* <div
        className={"bg-gradient-to-r from-[#7200B4] via-[#FF00E9] to-[#7200B4] w-full h-2"}
      /> */
      }

      <div className={"py-2 md:py-10 xl:py-20 flex flex-col gap-4"}>
        <div
          className={"flex flex-col md:flex-row justify-between gap-4 text-sm md:text-lg"}
        >
          <div className={"text-left flex flex-col justify-between gap-1"}>
            <div className={"flex flex-col gap-1"}>
              <p
                className={"bg-clip-text text-transparent bg-gradient-to-r from-[#440066] to-[#AA00FF] text-4xl md:text-7xl font-black italic px-2"}
              >
                STAMPCHAIN<span className={"font-extralight"}>.IO</span>
              </p>
              <p className={"text-2xl font-light"}>
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
            <p className={"font-semibold text-[#660066]"}>
              Bitcoin Stamps © 2024 All Rights Reserved
            </p>
          </div>

          <div className={"text-left flex flex-col gap-1"}>
            <p className={"text-2xl font-black"}>STAMPS</p>
            <div className={"flex flex-row justify-between md:flex-col gap-1"}>
              <a href="#" className={"w-1/3 md:w-full"}>
                View All
              </a>
              <a href="#" className={"w-1/3 md:w-full"}>
                Selected Series
              </a>
              <a href="#" className={"w-1/3 md:w-full"}>
                Vendingmachine
              </a>
            </div>
            <div className={"flex flex-row justify-between md:flex-col gap-1"}>
              <a href="#" className={"w-1/3 md:w-full"}>
                Stamping
              </a>
              <a href="#" className={"w-1/3 md:w-full"}>
                Collab
              </a>
              <a href="#" className={"invisible md:hidden w-1/3 md:w-full"}>
                Collab
              </a>
            </div>
          </div>

          <div className={"text-left md:text-right flex flex-col gap-1"}>
            <p className={"text-2xl font-black"}>RESOURCES</p>
            <div className={"flex flex-row justify-between md:flex-col gap-1"}>
              <a href="#" className={"w-1/3 md:w-full"}>
                FAQ
              </a>
              <a
                href="https://github.com/stampchain-io/"
                className={"w-1/3 md:w-full"}
              >
                GitHub
              </a>
              <a href="#" className={"w-1/3 md:w-full"}>
                Press Kit
              </a>
            </div>
            <div
              className={"flex flex-row justify-between md:flex-col gap-1"}
            >
              <a href="#" className={"w-1/3 md:w-full"}>
                Support
              </a>
              <a href="#" className={"w-1/3 md:w-full"}>
                Disclaimer
              </a>
              <a href="#" className={"invisible md:hidden w-1/3 md:w-full"}>
                Disclaimer
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    // <div class="flex flex-col gap-5 my-5">
    //   <hr />
    //   <div class="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto w-full">
    //     <div>
    //       <img src="/img/header/logo.png" class="w-44" />
    //     </div>

    //     <div class="flex flex-col gap-5 my-5">
    //       <p class="text-[22px] md:text-xl text-[#D9D9D9] text-center">
    //         Bitcoin Stamps © 2024 | All Rights Reserved
    //       </p>

    //       <div class="flex gap-7 items-center justify-center">
    //         <a href="https://x.com/Stampchain">
    //           <img src="/img/footer/icon_x.png" class="w-14" />
    //         </a>
    //         <a href="https://discord.gg/PCZU6xrt">
    //           <img src="/img/footer/icon_discord.png" class="w-14" />
    //         </a>
    //         <a href="https://t.me/BitcoinStamps">
    //           <img src="/img/footer/icon_telegram.png" class="w-14" />
    //         </a>
    //         <a href="https://github.com/stampchain-io/">
    //           <img src="/img/footer/icon_github.png" class="w-14" />
    //         </a>
    //       </div>
    //     </div>

    //     <div class="hidden md:block md:invisible">
    //       <img src="/img/header/logo.png" class="w-44" />
    //     </div>
    //   </div>
    //   <div className="md:flex items-center justify-end text-[#F5F5F5] text-xl md:-mt-5 gap-5 px-6 md:px-12">
    //     <div className="flex gap-5">
    //       <div className="flex gap-1 items-center">
    //         <img src="/img/footer/icon_btc.png" className="w-5 h-5" alt="" />
    //         <p>$60,935.68</p>
    //       </div>
    //       <p>Fees: 8 sat/vB $0.68</p>
    //     </div>
    //     <div className="flex gap-1 items-center">
    //       <img src="/img/footer/icon_support.png" className="w-5 h-5" alt="" />
    //       <p>Support</p>
    //     </div>
    //   </div>
    // </div>
  );
}
