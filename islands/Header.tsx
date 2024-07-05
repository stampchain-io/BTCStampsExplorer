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
              src="/img/logo.png"
              alt="stampchain"
              className="w-[178px] h-auto"
            />
          </a>
          <button
            onClick={toggleMenu}
            className="px-3 py-1 text-blue-600 opacity-50 hover:opacity-75 md:hidden z-[100]"
            id="navbar-toggle"
          >
            {open && (
              <img
                src="/img/menu-close.png"
                alt="menu"
                className="w-6 h-6"
              />
            )}
            {!open && (
              <img src="/img/menu-open.png" alt="menu" className="w-6 h-6" />
            )}
          </button>

          <div class="block md:hidden">
            <ConnectWallet />
          </div>
        </div>

        <div
          className={`${
            open
              ? "flex items-center justify-center gap-5 md:gap-10 right-0 top-0 fixed w-full h-screen z-20 bg-[#181818] scroll-none p-6"
              : "hidden"
          } flex-col md:flex md:flex-row text-center`}
          id="navbar-collapse"
        >
          <a
            href="/home"
            f-partial={"/home"}
            onClick={toggleMenu}
            className={`p-2 lg:px-4 md:mx-2 transition-colors duration-300 flex justify-center items-center no-underline hover:text-gray-600 text-white text-3xl md:text-base ${
              path === "home" ? "border-[#7A00F5] border-b-4" : ""
            }`}
          >
            Home
          </a>
          <a
            href="/stamp"
            f-partial={"/stamp"}
            onClick={toggleMenu}
            className={`p-2 lg:px-4 md:mx-2 transition-colors duration-300 flex justify-center items-center no-underline hover:text-gray-600 text-white text-3xl md:text-base ${
              path === "stamp" ? "border-[#7A00F5] border-b-4" : ""
            }`}
          >
            Stamps
          </a>
          <a
            href="/src20"
            f-partial={"/src20"}
            onClick={toggleMenu}
            className={`p-2 lg:px-4 md:mx-2 transition-colors duration-300 flex justify-center items-center no-underline hover:text-gray-600 text-white text-3xl md:text-base ${
              path === "src20" ? "border-[#7A00F5] border-b-4" : ""
            }`}
          >
            Src-20
          </a>
          <a
            href="/block/last"
            f-partial={"/block/last"}
            onClick={toggleMenu}
            className={`p-2 lg:px-4 md:mx-2 transition-colors duration-300 flex justify-center items-center no-underline hover:text-gray-600 text-white text-3xl md:text-base ${
              path === "block" ? "border-[#7A00F5] border-b-4" : ""
            }`}
          >
            Blocks
          </a>
          <a
            href="/collection"
            f-partial={"/collection"}
            onClick={toggleMenu}
            className={`p-2 lg:px-4 md:mx-2 transition-colors duration-300 flex justify-center items-center no-underline hover:text-gray-600 text-white text-3xl md:text-base ${
              path === "collection" ? "border-[#7A00F5] border-b-4" : ""
            }`}
          >
            Collections
          </a>
          <a
            href="/mint"
            f-partial={"/mint"}
            onClick={toggleMenu}
            className={`p-2 lg:px-4 md:mx-2 transition-colors duration-300 flex justify-center items-center no-underline hover:text-gray-600 text-white text-3xl md:text-base ${
              path === "mint" ? "border-[#7A00F5] border-b-4" : ""
            }`}
          >
            Minting
          </a>
          {
            /* <a
            href="/upload"
            f-partial={"/upload"}
            onClick={toggleMenu}
            className={`p-2 lg:px-4 md:mx-2 transition-colors duration-300 flex justify-center items-center no-underline hover:text-gray-600 text-white text-3xl md:text-base ${
              path === "upload" ? "border-[#7A00F5] border-b-4" : ""
            }`}
          >
            Upload Image
          </a> */
          }
        </div>
        <div class="hidden md:block">
          <ConnectWallet />
        </div>
      </div>
    </nav>
  );
}
