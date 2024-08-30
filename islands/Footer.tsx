export function Footer() {
  return (
    <div className={"text-[#7200B4] font-bold flex flex-col gap-5 my-5"}>
      <div
        className={"bg-gradient-to-r from-[#7200B4] via-[#FF00E9] to-[#7200B4] w-full h-2"}
      />

      <div className={"p-2 md:p-10 xl:p-20 flex flex-col gap-4"}>
        <div
          className={"flex flex-col md:flex-row justify-between gap-4 text-sm md:text-lg"}
        >
          <div className={"text-left flex flex-col gap-1"}>
            <p className={"text-2xl font-black"}>SOCIALS</p>
            <div className={"flex flex-row justify-between md:flex-col gap-1"}>
              <a href="https://x.com/Stampchain" className={"w-1/3 md:w-full"}>
                Twitter
              </a>
              <a
                href="https://t.me/BitcoinStamps"
                className={"w-1/3 md:w-full"}
              >
                Telegram
              </a>
              <a
                href="https://discord.gg/PCZU6xrt"
                className={"w-1/3 md:w-full"}
              >
                Discord
              </a>
            </div>
          </div>

          <div className={"text-left md:text-center flex flex-col gap-1"}>
            <p className={"text-2xl font-black"}>COLLAB</p>
            <div className={"flex flex-row justify-between md:flex-col gap-1"}>
              <a href="#" className={"w-1/3 md:w-full"}>
                Selected Series
              </a>
              <a href="#" className={"w-1/3 md:w-full"}>
                Vendingmachine
              </a>
              <a href="#" className={"w-1/3 md:w-full"}>
                Get Featured
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
                Legal Stuff
              </a>
              <a href="#" className={"invisible md:hidden w-1/3 md:w-full"}>
                Legal Stuff
              </a>
            </div>
          </div>
        </div>

        <div>
          <p
            className={"bg-clip-text text-transparent bg-gradient-to-r from-[#7200B4] to-[#FF00E9] text-4xl md:text-7xl font-black italic"}
          >
            STAMPCHAIN
          </p>
          <p className={"text-lg font-semibold"}>
            Bitcoin Stamps © 2024 All Rights Reserved
          </p>
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
