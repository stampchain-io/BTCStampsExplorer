import { ComponentChildren } from "preact";

interface Props {
  connectors: ComponentChildren[];
  toggleModal: Function;
  handleCloseModal: Function;
}

export const ConnectorsModal = (
  { connectors, toggleModal, handleCloseModal }: Props,
) => {
  console.log("Rendering ConnectorsModal with connectors:", connectors);

  return (
    <div
      class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-[#181818] bg-opacity-50 backdrop-filter backdrop-blur-sm"
      onClick={handleCloseModal}
    >
      <div class="relative p-4 w-full max-w-2xl h-auto">
        <div class="relative bg-white rounded-lg shadow dark:bg-[#0B0B0B] overflow-hidden">
          <div class="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-[#8800CC]">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
              Connect your wallet
            </h3>
            <button
              onClick={toggleModal}
              type="button"
              class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
              data-modal-hide="default-modal"
            >
              <svg
                class="w-3 h-3"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 14"
              >
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                />
              </svg>
              <span class="sr-only">Close modal</span>
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center p-4 md:p-5 border-t border-gray-200 rounded-b dark:border-[#8800CC]">
            {connectors.map((renderConnector, index) => {
              if (typeof renderConnector === "function") {
                console.log(`Rendering connector at index ${index}`);
                return renderConnector({ key: index, toggleModal });
              }
              return null;
            })}
          </div>
          {
            /* <div
            className={"bg-gradient-to-r from-[#8800CC] via-[#660099] to-transparent w-[800px] h-[700px] absolute top-[40px] left-[-70px] opacity-30 rounded-full rotate-[90deg]"}
          >
          </div> */
          }
        </div>
      </div>
    </div>
  );
};
