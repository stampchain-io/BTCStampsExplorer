import { StampFilters } from "$islands/filterpane/StampFilterPaneDrawer.tsx";

const StampSearchDrawer = ({ open, setOpen }) => {
  return (
    <>
      <div id="drawer-form" class={`fixed top-0 left-0 z-40 h-screen p-4 bg-stamp-bg-purple-dark overflow-y-auto transition-transform w-80 ${open ? "translate-x-0" : "-translate-x-full"
        }`} tabindex="-1" aria-labelledby="drawer-form-label">
        <p id="drawer-label" class="inline-flex items-center mb-6 text-xl font-semibold text-gray-500 uppercase">
          Stamp Search
        </p>
        <button onClick={() => setOpen(false)} class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 absolute top-2.5 end-2.5 inline-flex items-center justify-center dark:hover:bg-gray-600 dark:hover:text-white" >
          <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
          </svg>
          <span class="sr-only">Close menu</span>
        </button>
        <div class="mb-6">
          <StampFilters />
        </div>
      </div>
    </>
  );
}

export default StampSearchDrawer;