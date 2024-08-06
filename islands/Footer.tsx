export function Footer() {
  return (
    <div class="flex flex-col gap-5 my-5">
      <hr />
      <div class="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto w-full">
        <div>
          <img src="/img/header/logo.png" class="w-44" />
        </div>

        <div class="flex flex-col gap-5 my-5">
          <p class="text-[22px] md:text-xl text-[#D9D9D9] text-center">
            Bitcoin Stamps © 2024 | All Rights Reserved
          </p>

          <div class="flex gap-7 items-center justify-center">
            <a href="https://x.com/Stampchain">
              <img src="/img/footer/icon_x.png" class="w-14" />
            </a>
            <a href="https://discord.gg/PCZU6xrt">
              <img src="/img/footer/icon_discord.png" class="w-14" />
            </a>
            <a href="https://t.me/BitcoinStamps">
              <img src="/img/footer/icon_telegram.png" class="w-14" />
            </a>
            <a href="https://github.com/stampchain-io/">
              <img src="/img/footer/icon_github.png" class="w-14" />
            </a>
          </div>
        </div>

        <div class="hidden md:block md:invisible">
          <img src="/img/header/logo.png" class="w-44" />
        </div>
      </div>
      <div className="md:flex items-center justify-end text-[#F5F5F5] text-xl md:-mt-5 gap-5 px-6 md:px-12">
        <div className="flex gap-5">
          <div className="flex gap-1 items-center">
            <img src="/img/footer/icon_btc.png" className="w-5 h-5" alt="" />
            <p>$60,935.68</p>
          </div>
          <p>Fees: 8 sat/vB $0.68</p>
        </div>
        <div className="flex gap-1 items-center">
          <img src="/img/footer/icon_support.png" className="w-5 h-5" alt="" />
          <p>Support</p>
        </div>
      </div>
    </div>
  );
}
