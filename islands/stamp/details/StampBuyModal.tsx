import { useState } from "preact/hooks";
import { StampRow } from "globals";
import { useFeePolling } from "hooks/useFeePolling.tsx";
import StampImage from "./StampImage.tsx";

interface Props {
  stamp: StampRow;
  fee: number;
  handleChangeFee: (fee: number) => void;
  toggleModal: () => void;
  handleCloseModal: () => void;
}

const StampBuyModal = (
  { stamp, fee, handleChangeFee, toggleModal, handleCloseModal }: Props,
) => {
  const { fees, loading } = useFeePolling();
  const [isLocked, setIsLocked] = useState(true);

  return (
    <div
      class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-[#181818] bg-opacity-50 backdrop-filter backdrop-blur-sm"
      onClick={handleCloseModal}
    >
      <div class="relative p-4 w-full max-w-[360px] h-auto">
        <div class="relative bg-white rounded-lg shadow dark:bg-[#0B0B0B] overflow-hidden">
          <div class="flex flex-col gap-4 items-center justify-between p-4 md:p-5 rounded-t">
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
            <StampImage stamp={stamp} className="w-[200px] !p-2" flag={false} />
            <p
              className={"bg-clip-text text-transparent bg-gradient-to-r from-[#AA00FF] via-[#660099] to-[#440066] text-2xl font-black text-center"}
            >
              BUY STAMP #{stamp.stamp}
            </p>
            <div className={"flex justify-between items-center w-full"}>
              <p className={"text-[#999999] flex flex-col"}>
                QUANTITY
                <span className={"text-[#666666]"}>max 21</span>
              </p>

              <p
                className={"bg-[#999999] text-[#666666] font-bold text-xl rounded-md p-3"}
              >
                99
              </p>
            </div>
            <div className={"flex flex-col w-full"}>
              <span class="flex justify-between w-full text-[#F5F5F5]">
                FEE: {fee} sat/vB
              </span>
              <div class="relative w-full">
                <label for="labels-range-input" class="sr-only">
                  Labels range
                </label>
                <input
                  id="labels-range-input"
                  type="range"
                  value={fee}
                  min="1"
                  max="264"
                  step="1"
                  onInput={(e) =>
                    handleChangeFee(
                      parseInt((e.target as HTMLInputElement).value, 10),
                    )}
                  class="accent-[#5E1BA1] w-full h-[6px] rounded-lg appearance-none cursor-pointer bg-[#3F2A4E]"
                />
              </div>
              <span class="justify-end flex w-full text-[#F5F5F5] text-sm">
                RECOMMENDED: {fees && fees.recommendedFee} sat/vB
              </span>
            </div>

            <div className={"flex flex-col items-end w-full text-[#999999]"}>
              <p
                className={"font-medium text-base flex justify-between w-full"}
              >
                ESTIMATE<span className={"font-bold"}>0.000235 BTC</span>
              </p>
              <span className={"text-xs font-medium text-[#666666]"}>
                21.45 USD
              </span>
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="checkbox"
                id="lockEditions"
                name="lockEditions"
                checked={isLocked}
                onChange={(e) => setIsLocked(e.target.checked)}
                className="w-5 h-5 bg-[#262424] border border-[#7F7979]"
              />
              <label
                htmlFor="lockEditions"
                className="text-[#999999] text-[12px] font-medium"
              >
                I agree to the{" "}
                <span className={"text-[#8800CC]"}>terms and conditions</span>
              </label>
            </div>
            <div className={"flex gap-6"}>
              <button
                className={"border-2 border-[#8800CC] text-[#8800CC] min-w-[114px] h-[48px] rounded-md font-extrabold"}
              >
                CANCEL
              </button>
              <button
                className={"bg-[#8800CC] text-[#330033] min-w-[114px] h-[48px] rounded-md font-extrabold"}
              >
                BUY
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StampBuyModal;
