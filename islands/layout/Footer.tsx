export function Footer() {
  return (
    <footer className="px-3 md:px-6 xl:px-12 py-6 sm:py-9 md:py-[72px] text-[#8800CC] font-medium max-w-[1440px] w-full mx-auto flex flex-col md:flex-row justify-between gap-4 text-sm md:text-lg">
      <div className="w-full flex flex-col gap-1 items-center md:items-start">
        <p className="bg-clip-text text-transparent bg-gradient-to-r from-[#440066] via-[#7700BB] to-[#AA00FF] text-3xl md:text-6xl italic font-black">
          STAMPCHAIN
          <span className="font-extralight pr-1">.IO</span>
        </p>
        <p className="text-xs md:text-xl font-light mb-2 md:mb-0">
          IMMORTALISED ART - STORED ON BITCOIN
        </p>
        <div className="flex gap-6">
          <a href="#" target="_blank">
            <img
              src="/img/footer/EnvelopeSimple.png"
              className="w-11 h-10"
            />
          </a>
          <a href="https://x.com/Stampchain" target="_blank">
            <img src="/img/footer/XLogo.png" />
          </a>
          <a href="https://t.me/BitcoinStamps" target="_blank">
            <img src="/img/footer/TelegramLogo.png" />
          </a>
          <a href="https://discord.gg/PCZU6xrt" target="_blank">
            <img src="/img/footer/DiscordLogo.png" />
          </a>
          <a href="https://github.com/stampchain-io/" target="_blank">
            <img src="/img/footer/GithubLogo.png" />
          </a>
        </div>
      </div>

      <div className="flex justify-end lg:justify-between w-full">
        <div className="hidden lg:flex flex-col gap-1">
          <p className="text-lg font-black">ART STAMPS</p>
          <a
            href="/stamp?type=classic"
            f-partial="/stamp?type=classic"
            className="leading-4 hover:text-[#AA00FF]"
          >
            ALL
          </a>
          <a
            href="/collection"
            f-partial="/collection"
            className="leading-4 hover:text-[#AA00FF]"
          >
            COLLECTIONS
          </a>
          <a
            href="/stamping/stamp"
            f-partial="/stamping/stamp"
            className="leading-4 hover:text-[#AA00FF]"
          >
            STAMPING
          </a>
        </div>

        <div className="text-right flex flex-col items-center md:items-end gap-6 md:gap-1 w-full md:w-auto">
          <p className="text-lg font-black hidden md:block">
            ABOUT
          </p>
          <div className="flex flex-row md:flex-col justify-between w-full max-w-[320px] gap-1 leading-4">
            <a
              href="/about"
              f-partial="/about"
              className="hidden md:block hover:text-[#AA00FF]"
            >
              STAMPCHAIN
            </a>
            <a
              href="/about"
              f-partial="/about"
              className="block md:hidden hover:text-[#AA00FF]"
            >
              ABOUT
            </a>
            <a href="#" className="hover:text-[#AA00FF]">
              DONATE
            </a>
            <a
              href="/faq"
              f-partial="/faq"
              className="hover:text-[#AA00FF]"
            >
              FAQ
            </a>
            <a
              href="https://github.com/stampchain-io/"
              className="hover:text-[#AA00FF]"
              target="_blank"
            >
              MEDIA
            </a>
            <a
              href="/presskit"
              f-partial="/presskit"
              className="hover:text-[#AA00FF]"
            >
              PRESS KIT
            </a>
            <a
              href="/termsofservice"
              f-partial="/termsofservice"
              className="hidden md:block hover:text-[#AA00FF]"
            >
              TERMS OF SERVICE
            </a>
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-[#440066]">
              <span className="italic">STAMPCHAIN</span> @ 2024
            </a>
            <a
              href="/termsofservice"
              f-partial="/termsofservice"
              className="block md:hidden hover:text-[#AA00FF]"
            >
              TERMS OF SERVICE
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
