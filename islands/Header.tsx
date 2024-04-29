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
      <div className="container px-4 mx-auto md:flex md:items-center md:justify-between">
        <div className="flex justify-between items-center">
          <a
            href="/block/last"
            f-partial={"/block/last"}
            className="font-bold text-xl text-indigo-600"
          >
            <img
              src="/img/stampchain.gif"
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
            className={`p-2 lg:px-4 md:mx-2 transition-colors duration-300 flex justify-center items-center no-underline rounded hover:text-gray-600 ${
              path === "home" ? "text-[#03A606]" : "text-white"
            }`}
          >
            Home
          </a>
          <a
            href="/stamp"
            f-partial={"/stamp"}
            onClick={toggleMenu}
            className={`p-2 lg:px-4 md:mx-2 transition-colors duration-300 flex justify-center items-center no-underline rounded hover:text-gray-600 ${
              path === "stamp" ? "text-[#03A606]" : "text-white"
            }`}
          >
            Stamps
          </a>
          <a
            href="/src20"
            f-partial={"/src20"}
            onClick={toggleMenu}
            className={`p-2 lg:px-4 md:mx-2 transition-colors duration-300 flex justify-center items-center no-underline rounded hover:text-gray-600 ${
              path === "src20" ? "text-[#03A606]" : "text-white"
            }`}
          >
            Src-20
          </a>
          <a
            href="/block/last"
            f-partial={"/block/last"}
            onClick={toggleMenu}
            className={`p-2 lg:px-4 md:mx-2 transition-colors duration-300 flex justify-center items-center no-underline rounded hover:text-gray-600 ${
              path === "block" ? "text-[#03A606]" : "text-white"
            }`}
          >
            Blocks
          </a>
          <a
            href="/collection"
            f-partial={"/collection"}
            onClick={toggleMenu}
            className={`p-2 lg:px-4 md:mx-2 transition-colors duration-300 flex justify-center items-center no-underline rounded hover:text-gray-600 ${
              path === "collection" ? "text-[#03A606]" : "text-white"
            }`}
          >
            Collections
          </a>
          <a
            href="/minting"
            f-partial={"/minting"}
            onClick={toggleMenu}
            className={`p-2 lg:px-4 md:mx-2 transition-colors duration-300 flex justify-center items-center no-underline rounded hover:text-gray-600 ${
              path === "minting" ? "text-[#03A606]" : "text-white"
            }`}
          >
            Minting
          </a>
          <div class="block md:hidden">
            <ConnectWallet />
          </div>
        </div>
        <div class="hidden md:block">
          <ConnectWallet />
        </div>
      </div>
    </nav>
  );
}
