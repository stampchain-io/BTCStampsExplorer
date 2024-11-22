import { ModalLayout } from "$components/shared/modal/ModalLayout.tsx";
import { FeeEstimation } from "$islands/stamping/FeeEstimation.tsx";

export default function DonateModal(
  {
    fee,
    formState,
    handleFileChange,
    handleFileUpload,
    handleCloseModal,
    handleChangeFee,
    handleDonate,
    handleOpen,
  }: {
    fee: number;
    formState: any;
    handleFileChange: (e: Event) => void;
    handleFileUpload: (file: File) => void;
    handleCloseModal: () => void;
    handleChangeFee: (newFee: number) => void;
    handleDonate: () => void;
    handleOpen: () => void;
  },
) {
  return (
    <>
      <ModalLayout onClose={handleCloseModal} title="DONATE">
        <div className="w-full justify-center items-center">
          <p className="text-stamp-grey text-4xl text-center font-work-sans">
            <span className="text-stamp-grey-light">
              0.00069420
            </span>{" "}
            BTC
          </p>
        </div>
        <div className="flex justify-between gap-2">
          <div
            id="image-preview"
            class="relative rounded-[3px] items-center text-center cursor-pointer min-w-[108px] tablet:min-w-[120px] h-[108px] tablet:h-[120px] content-center bg-[#660099]"
          >
            <input
              id="upload"
              type="file"
              class="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
            {formState.file !== null && (
              <img
                width={324}
                style={{
                  height: "100%",
                  objectFit: "contain",
                  imageRendering: "pixelated",
                  backgroundColor: "rgb(0,0,0)",
                  borderRadius: "6px",
                }}
                src={URL.createObjectURL(formState.file)}
              />
            )}
            {formState.file === null && (
              <label
                for="upload"
                class="cursor-pointer h-full flex flex-col items-center justify-center gap-3"
              >
                <img
                  src="/img/stamping/image-upload.svg"
                  class="w-12 h-12"
                  alt=""
                />
              </label>
            )}
          </div>
          <div className="w-full flex flex-col justify-center items-center">
            <div>
              <p className="text-stamp-grey text-lg text-center font-work-sans">
                RECEIVE &nbsp;&nbsp;<span className="text-stamp-grey-light">
                  1 EDITION
                </span>
              </p>
            </div>
            <div class="relative mb-6 w-11/12">
              <div className="w-full flex justify-between">
                <span class="text-sm text-gray-500 dark:text-gray-400 ">
                  1
                </span>
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  2
                </span>
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  3
                </span>
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  4
                </span>
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  5
                </span>
                <span class="text-sm text-gray-500 dark:text-gray-400 ">
                  6
                </span>
              </div>
              <input
                id="labels-range-input"
                type="range"
                value="3"
                min="1"
                max="6"
                step="1"
                class="accent-[#5E1BA1] w-full h-[6px] rounded-lg appearance-none cursor-pointer bg-stamp-grey"
              />
            </div>
          </div>
        </div>

        <FeeEstimation
          fee={fee}
          handleChangeFee={handleChangeFee}
          amount={0.005}
          type="donate"
          BTCPrice={0.005487}
          isSubmitting={false}
          onSubmit={handleDonate}
          onCancel={handleCloseModal}
          buttonName="DONATE"
          className="pt-4"
          userAddress={"bc1qe5sz3mt4a3e57n8e39pprval4qe0xdrkzew203"}
          inputType="P2WPKH"
          outputTypes={["P2WPKH"]}
        />
      </ModalLayout>
    </>
  );
}
