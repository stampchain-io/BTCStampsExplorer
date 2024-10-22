import { useState } from "preact/hooks";

import { SRC20Row } from "globals";

import SRC20MintingItem from "$islands/src20/minting/SRC20MintingItem.tsx";

type SRC20BalanceTableProps = {
  data: SRC20Row[];
};

const ImageModal = (
  { imgSrc, isOpen, onClose }: {
    imgSrc: string | null;
    isOpen: boolean;
    onClose: () => void;
  },
) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      class="fixed z-20 inset-0 bg-black bg-opacity-50 flex justify-center items-center"
    >
      <div onClick={(e) => e.stopPropagation()}>
        {imgSrc && <img class="w-60 h-60" src={imgSrc} alt="Modal" />}
      </div>
    </div>
  );
};

export const SRC20MintingTable = (props: SRC20BalanceTableProps) => {
  const { data } = props;
  console.log("SRC20MintingTable received data:", data);

  const [modalImg, setModalImg] = useState<string | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleImageInteraction = (imgSrc: string) => {
    setModalImg(imgSrc);
    setModalOpen(!isModalOpen);
  };

  // Define the desired trxType, e.g., 'olga' or 'multisig'
  const trxType = "olga"; // or use a state/context variable if dynamic

  return (
    <>
      <ImageModal
        imgSrc={modalImg}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
      <div class="relative overflow-x-auto shadow-md">
        <div class="flex flex-col gap-3 md:gap-6">
          {data.map((src20: SRC20Row) => {
            const href = `/src20/${convertToEmoji(src20.tick)}`;

            const progress = src20.progress || "0";
            const progressWidth = `${progress}%`;

            // No need to check for showMintButton since all tokens are not fully minted

            return (
              <div class="dark-gradient text-sm flex justify-between items-center rounded-md">
                <div class="p-3 uppercase cursor-pointer flex gap-6">
                  <img
                    src={`/content/${src20.tx_hash}.svg`}
                    class="w-[65px] h-[65px]"
                    onClick={() =>
                      handleImageInteraction(`/content/${src20.tx_hash}.svg`)}
                  />
                  <div className="flex flex-col justify-between">
                    <a
                      href={href}
                      className="text-2xl text-[#666666] font-bold flex gap-4"
                    >
                      {convertToEmoji(src20.tick)}
                      <div className="flex gap-2">
                        <img
                          width="20px"
                          src="/img/src20/details/EnvelopeSimple.svg"
                        />
                        <img
                          width="20px"
                          src="/img/src20/details/Globe.svg"
                        />
                        <img
                          width="20px"
                          src="/img/src20/details/TelegramLogo.svg"
                        />
                        <img
                          width="20px"
                          src="/img/src20/details/XLogo.svg"
                        />
                      </div>
                    </a>
                    <div className="flex flex-col gap-1">
                      <p className="text-lg font-light text-[#999999]">
                        PROGRESS <span className="font-bold">{progress}%</span>
                      </p>
                      <div className="min-w-[260px] h-1 bg-[#999999] relative rounded-full">
                        <div
                          className="absolute left-0 top-0 h-1 bg-[#660099] rounded-full"
                          style={{ width: progressWidth }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div class="p-3 text-center flex flex-col justify-center">
                  <p className="text-lg text-[#666666] font-light">
                    SUPPLY{" "}
                    <span className="font-bold text-[#999999]">
                      {Number(src20.max).toLocaleString()}
                    </span>
                  </p>
                  <p className="text-lg text-[#666666] font-light">
                    LIMIT{" "}
                    <span className="font-bold text-[#999999]">
                      {Number(src20.lim).toLocaleString()}
                    </span>
                  </p>
                </div>
                <div class="p-3 text-sm text-center flex flex-col justify-center">
                  <p className="text-lg text-[#666666] font-light">
                    DEPLOY{" "}
                    <span className="font-bold text-[#999999]">
                      {new Date(src20.block_time).toLocaleString("default", {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </p>
                  <p className="text-lg text-[#666666] font-light">
                    HOLDERS{" "}
                    <span className="font-bold text-[#999999]">
                      {Number(src20.holders).toLocaleString()}
                    </span>
                  </p>
                </div>
                {/* Mint Button */}
                <div class="p-3 text-sm text-center flex flex-col justify-center">
                  <a
                    href={`/stamping/src20/mint?tick=${
                      encodeURIComponent(
                        src20.tick,
                      )
                    }&trxType=${encodeURIComponent(trxType)}`}
                  >
                    <button className="bg-[#8800CC] rounded-md text-[#080808] text-sm font-black w-[84px] h-[48px]">
                      Mint
                    </button>
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile View */}
        <div class="flex md:hidden flex-col gap-3">
          {data.map((src20: SRC20Row) => {
            const href = `/src20/${convertToEmoji(src20.tick)}`;

            const progress = src20.progress || "0";
            const progressWidth = `${progress}%`;

            return (
              <div class="text-[#F5F5F5] bg-[#2B0E49] border-2 border-[#3F2A4E] p-2">
                <div class="w-full flex items-center gap-2 mb-2">
                  <img
                    src={`/content/${src20.tx_hash}.svg`}
                    class="w-[74px] h-[74px] rounded-[3px]"
                    onClick={() =>
                      handleImageInteraction(`/content/${src20.tx_hash}.svg`)}
                  />
                  <div class="w-full">
                    <div class="flex justify-between">
                      <a href={href} class="text-xl">
                        {convertToEmoji(src20.tick)}
                      </a>
                      <p class="text-sm">
                        {new Date(src20.block_time).toLocaleString("default", {
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <p>
                      Block:{" "}
                      <span class="text-lg font-medium">
                        {src20.block_index}
                      </span>
                    </p>
                    <div className="flex flex-col gap-1">
                      <p className="text-lg font-light text-[#999999]">
                        PROGRESS <span className="font-bold">{progress}%</span>
                      </p>
                      <div className="min-w-[260px] h-1 bg-[#999999] relative rounded-full">
                        <div
                          className="absolute left-0 top-0 h-1 bg-[#660099] rounded-full"
                          style={{ width: progressWidth }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div class="w-full flex justify-between">
                  <p className="text-lg text-[#666666] font-light">
                    SUPPLY{" "}
                    <span className="font-bold text-[#999999]">
                      {Number(src20.max).toLocaleString()}
                    </span>
                  </p>
                  <p className="text-lg text-[#666666] font-light">
                    LIMIT{" "}
                    <span className="font-bold text-[#999999]">
                      {Number(src20.lim).toLocaleString()}
                    </span>
                  </p>
                </div>
                <div class="w-full flex justify-between">
                  <p className="text-lg text-[#666666] font-light">
                    DEPLOY{" "}
                    <span className="font-bold text-[#999999]">
                      {new Date(src20.block_time).toLocaleString("default", {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </p>
                  <p className="text-lg text-[#666666] font-light">
                    HOLDERS{" "}
                    <span className="font-bold text-[#999999]">
                      {Number(src20.holders).toLocaleString()}
                    </span>
                  </p>
                </div>
                {/* Mint Button */}
                <div class="w-full flex justify-end mt-2">
                  <a
                    href={`/stamping/src20/mint?tick=${
                      encodeURIComponent(
                        src20.tick,
                      )
                    }&trxType=${encodeURIComponent(trxType)}`}
                  >
                    <button className="bg-[#8800CC] rounded-md text-[#080808] text-sm font-black w-[84px] h-[48px]">
                      Mint
                    </button>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};
