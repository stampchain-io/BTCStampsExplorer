import { useEffect, useState } from "preact/hooks";
import { ConnectWallet } from "$islands/Wallet/ConnectWallet.tsx";

export function Header() {
  const [open, setOpen] = useState(false);

  let path: string | null = null;
  if (typeof window !== undefined) {
    path = (window?.location?.pathname)?.split("/")[1];
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
  const activeClass = "text-gray-600 rounded hover:text-white md:underline"; //"rounded text-blue-600 md:underline hover:text-white"
  const inactiveClass = "text-gray-600 rounded hover:text-white md:underline";

  return (
    <nav class="border rounded-lg py-2 mb-6 md:py-4 ">
      <div class="container px-4 mx-auto md:flex md:items-center">
        <div class="flex justify-between items-center">
          <a
            href="/block/last"
            f-partial={"/block/last"}
            class="font-bold text-xl text-indigo-600"
          >
            BITCOIN STAMPS
          </a>
          <button
            onClick={toggleMenu}
            class="border border-solid border-blue-600 px-3 py-1 rounded text-blue-600 opacity-50 hover:opacity-75 md:hidden"
            id="navbar-toggle"
          >
            <img src="/icons/menu.svg" alt="menu" class="w-6 h-6" />
          </button>
        </div>

        <div
          class={`${
            open
              ? "flex items-center gap-10 absolute right-0 top-[103px] w-full h-full z-20 bg-black scroll-none p-6"
              : "hidden"
          } flex-col md:flex md:flex-row md:ml-auto mt-8 md:mt-0 text-center`}
          id="navbar-collapse"
        >
          <a
            href="/block/last"
            f-partial={"/block/last"}
            onClick={toggleMenu}
            class={`p-2 lg:px-4 md:mx-2 hover:text-gray-700 transition-colors duration-300 ${
              path === "block" ? activeClass : inactiveClass
            }`}
          >
            BLOCKS
          </a>
          <a
            href="/stamp"
            f-partial={"/stamp"}
            onClick={toggleMenu}
            class={`p-2 lg:px-4 md:mx-2  hover:text-gray-700 transition-colors duration-300 ${
              path === "stamp" ? activeClass : inactiveClass
            }`}
          >
            STAMPS
          </a>
          <a
            href="/src20"
            f-partial={"/src20"}
            onClick={toggleMenu}
            class={`p-2 lg:px-4 md:mx-2  hover:text-gray-700 transition-colors duration-300 ${
              path === "src20" ? activeClass : inactiveClass
            }`}
          >
            SRC20
          </a>
          {
            /* <a
            href="/cursed"
            f-partial={"/cursed"}
            onClick={toggleMenu}
            class={`p-2 lg:px-4 md:mx-2  hover:text-gray-700 transition-colors duration-300 ${
              path === "cursed" ? activeClass : inactiveClass
            }`}
          >
            Cursed
          </a> */
          }
          <div class="w-full flex items-center">
            <ConnectWallet />
          </div>
        </div>
      </div>
    </nav>
  );
}
