export function Footer() {
  return (
    <div class="flex flex-col gap-5 my-5">
      <hr />
      <div class="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto w-full">
        <div>
          <img src="/img/logo.png" class="w-44" />
        </div>

        <div class="flex flex-col gap-5 my-5">
          <p class="text-xl text-[#D9D9D9] text-center">
            Bitcoin Stamps © 2024 | All Rights Reserved
          </p>

          <div class="flex gap-7 items-center justify-center">
            <a href="https://x.com/Stampchain">
              <img src="/img/icon_x.png" class="w-14" />
            </a>
            <a href="https://discord.gg/PCZU6xrt">
              <img src="/img/icon_discord.png" class="w-14" />
            </a>
            <a href="https://t.me/BitcoinStamps">
              <img src="/img/icon_telegram.png" class="w-14" />
            </a>
          </div>
        </div>

        <div class="hidden md:block md:invisible">
          <img src="/img/logo.png" class="w-44" />
        </div>
      </div>
    </div>
  );
}
