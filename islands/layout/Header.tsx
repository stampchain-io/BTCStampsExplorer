import { useEffect, useState } from "preact/hooks";
import { ConnectWallet } from "$islands/Wallet/ConnectWallet.tsx";

interface NavLink {
  title: string;
  href: string;
  subLinks?: NavLink[];
}

const navLinks: NavLink[] = [
  {
    title: "ART STAMPS",
    href: "#",
    subLinks: [
      { title: "ALL", href: "/stamp?type=classic" },
      { title: "COLLECTIONS", href: "/collection" },
      { title: "STAMPING", href: "/stamping/stamp" },
    ],
  },
  {
    title: "SRC-20 TOKENS",
    href: "#",
    subLinks: [
      { title: "ALL", href: "/src20" },
      { title: "TRENDING", href: "/src20?type=trending" },
      { title: "DEPLOY", href: "/stamping/src20/deploy" },
      { title: "MINT", href: "/stamping/src20/mint" },
      { title: "TRANSFER", href: "/stamping/src20/transfer" },
    ],
  },
  {
    title: "STAMPCHAIN",
    href: "#",
    subLinks: [
      { title: "ABOUT", href: "/about" },
      { title: "DONATE", href: "#" },
      { title: "CONTACT", href: "#" },
    ],
  },
];

const socialLinks = [
  { href: "https://x.com/Stampchain", icon: "/img/footer/XLogo.svg" },
  { href: "https://discord.gg/PCZU6xrt", icon: "/img/footer/DiscordLogo.svg" },
  { href: "https://t.me/BitcoinStamps", icon: "/img/footer/TelegramLogo.svg" },
  {
    href: "https://github.com/stampchain-io/",
    icon: "/img/footer/GithubLogo.svg",
  },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  useEffect(() => {
    // Set initial path
    setCurrentPath(globalThis?.location?.pathname || null);

    // Update path on route change
    const handleRouteChange = () => {
      setCurrentPath(globalThis?.location?.pathname || null);
    };

    // Listen for route changes
    globalThis.addEventListener("popstate", handleRouteChange);

    return () => {
      globalThis.removeEventListener("popstate", handleRouteChange);
    };
  }, []);

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

  const toggleWalletModal = () => setIsWalletModalOpen(!isWalletModalOpen);

  const toggleMenu = () => {
    const isMobileScreen = globalThis.matchMedia("(max-width: 1024px)").matches;
    if (!isMobileScreen) return;
    setOpen(!open);
    document.body.style.overflow = !open ? "hidden" : "";
  };

  const renderNavLinks = (isMobile = false) => {
    const filteredNavLinks = isMobile ? navLinks : navLinks.slice(0, 2);
    return (
      <>
        {filteredNavLinks.map((link) => (
          <div
            key={link.title}
            className={`group relative cursor-pointer text-nowrap ${
              isMobile ? "flex flex-col gap-[6px] text-lg" : ""
            }`}
          >
            <a
              className={`whitespace-nowrap hover:text-[#AA00FF] ${
                isMobile
                  ? "text-2xl text-[#660099]"
                  : "text-lg xl:text-xl text-center"
              }`}
            >
              {link.title}
            </a>
            <div
              className={`${
                isMobile
                  ? "flex flex-col text-center"
                  : "hidden group-hover:flex flex-col absolute top-0 left-0 z-[100] pt-[30px] pb-[15px] w-full"
              }`}
            >
              {link.subLinks?.map((subLink) => (
                <a
                  key={subLink.href}
                  href={subLink.href}
                  f-partial={subLink.href}
                  onClick={() => {
                    toggleMenu();
                    setCurrentPath(subLink.href);
                  }}
                  className={`hover:text-[#AA00FF] text-lg md:text-base sm:text-base ${
                    currentPath === subLink.href ? "text-[#AA00FF]" : ""
                  }`}
                >
                  {subLink.title}
                </a>
              ))}
            </div>
          </div>
        ))}
      </>
    );
  };

  return (
    <header className="px-3 sm:px-6 xl:px-12 my-[18px] sm:my-[36px] md:my-[68px] max-w-[1440px] w-full mx-auto md:flex justify-between items-center">
      <div className="w-full flex justify-between items-center">
        <a
          href="/home"
          f-partial="/home"
          onClick={() => setCurrentPath("home")}
          className="purple-gradient2 text-3xl md:text-4xl xl:text-5xl font-black italic pr-2"
        >
          STAMPCHAIN
        </a>
        <button
          onClick={toggleMenu}
          className="text-blue-600 lg:hidden block z-[100]"
          id="navbar-toggle"
        >
          {open && (
            <img
              src="/img/header/menu-close.svg"
              alt="menu"
              className="w-5 h-5"
            />
          )}
          {!open && (
            <img
              src="/img/header/menu-open.svg"
              alt="menu"
              className="w-5 h-4"
            />
          )}
        </button>
      </div>

      {/* Desktop Navbar */}
      <div className="hidden lg:flex justify-between items-center gap-6 xl:gap-12 font-black text-[#8800CC]">
        {renderNavLinks()}
        <ConnectWallet toggleModal={toggleWalletModal} />
      </div>

      {/* Mobile Navbar */}
      <div
        className={`duration-500 flex lg:hidden flex-col justify-between fixed right-0 top-0 w-full h-screen z-20 bg-[#080808CC] scroll-none px-6 pb-6 pt-[77px] sm:pt-[102px] backdrop-blur-md font-black text-[#8800CC] ${
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
          className="lg:block hidden bg-clip-text text-transparent bg-gradient-to-r from-[#440066] to-[#AA00FF] text-3xl italic absolute top-9 left-3 sm:left-6 pr-2"
        >
          STAMPCHAIN
        </a>

        <div className="font-black text-center flex flex-col items-center justify-between gap-6">
          {renderNavLinks(true)}
          <ConnectWallet toggleModal={toggleWalletModal} />
        </div>

        <div className="flex justify-center items-center">
          {socialLinks.map((link, index) => (
            <a key={link.href} href={link.href} target="_blank">
              <img
                src={link.icon}
                className={`w-12 ${
                  index === 0
                    ? "mr-[13px]"
                    : index === 1
                    ? "mr-[17px]"
                    : index === 2
                    ? "mr-[21px]"
                    : ""
                }`}
                alt=""
              />
            </a>
          ))}
        </div>
      </div>
    </header>
  );
}
