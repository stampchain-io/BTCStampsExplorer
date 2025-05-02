import { useEffect, useState } from "preact/hooks";
import { ConnectWallet } from "$islands/Wallet/ConnectWallet.tsx";
import {
  desktopNavLinks,
  mobileNavLinks,
  socialLinks,
} from "$islands/datacontrol/Layout.ts";
import { HeaderStyles } from "./styles.ts";

export function Header() {
  const [open, setOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [expandedMobileMenus, setExpandedMobileMenus] = useState<string[]>([]);

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
        closeMenu();
      }
    };

    const handleResize = () => {
      if (open && window.innerWidth >= 1024) { // tablet breakpoint is 1024px
        closeMenu();
      }
    };

    globalThis.addEventListener("orientationchange", handleOrientationChange);
    globalThis.addEventListener("resize", handleResize);
    
    return () => {
      globalThis.removeEventListener("orientationchange", handleOrientationChange);
      globalThis.removeEventListener("resize", handleResize);
    };
  }, [open]);

  const toggleMenu = () => {
    if (open) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  const openMenu = () => {
    setOpen(true);
    // When opening menu - disable body scroll
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.height = "100%";
  };

  const closeMenu = () => {
    setOpen(false);
    // When closing menu - enable body scroll
    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.width = "";
    document.body.style.height = "";
    // Reset expanded submenus
    setExpandedMobileMenus([]);
  };

  const toggleMobileSubmenu = (title: string) => {
    setExpandedMobileMenus(prev => {
      if (prev.includes(title)) {
        return prev.filter(item => item !== title);
      } else {
        return [...prev, title];
      }
    });
  };

  const isMobileSubmenuExpanded = (title: string) => {
    return expandedMobileMenus.includes(title);
  };

  const renderNavLinks = (isMobile = false) => {
    const filteredNavLinks = isMobile ? mobileNavLinks : desktopNavLinks;
    return (
      <>
        {filteredNavLinks.map((link) => {
          const linkTitle = typeof link.title === "string" ? link.title : link.title.default;
          const isSubMenuExpanded = isMobile && isMobileSubmenuExpanded(linkTitle);
          
          return (
            <div
              key={linkTitle}
              className={`group relative cursor-pointer ${
                isMobile ? "flex flex-col gap-[6px] text-lg w-full" : "text-nowrap"
              }`}
            >
              {/* Main Link */}
              {isMobile && link.subLinks ? (
                <div 
                  className="flex items-center justify-center w-full"
                  onClick={() => toggleMobileSubmenu(linkTitle)}
                >
                  <span 
                    className={`text-xl mobileLg:text-2xl ${
                      isSubMenuExpanded 
                        ? "text-stamp-purple-bright" 
                        : "text-stamp-purple-dark"
                    }`}
                  >
                    {linkTitle}
                  </span>
                  <span className="ml-2 transition-transform duration-300" style={{
                    transform: isSubMenuExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}>▼</span>
                </div>
              ) : (
                <a
                  href={link.subLinks ? undefined : link.href}
                  onClick={() => {
                    if (isMobile && !link.subLinks && link?.href) {
                      closeMenu();
                      setCurrentPath(link.href);
                    }
                  }}
                  className={`inline-block ${isMobile ? "w-full text-center" : "whitespace-nowrap"} ${
                    isMobile
                      ? `text-xl mobileLg:text-2xl ${
                        link.subLinks
                          ? "text-stamp-purple-dark"
                          : "text-stamp-purple hover:text-stamp-purple-bright"
                      }`
                      : "text-lg text-center group-hover:text-stamp-purple-bright"
                  }`}
                >
                  <span className="hidden tablet:inline min-[1180px]:hidden">
                    {typeof link.title === "string"
                      ? link.title
                      : link.title.tablet}
                  </span>
                  <span className="tablet:hidden min-[1180px]:inline">
                    {typeof link.title === "string"
                      ? link.title
                      : link.title.default}
                  </span>
                </a>
              )}

              {/* Sublinks */}
              {link.subLinks && (
                <div
                  className={`${
                    isMobile
                      ? isSubMenuExpanded 
                        ? "flex flex-col z-10 w-full gap-2 mt-2 pb-2"
                        : "hidden"
                      : "hidden group-hover:flex flex-col absolute top-[100%] left-1/2 -translate-x-1/2 min-w-[calc(100%+24px)] min-[1180px]:min-w-[calc(100%+36px)] z-10 pt-[3px] pb-[15px] px-3 min-[1180px]:px-[18px] space-y-[3px] whitespace-nowrap backdrop-blur-md bg-gradient-to-b from-transparent to-[#000000]/30 rounded-b-lg"
                  }`}
                >
                  {link.subLinks?.map((subLink) => (
                    <a
                      key={subLink.href}
                      href={subLink.href}
                      onClick={() => {
                        closeMenu();
                        setCurrentPath(subLink?.href ? subLink?.href : null);
                      }}
                      className={`hover:text-stamp-purple-bright text-base ${isMobile ? "py-1" : ""} ${
                        isMobile ? "text-stamp-purple" : "text-center"
                      } ${
                        currentPath === subLink.href
                          ? "text-stamp-purple-bright"
                          : ""
                      }`}
                    >
                      {subLink.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </>
    );
  };

  return (
    <header className="tablet:flex justify-between items-center max-w-desktop w-full mx-auto px-3 mobileMd:px-6 desktop:px-12 my-[18px] mobileMd:my-6 mobileLg:my-9 tablet:my-12">
      <div className="flex justify-between items-center w-full">
        <a
          href="/home"
          f-partial="/home"
          onClick={() => setCurrentPath("home")}
          className={HeaderStyles.headerLogo}
        >
          STAMPCHAIN
        </a>
        <button
          onClick={toggleMenu}
          className="tablet:hidden block relative z-40"
          id="navbar-toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open && (
            <img
              src="/img/header/menu-close.svg"
              alt="Close menu"
              className="w-5 h-5 mobileLg:w-6 mobileLg:h-6 mr-1.5"
            />
          )}
          {!open && (
            <img
              src="/img/header/menu-open.svg"
              alt="Open menu"
              className="w-5 h-5 mobileLg:w-6 mobileLg:h-6"
            />
          )}
        </button>
      </div>

      {/* Tablet/Desktop Navbar */}
      <div className="hidden tablet:flex justify-between items-center gap-9 font-black text-stamp-purple">
        {renderNavLinks()}
        <ConnectWallet />
      </div>

      {/* Mobile Navbar */}
      <div
        className={`flex tablet:hidden flex-col justify-between fixed left-0 top-0 w-full h-screen z-30 backdrop-blur-md bg-gradient-to-b from-[#000000]/70 to-[#000000]/90 overflow-y-auto px-6 pb-[18px] mobileLg:pb-[49px] pt-[89px] mobileLg:pt-[126px] font-black text-stamp-purple duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        id="navbar-collapse"
        aria-hidden={!open}
      >
        <div className="flex flex-col items-center justify-between font-black text-center gap-4">
          {renderNavLinks(true)}
          <div className="mt-4">
            <ConnectWallet />
          </div>
        </div>

        <div className="flex justify-center items-center mt-8">
          {socialLinks.map((link, index) => (
            <a 
              key={link.href} 
              href={link.href} 
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Visit our ${link.href.split('.com/')[1]}`}
            >
              <img
                src={link.icon}
                className={`w-[31px] h-[31px] mobileLg:w-[46px] mobileLg:h-[46px] ${
                  index === 0
                    ? "mr-[12px] mobileLg:mr-[13px]"
                    : index === 1
                    ? "mr-[13px] mobileLg:mr-[17px]"
                    : index === 2
                    ? "mr-[17px] mobileLg:mr-[21px]"
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
