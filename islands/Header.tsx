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
      <div className="container mx-auto lg:flex lg:items-center lg:justify-between">
        <div className="flex justify-between items-center">
          <a
            href="/home"
            f-partial={"/home"}
            onClick={() => {
              toggleMenu();
              setCurrentPath("collection");
            }}
            className={"bg-clip-text text-transparent bg-gradient-to-r from-[#7200B4] to-[#FF00E9] text-xl md:text-4xl font-black italic hidden lg:block lg:px-1"}
          >
            STAMPCHAIN
          </a>
          <button
            onClick={toggleMenu}
            className="px-3 py-1 text-blue-600 lg:hidden z-[100]"
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

          <div class="block lg:hidden">
            <ConnectWallet toggleModal={toggleWalletModal} />
          </div>
        </div>

        <div
          className={`${
            open
              ? "flex left-0 top-0 fixed min-w-[300px] w-4/5 h-screen z-20 bg-[#181818] scroll-none p-6 pt-[120px]"
              : "hidden"
          } flex-col lg:flex lg:flex-row text-center justify-between`}
          id="navbar-collapse"
        >
          {
            /* <a
            href="/home"
            f-partial={"/home"}
            onClick={() => {
              toggleMenu();
              setCurrentPath("collection");
            }}
            className="font-bold text-xl text-indigo-600 block lg:hidden"
          >
            <img
              src="/img/header/logo.png"
              alt="stampchain"
              className={`${
                open ? "absolute" : "hidden"
              } top-12 right-5 w-[178px] h-auto`}
            />
          </a> */
          }
          <a
            href="/home"
            f-partial={"/home"}
            onClick={() => {
              toggleMenu();
              setCurrentPath("collection");
            }}
            className={`bg-clip-text text-transparent bg-gradient-to-r from-[#7200B4] to-[#FF00E9] text-xl md:text-4xl font-black italic block lg:hidden px-1 ${
              open ? "absolute" : "hidden"
            } top-12 right-5`}
          >
            STAMPCHAIN
          </a>
          <div
            className={`font-black text-center ${
              open
                ? "flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-10"
                : "hidden lg:flex flex-col lg:flex-row items-center"
            }`}
          >
            <a
              href="/stamp?ident=classic"
              f-partial={"/stamp?ident=classic"}
              onClick={() => {
                toggleMenu();
                setCurrentPath("stamp");
              }}
              className={`lg:px-4 lg:mx-1 transition-colors duration-300 no-underline hover:text-gray-600 text-white text-lg lg:text-base font-weight-900 ${
                currentPath === "stamp" ? "border-[#7A00F5] border-b-4" : ""
              }`}
            >
              STAMPS
            </a>
            <a
              href="/collection"
              f-partial={"/collection"}
              onClick={() => {
                toggleMenu();
                setCurrentPath("collection");
              }}
              className={`lg:px-4 lg:mx-1 transition-colors duration-300 no-underline hover:text-gray-600 text-white text-lg lg:text-base font-weight-900 ${
                currentPath === "collection"
                  ? "border-[#7A00F5] border-b-4"
                  : ""
              }`}
            >
              COLLECTIONS
            </a>
            <a
              href="/src20"
              f-partial={"/src20"}
              onClick={() => {
                toggleMenu();
                setCurrentPath("src20");
              }}
              className={`lg:px-4 lg:mx-1 transition-colors duration-300 no-underline hover:text-gray-600 text-white text-lg lg:text-base font-weight-900 ${
                currentPath === "src20" ? "border-[#7A00F5] border-b-4" : ""
              }`}
            >
              SRC-20
            </a>
            <a
              href="/block/last"
              f-partial={"/block/last"}
              onClick={() => {
                toggleMenu();
                setCurrentPath("block");
              }}
              className={`lg:px-4 lg:mx-1 transition-colors duration-300 no-underline hover:text-gray-600 text-white text-lg lg:text-base font-weight-900 ${
                currentPath === "block" ? "border-[#7A00F5] border-b-4" : ""
              }`}
            >
              BLOCKS
            </a>

            <div className={"group relative"}>
              <a
                className={`lg:px-4 lg:mx-1 transition-colors duration-300 no-underline hover:text-gray-600 text-white cursor-pointer text-lg lg:text-base font-weight-900 ${
                  isStampingActive ? "border-[#7A00F5] border-b-4" : ""
                }`}
              >
                STAMPING
              </a>
              <div className="hidden group-hover:flex flex-col absolute bg-[#222] rounded top-[-10px] lg:top-[25px] left-[100px] lg:left-[15px] z-[100] py-2">
                <a
                  href="/stamping/stamp"
                  f-partial={"/stamping/stamp"}
                  onClick={() => {
                    toggleMenu();
                    setCurrentPath("stamping/stamp");
                  }}
                  className={`pb-2 lg:px-4 mx-2 transition-colors duration-300 no-underline hover:text-gray-600 text-white text-lg lg:text-base font-weight-900 ${
                    currentPath === "stamping/stamp" ? "text-[#7A00F5]" : ""
                  }`}
                >
                  STAMP
                </a>
                <a
                  href="/stamping/src20"
                  f-partial={"/stamping/src20"}
                  onClick={() => {
                    toggleMenu();
                    setCurrentPath("stamping/src20");
                  }}
                  className={`lg:px-4 mx-2 transition-colors duration-300 no-underline hover:text-gray-600 text-white text-lg lg:text-base font-weight-900 ${
                    currentPath === "stamping/src20" ? "text-[#7A00F5]" : ""
                  }`}
                >
                  SRC-20
                </a>
              </div>
            </div>
            <div class="">
              <ConnectWallet toggleModal={toggleWalletModal} />
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
      </div>
    </nav>
  );
}
