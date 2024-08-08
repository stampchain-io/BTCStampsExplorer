import { useEffect, useState } from "preact/hooks";
import { ConnectWallet } from "$islands/Wallet/ConnectWallet.tsx";

export function Header() {
  const [open, setOpen] = useState(false);

  let path: string | null = null;
  if (typeof window !== undefined) {
    path = (globalThis?.location?.pathname)?.split("/")[1];
  }
  const toggleMenu = () => {
    const isMobileScreen = window.matchMedia("(max-width: 768px)").matches;
    if (!isMobileScreen) return;
    setOpen(!open);
    document.body.style.overflow = !open ? "hidden" : "";
  };

  useEffect(() => {
    const handleOrientationChange = () => {
      if (open) {
        setOpen(false);
        document.body.style.overflow = "";
      }
    };

    window.addEventListener("orientationchange", handleOrientationChange);
    return () => {
      window.removeEventListener("orientationchange", handleOrientationChange);
    };
  }, [open]);

  return (
    <nav className="py-2 md:py-4">
      <div className="container mx-auto md:flex md:items-center md:justify-between">
        <div className="flex justify-between items-center">
          <a
            href="/block/last"
            f-partial={"/block/last"}
            className="font-bold text-xl text-indigo-600 hidden md:block"
          >
            <img
              src="/img/header/logo.png"
              alt="stampchain"
              className="w-[178px] h-auto"
            />
          </a>
          <button
            onClick={toggleMenu}
            className="px-3 py-1 text-blue-600 md:hidden z-[100]"
            id="navbar-toggle"
          >
            {open && (
              <img
                src="/img/header/menu-close.png"
                alt="menu"
                className="w-6 h-6"
              />
            )}
            {!open && (
              <img
                src="/img/header/menu-open.png"
                alt="menu"
                className="w-6 h-6"
              />
            )}
          </button>

          <div class="block md:hidden">
            <ConnectWallet />
          </div>
        </div>

        <div
          className={`${
            open
              ? "flex left-0 top-0 fixed w-[300px] h-screen z-20 bg-[#181818] scroll-none p-6 pt-[120px]"
              : "hidden"
          } flex-col md:flex md:flex-row text-center justify-between`}
          id="navbar-collapse"
        >
          <img
            src="/img/header/logo.png"
            alt="stampchain"
            className={`${
              open ? "absolute" : "hidden"
            } top-12 right-5 w-[178px] h-auto`}
          />
          <div
            className={`${
              open
                ? "flex flex-col md:flex-row items-start justify-between gap-8 md:gap-10 text-center"
                : "hidden md:flex flex-col md:flex-row text-center"
            } `}
          >
            <a
              href="/home"
              f-partial={"/home"}
              onClick={toggleMenu}
              className={`pb-2 lg:px-4 md:mx-2 transition-colors duration-300 no-underline hover:text-gray-600 text-white text-lg md:text-base ${
                path === "home" ? "border-[#7A00F5] border-b-4" : ""
              }`}
            >
              Home
            </a>
            <a
              href="/stamp?ident=classic"
              f-partial={"/stamp?ident=classic"}
              onClick={toggleMenu}
              className={`pb-2 lg:px-4 md:mx-2 transition-colors duration-300 no-underline hover:text-gray-600 text-white text-lg md:text-base ${
                path === "stamp" ? "border-[#7A00F5] border-b-4" : ""
              }`}
            >
              Stamps
            </a>
            <a
              href="/src20"
              f-partial={"/src20"}
              onClick={toggleMenu}
              className={`pb-2 lg:px-4 md:mx-2 transition-colors duration-300 no-underline hover:text-gray-600 text-white text-lg md:text-base ${
                path === "src20" ? "border-[#7A00F5] border-b-4" : ""
              }`}
            >
              Src-20
            </a>
            <a
              href="/block/last"
              f-partial={"/block/last"}
              onClick={toggleMenu}
              className={`pb-2 lg:px-4 md:mx-2 transition-colors duration-300 no-underline hover:text-gray-600 text-white text-lg md:text-base ${
                path === "block" ? "border-[#7A00F5] border-b-4" : ""
              }`}
            >
              Blocks
            </a>
            <a
              href="/collection"
              f-partial={"/collection"}
              onClick={toggleMenu}
              className={`pb-2 lg:px-4 md:mx-2 transition-colors duration-300 no-underline hover:text-gray-600 text-white text-lg md:text-base ${
                path === "collection" ? "border-[#7A00F5] border-b-4" : ""
              }`}
            >
              Collections
            </a>
            <div className={"group relative"}>
              <a
                className={`pb-2 lg:px-4 md:mx-2 transition-colors duration-300 no-underline hover:text-gray-600 text-white cursor-pointer text-lg md:text-base ${
                  path === "stamping" ? "border-[#7A00F5] border-b-4" : ""
                }`}
              >
                Stamping
              </a>
              <div className="hidden group-hover:flex flex-col absolute bg-[#222] rounded top-[-10px] md:top-[34px] left-[100px] md:left-[15px] z-[100] py-2">
                <a
                  href="/stamping/mint"
                  f-partial={"/stamping/mint"}
                  onClick={toggleMenu}
                  className={`pb-2 lg:px-4 mx-2 transition-colors duration-300 no-underline hover:text-gray-600 text-white text-lg md:text-base ${
                    path === "stamping/mint"
                      ? "border-[#7A00F5] border-b-4"
                      : ""
                  }`}
                >
                  Mint
                </a>
                <a
                  href="/stamping/deploy"
                  f-partial={"/stamping/deploy"}
                  onClick={toggleMenu}
                  className={`lg:px-4 mx-2 transition-colors duration-300 no-underline hover:text-gray-600 text-white text-lg md:text-base ${
                    path === "stamping/deploy"
                      ? "border-[#7A00F5] border-b-4"
                      : ""
                  }`}
                >
                  Deploy
                </a>
              </div>
            </div>
            {
              /* <a
              href="/upload"
              f-partial={"/upload"}
              onClick={toggleMenu}
              className={`pb-2 lg:px-4 md:mx-2 transition-colors duration-300 no-underline hover:text-gray-600 text-white text-lg md:text-base ${
                path === "upload" ? "border-[#7A00F5] border-b-4" : ""
              }`}
            >
              Upload Image
            </a> */
            }

            <div class="block md:hidden">
              <ConnectWallet />
            </div>
          </div>

          <div
            class={`gap-6 items-center justify-center ${
              open ? "flex" : "hidden"
            }`}
          >
            <a href="https://x.com/Stampchain">
              <img src="/img/footer/icon_x.png" class="w-12" />
            </a>
            <a href="https://discord.gg/PCZU6xrt">
              <img src="/img/footer/icon_discord.png" class="w-12" />
            </a>
            <a href="https://t.me/BitcoinStamps">
              <img src="/img/footer/icon_telegram.png" class="w-12" />
            </a>
            <a href="https://github.com/stampchain-io/">
              <img src="/img/footer/icon_github.png" class="w-12" />
            </a>
          </div>
        </div>

        <div class="hidden md:block">
          <ConnectWallet />
        </div>
      </div>
    </nav>
  );
}
