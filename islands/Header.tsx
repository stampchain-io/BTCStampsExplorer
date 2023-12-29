import { useState } from "preact/hooks";
import { ConnectWallet } from "$islands/Wallet/ConnectWallet.tsx";


export function Header() {
  const [open, setOpen] = useState(false);

  let path: string | null = null;
  if (typeof window !== undefined) {
    path = (window?.location?.pathname)?.split("/")[1];
  }
  const toggleMenu = () => {
    setOpen(!open);
  };
  const activeClass = "text-gray-600 rounded hover:text-white md:underline"//"rounded text-blue-600 md:underline hover:text-white"
  const inactiveClass = "text-gray-600 rounded hover:text-white md:underline"

  return (
    <nav class="border rounded-lg py-2 mb-6 md:py-4 ">
      <div class="container px-4 mx-auto md:flex md:items-center">
        <div class="flex justify-between items-center">
          <a href="/block/last" f-partial={'/block/last'}
            class="font-bold text-xl text-indigo-600">
            Bitcoin Stamps
          </a>
          <button onClick={toggleMenu}
            class="border border-solid border-blue-600 px-3 py-1 rounded text-blue-600 opacity-50 hover:opacity-75 md:hidden" id="navbar-toggle">
            <img src="/icons/menu.svg" alt="menu" class="w-6 h-6" />
          </button>
        </div>

        <div class={`${open ? "flex" : "hidden"} flex-col md:flex md:flex-row md:ml-auto mt-3 md:mt-0 text-center`} id="navbar-collapse">
          <a href="/block/last" f-partial={'/block/last'}
            class={`p-2 lg:px-4 md:mx-2 hover:text-gray-700 transition-colors duration-300 ${path === "block" ? activeClass : inactiveClass}`}
          >Blocks</a>
          <a href="/stamp" f-partial={'/stamp'}
            class={`p-2 lg:px-4 md:mx-2  hover:text-gray-700 transition-colors duration-300 ${path === "stamp" ? activeClass : inactiveClass}`}
          >Stamps</a>
          <a href="/cursed" f-partial={'/cursed'}
            class={`p-2 lg:px-4 md:mx-2  hover:text-gray-700 transition-colors duration-300 ${path === "cursed" ? activeClass : inactiveClass}`}
          >Cursed</a>
          <ConnectWallet />
        </div>
      </div>
    </nav>
  )
}