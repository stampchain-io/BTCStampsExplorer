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
    <header className="px-3 sm:px-6 xl:px-12 my-[36px] md:my-[68px] max-w-[1440px] w-full mx-auto md:flex items-center justify-between">
      <div className="flex justify-between items-center">
        <a
          href="/home"
          f-partial={"/home"}
          onClick={() => setCurrentPath("home")}
          className={"bg-clip-text text-transparent bg-gradient-to-r from-[#440066] to-[#AA00FF] text-3xl md:text-4xl xl:text-5xl font-black italic pr-2"}
        >
          STAMPCHAIN
        </a>
        <button
          onClick={toggleMenu}
          className="text-blue-600 md:hidden z-[100]"
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
      <div className="hidden md:flex justify-between items-center gap-6 xl:gap-12 font-black text-[#8800CC]">
        <div className="group relative cursor-pointer">
          <a className="hover:text-[#AA00FF] text-lg xl:text-xl text-center">
            ART STAMPS
          </a>
          <div className="hidden group-hover:flex flex-col absolute top-0 left-0 z-[100] pt-[30px] pb-[15px] w-full">
            <a
              href="/stamp?type=classic"
              f-partial="/stamp?type=classic"
              onClick={() => {
                toggleMenu();
                setCurrentPath("stamp");
              }}
              className={`hover:text-[#AA00FF] ${
                currentPath === "stamp" ? "text-[#AA00FF]" : ""
              }`}
            >
              ALL
            </a>
            <a
              href="/collection"
              f-partial="/collection"
              onClick={() => {
                toggleMenu();
                setCurrentPath("collection");
              }}
              className={`hover:text-[#AA00FF] ${
                currentPath === "collection" ? "text-[#AA00FF]" : ""
              }`}
            >
              COLLECTIONS
            </a>
            <a
              href="/stamping/stamp"
              f-partial="/stamping/stamp"
              onClick={() => {
                toggleMenu();
                setCurrentPath("#");
              }}
              className={`hover:text-[#AA00FF] ${
                currentPath === "stamping/stamp" ? "text-[#AA00FF]" : ""
              }`}
            >
              STAMPING
            </a>
          </div>
        </div>

        <div className="group relative cursor-pointer">
          <a className="hover:text-[#AA00FF] text-lg xl:text-xl text-center">
            SRC-20 TOKENS
          </a>
          <div className="hidden group-hover:flex flex-col absolute top-0 left-0 z-[100] pt-[30px] pb-[15px] w-full">
            <a
              href="/src20"
              f-partial="/src20"
              onClick={() => {
                toggleMenu();
                setCurrentPath("src20");
              }}
              className={`hover:text-[#AA00FF] ${
                currentPath === "src20" ? "text-[#AA00FF]" : ""
              }`}
            >
              ALL
            </a>
            <a
              href="/stamping/src20/deploy"
              f-partial="/stamping/src20/deploy"
              onClick={() => {
                toggleMenu();
                setCurrentPath("src20");
              }}
              className={`hover:text-[#AA00FF] ${
                currentPath === "stamping/src20" ? "text-[#AA00FF]" : ""
              }`}
            >
              DEPLOY
            </a>
            <a
              href="/stamping/src20/mint"
              f-partial="/stamping/src20/mint"
              onClick={() => {
                toggleMenu();
                setCurrentPath("src20");
              }}
              className={`hover:text-[#AA00FF] ${
                currentPath === "stamping/src20" ? "text-[#AA00FF]" : ""
              }`}
            >
              MINT
            </a>
            <a
              href="/stamping/src20/transfer"
              f-partial="/stamping/src20/transfer"
              onClick={() => {
                toggleMenu();
                setCurrentPath("stamping/src20");
              }}
              className={`hover:text-[#AA00FF] ${
                currentPath === "stamping/src20" ? "text-[#AA00FF]" : ""
              }`}
            >
              TRANSFER
            </a>
          </div>
        </div>

        <ConnectWallet toggleModal={toggleWalletModal} />
      </div>

      {/* Mobile Navbar */}
      <div
        className={`duration-500 flex md:hidden flex-col justify-between fixed right-0 top-0 w-full h-screen z-20 bg-[#080808CC] scroll-none px-6 py-6 sm:py-9 pt-[120px] backdrop-blur-md font-black text-[#8800CC] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        id="navbar-collapse"
      >
        <a
          href="/home"
          f-partial="/home"
          onClick={() => {
            toggleMenu();
            setCurrentPath("collection");
          }}
          className="bg-clip-text text-transparent bg-gradient-to-r from-[#440066] to-[#AA00FF] text-3xl italic absolute top-9 left-3 sm:left-6 pr-2"
        >
          STAMPCHAIN
        </a>

        <div className="font-black text-center flex flex-col items-center justify-between gap-12">
          <div className="flex flex-col gap-[6px] text-lg">
            <a className="hover:text-[#AA00FF] cursor-pointer text-2xl text-[#660099]">
              ART STAMPS
            </a>
            <div className="flex flex-col text-center">
              <a
                href="/stamp?type=classic"
                f-partial="/stamp?type=classic"
                onClick={() => {
                  toggleMenu();
                  setCurrentPath("stamp");
                }}
                className={`hover:text-[#AA00FF] ${
                  currentPath === "stamp" ? "text-[#AA00FF]" : ""
                }`}
              >
                ALL
              </a>
              <a
                href="/collection"
                f-partial="/collection"
                onClick={() => {
                  toggleMenu();
                  setCurrentPath("collection");
                }}
                className={`hover:text-[#AA00FF] ${
                  currentPath === "collection" ? "text-[#AA00FF]" : ""
                }`}
              >
                COLLECTIONS
              </a>
              <a
                href="/stamping/stamp"
                f-partial="/stamping/stamp"
                onClick={() => {
                  toggleMenu();
                  setCurrentPath("#");
                }}
                className={`hover:text-[#AA00FF] ${
                  currentPath === "#" ? "text-[#AA00FF]" : ""
                }`}
              >
                STAMPING
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-[6px] text-lg">
            <a className="hover:text-[#AA00FF] cursor-pointer text-2xl text-[#660099]">
              SRC-20 TOKENS
            </a>
            <div className="flex flex-col text-center">
              <a
                href="/src20"
                f-partial="/src20"
                onClick={() => {
                  toggleMenu();
                  setCurrentPath("src20");
                }}
                className={`hover:text-[#AA00FF] ${
                  currentPath === "src20" ? "text-[#AA00FF]" : ""
                }`}
              >
                ALL
              </a>
              <a
                href="/stamping/src20/deploy"
                f-partial="/stamping/src20/deploy"
                onClick={() => {
                  toggleMenu();
                  setCurrentPath("stamping/src20");
                }}
                className={`hover:text-[#AA00FF] ${
                  currentPath === "stamping/src20" ? "text-[#AA00FF]" : ""
                }`}
              >
                DEPLOY
              </a>
              <a
                href="/stamping/src20/mint"
                f-partial="/stamping/src20/mint"
                onClick={() => {
                  toggleMenu();
                  setCurrentPath("stamping/src20");
                }}
                className={`hover:text-[#AA00FF] ${
                  currentPath === "stamping/src20" ? "text-[#AA00FF]" : ""
                }`}
              >
                MINT
              </a>
              <a
                href="/stamping/src20/transfer"
                f-partial="/stamping/src20/transfer"
                onClick={() => {
                  toggleMenu();
                  setCurrentPath("stamping/src20");
                }}
                className={`hover:text-[#AA00FF] ${
                  currentPath === "stamping/src20" ? "text-[#AA00FF]" : ""
                }`}
              >
                TRANSFER
              </a>
            </div>
          </div>

          <ConnectWallet toggleModal={toggleWalletModal} />
        </div>

        <div class="gap-6 items-center justify-center flex">
          <a href="#">
            <img src="/img/footer/EnvelopeSimple.png" class="w-12" />
          </a>
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
    </header>
  );
}
