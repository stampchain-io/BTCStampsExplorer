import { useState } from "preact/hooks";

import { SRC20Row } from "globals";

import { abbreviateAddress, convertToEmoji } from "utils/util.ts";

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

export const SRC20DeployTable = (props: SRC20BalanceTableProps) => {
  const { data } = props;
  console.log("SRC20DeployTable received data:", data);

  const [modalImg, setModalImg] = useState<string | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleImageInteraction = (imgSrc: string) => {
    setModalImg(imgSrc);
    setModalOpen(!isModalOpen);
  };

  return (
    <>
      <ImageModal
        imgSrc={modalImg}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
      <div class="relative overflow-x-auto shadow-md">
        {/* Desktop View */}
        <div class="hidden xl:flex flex-col gap-6 p-2">
          {data.map((src20: SRC20Row) => {
            // Ensure src20.tick is defined
            if (!src20.tick) {
              console.warn("src20.tick is undefined for src20:", src20);
              return null;
            }
            const href = `/src20/${convertToEmoji(src20.tick)}`;
            return (
              <div class="dark-gradient text-sm flex justify-between rounded-md hover:border-[#9900EE] hover:shadow-[0px_0px_20px_#9900EE]">
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
                      className="text-2xl text-[#666666] font-bold hover:text-[#AA00FF]"
                    >
                      {convertToEmoji(src20.tick)}
                    </a>
                    <p className="text-lg text-[#666666] font-light">
                      CREATOR{" "}
                      <span className="font-bold text-[#999999]">
                        {src20.destination_name
                          ? src20.destination_name
                          : abbreviateAddress(src20.destination)}
                      </span>
                    </p>
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
                <div class="p-3 text-right flex flex-col justify-center">
                  <p className="text-lg text-[#666666] font-light">
                    MARKETCAP{" "}
                    <span className="font-bold text-[#999999]">
                      {Number(src20.mcap).toFixed(2).toLocaleString()}
                    </span>
                  </p>
                  <p className="text-lg text-[#666666] font-light">
                    PRICE{" "}
                    <span className="font-bold text-[#999999]">
                      {Number(src20.floor_unit_price).toFixed(10)
                        .toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile View */}
        <div class="flex xl:hidden flex-col gap-3 p-2">
          {data.map((src20: SRC20Row) => {
            const href = `/src20/${convertToEmoji(src20.tick)}`;
            // Ensure src20.tick is defined
            return (
              <div class="text-[#F5F5F5] dark-gradient hover:border-[#9900EE] hover:shadow-[0px_0px_20px_#9900EE] p-2">
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
                      <p className="text-lg text-[#666666] font-light">
                        SUPPLY{" "}
                        <span className="font-bold text-[#999999]">
                          {Number(src20.max).toLocaleString()}
                        </span>
                      </p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-lg text-[#666666] font-light">
                        MARKETCAP{" "}
                        <span className="font-bold text-[#999999]">
                          {Number(src20.mcap).toFixed(2).toLocaleString()}
                        </span>
                      </p>
                      <p className="text-lg text-[#666666] font-light">
                        CREATOR{" "}
                        <span className="font-bold text-[#999999]">
                          {src20.destination_name
                            ? src20.destination_name
                            : abbreviateAddress(src20.destination)}
                        </span>
                      </p>
                    </div>
                    <div class="flex justify-between">
                      <p className="text-lg text-[#666666] font-light">
                        PRICE{" "}
                        <span className="font-bold text-[#999999]">
                          {Number(src20.floor_unit_price).toFixed(10)
                            .toLocaleString()}
                        </span>
                      </p>
                      <p className="text-lg text-[#666666] font-light">
                        HOLDERS{" "}
                        <span className="font-bold text-[#999999]">
                          {Number(src20.holders).toLocaleString()}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};
