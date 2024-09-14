import { useEffect, useState } from "preact/hooks";
import { ConnectWallet } from "$islands/Wallet/ConnectWallet.tsx";

export function Header() {
  const [open, setOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState<string | null>(null);

  useEffect(() => {
    // Set initial path
    setCurrentPath((globalThis?.location?.pathname)?.split("/")[1] || null);

    // Update path on route change
    const handleRouteChange = () => {
      setCurrentPath((globalThis?.location?.pathname)?.split("/")[1] || null);
    };

    // Listen for route changes
    globalThis.addEventListener("popstate", handleRouteChange);

    return () => {
      globalThis.removeEventListener("popstate", handleRouteChange);
    };
  }, []);

  const isStampingActive = currentPath === "stamping" ||
    currentPath === "stamping/stamp" ||
    currentPath === "stamping/src20";

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const toggleWalletModal = () => setIsWalletModalOpen(!isWalletModalOpen);

  const toggleMenu = () => {
    const isMobileScreen = globalThis.matchMedia("(max-width: 1024px)").matches;
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

    globalThis.addEventListener("orientationchange", handleOrientationChange);
    return () => {
      globalThis.removeEventListener(
        "orientationchange",
        handleOrientationChange,
      );
    };
  }, [open]);

  return (
    <nav className="py-2 lg:py-4">
      <div className="max-w-7xl w-full mx-auto lg:flex lg:items-center lg:justify-between">
        <div className="flex justify-between items-center">
          <a
            href="/home"
            f-partial={"/home"}
            onClick={() => {
              setCurrentPath("home");
            }}
            className={"bg-clip-text text-transparent bg-gradient-to-r from-[#440066] to-[#AA00FF] text-2xl md:text-5xl font-black italic pr-1"}
          >
            STAMPCHAIN
          </a>
          <button
            onClick={toggleMenu}
            className="text-blue-600 lg:hidden z-[100]"
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
        </div>

        {/* Desktop Navbar */}
        <div
          className={`hidden lg:flex lg:flex-row justify-between`}
        >
          <div
            className={`font-black text-center flex flex-row items-center`}
          >
            <div className={"group relative"}>
              <a
                className={`lg:px-4 lg:mx-1 transition-colors duration-300 no-underline hover:text-gray-600 text-[#8800CC] cursor-pointer text-2xl md:text-lg font-black`}
              >
                ART STAMPS
              </a>
              <div className="md:hidden md:group-hover:flex flex flex-col md:absolute md:bg-[#222] rounded top-[-10px] lg:top-[25px] left-[100px] lg:left-[15px] z-[100] py-2 text-center md:text-left">
                <a
                  href="/stamp?type=posh"
                  f-partial={"/stamp?type=posh"}
                  onClick={() => {
                    toggleMenu();
                    setCurrentPath("stamp");
                  }}
                  className={`lg:px-4 mx-2 transition-colors duration-300 no-underline hover:text-gray-600 text-[#8800CC] text-lg lg:text-base font-weight-900 ${
                    currentPath === "stamp" ? "text-[#7A00F5]" : ""
                  }`}
                >
                  POSH
                </a>
                <a
                  href="/stamp?type=classic"
                  f-partial={"/stamp?type=classic"}
                  onClick={() => {
                    toggleMenu();
                    setCurrentPath("stamp");
                  }}
                  className={`lg:px-4 mx-2 transition-colors duration-300 no-underline hover:text-gray-600 text-[#8800CC] text-lg lg:text-base font-weight-900 ${
                    currentPath === "stamp" ? "text-[#7A00F5]" : ""
                  }`}
                >
                  CLASSIC
                </a>
                <a
                  href="/stamp?type=classic&filterBy=recursive"
                  f-partial={"/stamp?type=classic&filterBy=recursive"}
                  onClick={() => {
                    toggleMenu();
                    setCurrentPath("stamp");
                  }}
                  className={`lg:px-4 mx-2 transition-colors duration-300 no-underline hover:text-gray-600 text-[#8800CC] text-lg lg:text-base font-weight-900 ${
                    currentPath === "stamp" ? "text-[#7A00F5]" : ""
                  }`}
                >
                  RECURSIVE
                </a>
                <a
                  href="/stamp?type=all"
                  f-partial={"/stamp?type=all"}
                  onClick={() => {
                    toggleMenu();
                    setCurrentPath("stamp");
                  }}
                  className={`lg:px-4 mx-2 transition-colors duration-300 no-underline hover:text-gray-600 text-[#8800CC] text-lg lg:text-base font-weight-900 ${
                    currentPath === "stamp" ? "text-[#7A00F5]" : ""
                  }`}
                >
                  VIEW ALL
                </a>
                <a
                  href="/collection"
                  f-partial={"/collection"}
                  onClick={() => {
                    toggleMenu();
                    setCurrentPath("collection");
                  }}
                  className={`lg:px-4 mx-2 transition-colors duration-300 no-underline hover:text-gray-600 text-[#8800CC] text-lg lg:text-base font-weight-900 ${
                    currentPath === "collection" ? "text-[#7A00F5]" : ""
                  }`}
                >
                  COLLECTIONS
                </a>
                <a
                  href="/stamping/stamp"
                  f-partial={"/stamping/stamp"}
                  onClick={() => {
                    toggleMenu();
                    setCurrentPath("#");
                  }}
                  className={`lg:px-4 mx-2 transition-colors duration-300 no-underline hover:text-gray-600 text-[#8800CC] text-lg lg:text-base font-weight-900 ${
                    currentPath === "stamping/stamp" ? "text-[#7A00F5]" : ""
                  }`}
                >
                  STAMP
                </a>
              </div>
            </div>

            <div className={"group relative"}>
              <a
                className={`lg:px-4 lg:mx-1 transition-colors duration-300 no-underline hover:text-gray-600 text-[#8800CC] cursor-pointer text-lg font-black`}
              >
                SRC-20 TOKENS
              </a>
              <div className="hidden group-hover:flex flex-col absolute bg-[#222] rounded top-[-10px] lg:top-[25px] left-[100px] lg:left-[15px] z-[100] py-2 text-left">
                <a
                  href="/src20?type=all"
                  f-partial={"/src20?type=all"}
                  onClick={() => {
                    toggleMenu();
                    setCurrentPath("src20");
                  }}
                  className={`lg:px-4 mx-2 transition-colors duration-300 no-underline hover:text-gray-600 text-[#8800CC] text-lg lg:text-base font-weight-900 ${
                    currentPath === "src20" ? "text-[#7A00F5]" : ""
                  }`}
                >
                  ALL
                </a>
                <a
                  href="/stamping/src20/deploy"
                  f-partial={"/stamping/src20/deploy"}
                  onClick={() => {
                    toggleMenu();
                    setCurrentPath("src20");
                  }}
                  className={`lg:px-4 mx-2 transition-colors duration-300 no-underline hover:text-gray-600 text-[#8800CC] text-lg lg:text-base font-weight-900 ${
                    currentPath === "stamping/src20" ? "text-[#7A00F5]" : ""
                  }`}
                >
                  DEPLOY
                </a>
                <a
                  href="/stamping/src20/mint"
                  f-partial={"/stamping/src20/mint"}
                  onClick={() => {
                    toggleMenu();
                    setCurrentPath("src20");
                  }}
                  className={`lg:px-4 mx-2 transition-colors duration-300 no-underline hover:text-gray-600 text-[#8800CC] text-lg lg:text-base font-weight-900 ${
                    currentPath === "stamping/src20" ? "text-[#7A00F5]" : ""
                  }`}
                >
                  MINT
                </a>
                <a
                  href="/stamping/src20/transfer"
                  f-partial={"/stamping/src20/transfer"}
                  onClick={() => {
                    toggleMenu();
                    setCurrentPath("stamping/src20");
                  }}
                  className={`lg:px-4 mx-2 transition-colors duration-300 no-underline hover:text-gray-600 text-[#8800CC] text-lg lg:text-base font-weight-900 ${
                    currentPath === "stamping/src20" ? "text-[#7A00F5]" : ""
                  }`}
                >
                  TRANSFER
                </a>
              </div>
            </div>

            <div class="">
              <ConnectWallet toggleModal={toggleWalletModal} />
            </div>
          </div>
        </div>

        {/* Mobile Navbar */}
        <div
          className={`duration-500 flex flex-col justify-between fixed right-0 top-0 w-full h-screen z-20 bg-[#080808] scroll-none p-6 pt-[120px] ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
          id="navbar-collapse"
        >
          <a
            href="/home"
            f-partial={"/home"}
            onClick={() => {
              toggleMenu();
              setCurrentPath("collection");
            }}
            className={"bg-clip-text text-transparent bg-gradient-to-r from-[#440066] to-[#AA00FF] text-2xl md:text-5xl font-black italic px-1 absolute top-10 left-2"}
          >
            STAMPCHAIN
          </a>

          <div
            className={`font-black text-center flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-10`}
          >
            <div className={"relative"}>
              <a
                className={`transition-colors duration-300 no-underline hover:text-gray-600 text-[#8800CC] cursor-pointer text-2xl font-black`}
              >
                ART STAMPS
              </a>
              <div className="flex flex-col z-[100] py-2 text-center">
                <a
                  href="/stamp?type=posh"
                  f-partial={"/stamp?type=posh"}
                  onClick={() => {
                    toggleMenu();
                    setCurrentPath("stamp");
                  }}
                  className={`mx-2 transition-colors duration-300 no-underline hover:text-gray-600 text-[#8800CC] text-lg font-weight-900 ${
                    currentPath === "#" ? "text-[#7A00F5]" : ""
                  }`}
                >
                  POSH
                </a>
                <a
                  href="#"
                  f-partial={"#"}
                  onClick={() => {
                    toggleMenu();
                    setCurrentPath("#");
                  }}
                  className={`mx-2 transition-colors duration-300 no-underline hover:text-gray-600 text-[#8800CC] text-lg font-weight-900 ${
                    currentPath === "#" ? "text-[#7A00F5]" : ""
                  }`}
                >
                  PIXEL
                </a>
                <a
                  href="#"
                  f-partial={"#"}
                  onClick={() => {
                    toggleMenu();
                    setCurrentPath("#");
                  }}
                  className={`mx-2 transition-colors duration-300 no-underline hover:text-gray-600 text-[#8800CC] text-lg font-weight-900 ${
                    currentPath === "#" ? "text-[#7A00F5]" : ""
                  }`}
                >
                  VECTOR
                </a>
                <a
                  href="#"
                  f-partial={"#"}
                  onClick={() => {
                    toggleMenu();
                    setCurrentPath("#");
                  }}
                  className={`mx-2 transition-colors duration-300 no-underline hover:text-gray-600 text-[#8800CC] text-lg font-weight-900 ${
                    currentPath === "#" ? "text-[#7A00F5]" : ""
                  }`}
                >
                  RECURSIVE
                </a>
                <a
                  href="/stamp?type=all"
                  f-partial={"/stamp?type=all"}
                  onClick={() => {
                    toggleMenu();
                    setCurrentPath("stamp");
                  }}
                  className={`mx-2 transition-colors duration-300 no-underline hover:text-gray-600 text-[#8800CC] text-lg font-weight-900 ${
                    currentPath === "stamp" ? "text-[#7A00F5]" : ""
                  }`}
                >
                  VIEW ALL
                </a>
                <a
                  href="/collection"
                  f-partial={"/collection"}
                  onClick={() => {
                    toggleMenu();
                    setCurrentPath("collection");
                  }}
                  className={`mx-2 transition-colors duration-300 no-underline hover:text-gray-600 text-[#8800CC] text-lg font-weight-900 ${
                    currentPath === "collection" ? "text-[#7A00F5]" : ""
                  }`}
                >
                  COLLECTIONS
                </a>
                <a
                  href="/stamping/stamp"
                  f-partial={"/stamping/stamp"}
                  onClick={() => {
                    toggleMenu();
                    setCurrentPath("#");
                  }}
                  className={`mx-2 transition-colors duration-300 no-underline hover:text-gray-600 text-[#8800CC] text-lg font-weight-900 ${
                    currentPath === "#" ? "text-[#7A00F5]" : ""
                  }`}
                >
                  STAMP
                </a>
              </div>
            </div>

            <div className={"relative"}>
              <a
                className={`transition-colors duration-300 no-underline hover:text-gray-600 text-[#8800CC] cursor-pointer text-2xl font-black`}
              >
                SRC-20 TOKENS
              </a>
              <div className="flex flex-col z-[100] py-2 text-center">
                <a
                  href="/src20?type=all"
                  f-partial={"/src20?type=all"}
                  onClick={() => {
                    toggleMenu();
                    setCurrentPath("src20");
                  }}
                  className={`mx-2 transition-colors duration-300 no-underline hover:text-gray-600 text-[#8800CC] text-lg font-weight-900 ${
                    currentPath === "src20" ? "text-[#7A00F5]" : ""
                  }`}
                >
                  ALL
                </a>
                <a
                  href="/src20?type=trending"
                  f-partial={"/src20?type=trending"}
                  onClick={() => {
                    toggleMenu();
                    setCurrentPath("src20");
                  }}
                  className={`mx-2 transition-colors duration-300 no-underline hover:text-gray-600 text-[#8800CC] text-lg font-weight-900 ${
                    currentPath === "src20" ? "text-[#7A00F5]" : ""
                  }`}
                >
                  TRENDING
                </a>
                <a
                  href="/stamping/src20/deploy"
                  f-partial={"/stamping/src20/deploy"}
                  onClick={() => {
                    toggleMenu();
                    setCurrentPath("stamping/src20");
                  }}
                  className={`mx-2 transition-colors duration-300 no-underline hover:text-gray-600 text-[#8800CC] text-lg font-weight-900 ${
                    currentPath === "stamping/src20" ? "text-[#7A00F5]" : ""
                  }`}
                >
                  DEPLOY
                </a>
              </div>
            </div>

            <div class="mt-3">
              <ConnectWallet toggleModal={toggleWalletModal} />
            </div>
          </div>

          <div
            class={`gap-6 items-center justify-center flex`}
          >
            <a href="https://x.com/Stampchain">
              <img src="/img/footer/XLogo.png" class="w-12" />
            </a>
            <a href="https://discord.gg/PCZU6xrt">
              <img src="/img/footer/DiscordLogo.png" class="w-12" />
            </a>
            <a href="https://t.me/BitcoinStamps">
              <img src="/img/footer/TelegramLogo.png" class="w-12" />
            </a>
            <a href="https://github.com/stampchain-io/">
              <img src="/img/footer/GithubLogo.png" class="w-12" />
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
