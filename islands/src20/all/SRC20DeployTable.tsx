import { useState } from "preact/hooks";

import { SRC20Row } from "globals";

import { abbreviateAddress, convertToEmoji } from "$lib/utils/util.ts";

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
        <div class="hidden desktop:flex flex-col gap-6 p-2">
          {data.map((src20: SRC20Row) => {
            // Ensure src20.tick is defined
            if (!src20.tick) {
              console.warn("src20.tick is undefined for src20:", src20);
              return null;
            }
            const href = `/src20/${convertToEmoji(src20.tick)}`;
            const progress = src20.progress || "0";
            const progressWidth = `${progress}%`;
            return (
              <div class="bg-gradient-to-br from-transparent from-0% via-[#14001F] to-[#1F002E] text-sm flex justify-between rounded-md hover:border-[#9900EE] hover:shadow-[0px_0px_20px_#9900EE]">
                <div class="p-3 uppercase cursor-pointer flex justify-center items-center gap-6">
                  <img
                    src={`/content/${src20.tx_hash}.svg`}
                    class="w-[65px] h-[65px]"
                    onClick={() =>
                      handleImageInteraction(`/content/${src20.tx_hash}.svg`)}
                  />
                  <div className="flex flex-col justify-between">
                    <a
                      href={href}
                      className="text-2xl text-[#666666] font-bold hover:text-[#AA00FF] uppercase flex gap-4"
                    >
                      {convertToEmoji(src20.tick)}
                      <div className="flex gap-2">
                        {src20.email && (
                          <img
                            width="25px"
                            src="/img/src20/details/EnvelopeSimple.svg"
                          />
                        )}
                        {src20.web && (
                          <img
                            width="25px"
                            src="/img/src20/details/Globe.svg"
                          />
                        )}
                        {src20.tg && (
                          <img
                            width="25px"
                            src="/img/src20/details/TelegramLogo.svg"
                          />
                        )}
                        {src20.x && (
                          <img
                            width="25px"
                            src="/img/src20/details/XLogo.svg"
                          />
                        )}
                      </div>
                    </a>
                    <p className="text-base mobile-768:text-lg text-[#666666] font-light">
                      SUPPLY{" "}
                      <span className="font-bold text-[#999999]">
                        {Number(src20.max).toLocaleString()}
                      </span>
                    </p>
                    {progress == "100"
                      ? (
                        <p className="text-lg text-[#666666] font-light">
                          MARKETCAP{" "}
                          <span className="font-bold text-[#999999]">
                            {Number(src20.mcap).toFixed(2).toLocaleString()}
                          </span>
                        </p>
                      )
                      : (
                        <p className="text-lg text-[#666666] font-light">
                          LIMIT{" "}
                          <span className="font-bold text-[#999999]">
                            {Number(src20.lim).toFixed(2).toLocaleString()}
                          </span>
                        </p>
                      )}
                  </div>
                </div>
                <div class="p-3 text-center flex flex-col justify-center">
                  {progress == "100"
                    ? (
                      <>
                        <p className="text-lg text-[#666666] font-light">
                          PRICE{" "}
                          <span className="font-bold text-[#999999]">
                            {Number(src20.floor_unit_price).toFixed(10)
                              .toLocaleString()}
                          </span>
                        </p>
                        <p className="text-lg text-[#666666] font-light">
                          CHANGE{" "}
                          <span className="font-bold text-[#999999]">
                            {Number(src20.p).toLocaleString()}
                          </span>
                        </p>
                        <p className="text-lg text-[#666666] font-light">
                          VOLUME{" "}
                          <span className="font-bold text-[#999999]">
                            {Number(src20.lim).toLocaleString()}
                          </span>
                        </p>
                      </>
                    )
                    : (
                      <>
                        <p className="text-lg text-[#666666] font-light">
                          TOP MINTS{" "}
                          <span className="font-bold text-[#999999]">
                            {Number(src20.max).toFixed(10)
                              .toLocaleString()} %
                          </span>
                        </p>
                        <div className="flex flex-col gap-1">
                          <p className="text-lg font-light text-[#999999]">
                            PROGRESS{" "}
                            <span className="font-bold">
                              {progress.toString().match(/^-?\d+(?:\.\d{0,2})?/)
                                ?.[0] || "0"}%
                            </span>
                          </p>
                          <div className="min-w-[260px] h-1 bg-[#999999] relative rounded-full">
                            <div
                              className="absolute left-0 top-0 h-1 bg-[#660099] rounded-full"
                              style={{ width: progressWidth }}
                            />
                          </div>
                        </div>
                      </>
                    )}
                </div>
                {(progress == "100" && src20?.amt)
                  ? (
                    <div className="flex flex-col justify-end items-end">
                      <p className="text-2xl text-[#666666] font-light">
                        VALUE{" "}
                      </p>
                      <p className="text-2xl text-[#999999] font-light">
                        {src20?.amt}{" "}
                        <span className="font-bold text-[#666666]">
                          BTC
                        </span>
                      </p>
                    </div>
                  )
                  : (
                    progress == "100" && (
                      <div class="p-3 text-right flex flex-col justify-center">
                        <p className="text-lg text-[#666666] font-light text-center">
                          HOLDERS{" "}
                          <span className="font-bold text-[#999999]">
                            {Number(src20.holders).toLocaleString()}
                          </span>
                        </p>
                        <p className="text-lg text-[#666666] font-light text-center">
                          DEPLOY{" "}
                          <span className="font-bold text-[#999999]">
                            {new Date(src20.block_time).toLocaleString(
                              "default",
                              {
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </p>
                        <p className="text-lg text-[#666666] font-light text-center">
                          CREATOR{" "}
                          <span className="font-bold text-[#999999]">
                            {src20.destination_name
                              ? src20.destination_name
                              : abbreviateAddress(src20.destination)}
                          </span>
                        </p>
                      </div>
                    )
                  )}
                {progress !== "100" && (
                  <div class="flex justify-center items-center p-2">
                    <a
                      href={`/stamping/src20/mint?tick=${
                        encodeURIComponent(
                          src20.tick,
                        )
                      }&trxType=${encodeURIComponent(src20.tx_hash)}`}
                    >
                      <button className="bg-[#8800CC] rounded-md text-[#080808] text-sm font-black w-[84px] h-[48px]">
                        Mint
                      </button>
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile View */}
        <div class="flex desktop:hidden flex-col gap-3 p-2">
          {data.map((src20: SRC20Row) => {
            const href = `/src20/${convertToEmoji(src20.tick)}`;
            // Ensure src20.tick is defined
            const progress = src20.progress || "0";
            const progressWidth = `${progress}%`;

            return (
              <div class="text-[#F5F5F5] bg-gradient-to-br from-transparent from-0% via-[#14001F] to-[#1F002E] hover:border-[#9900EE] hover:shadow-[0px_0px_20px_#9900EE] p-2">
                <div class="w-full flex items-center gap-2 mb-2">
                  <img
                    src={`/content/${src20.tx_hash}.svg`}
                    class="w-[74px] h-[74px] rounded-[3px]"
                    onClick={() =>
                      handleImageInteraction(`/content/${src20.tx_hash}.svg`)}
                  />

                  <div class="w-full flex flex-col">
                    <div class="flex justify-between">
                      <a href={href} class="flex gap-4 text-xl uppercase">
                        {convertToEmoji(src20.tick)}
                        <div className="flex gap-2">
                          {src20.email && (
                            <img
                              width="18px"
                              src="/img/src20/details/EnvelopeSimple.svg"
                            />
                          )}
                          {src20.web && (
                            <img
                              width="18px"
                              src="/img/src20/details/Globe.svg"
                            />
                          )}
                          {src20.tg && (
                            <img
                              width="18px"
                              src="/img/src20/details/TelegramLogo.svg"
                            />
                          )}
                          {src20.x && (
                            <img
                              width="18px"
                              src="/img/src20/details/XLogo.svg"
                            />
                          )}
                        </div>
                      </a>
                    </div>
                    <div className="flex flex-col justify-start gap-1">
                      {progress == "100"
                        ? (
                          <>
                            <p className="text-lg text-[#666666] font-light flex gap-1">
                              PRICE{" "}
                              <span className="font-bold text-[#999999]">
                                {Number(src20.floor_unit_price).toFixed(10)
                                  .toLocaleString()}
                              </span>
                            </p>
                            <p className="text-lg text-[#666666] font-light flex gap-1">
                              MARKETCAP{" "}
                              <span className="font-bold text-[#999999]">
                                {Number(src20.mcap).toFixed(2).toLocaleString()}
                              </span>
                            </p>
                          </>
                        )
                        : (
                          <div className="flex flex-col gap-1">
                            <p className="text-lg font-light text-[#999999]">
                              PROGRESS{" "}
                              <span className="font-bold">
                                {progress.toString().match(
                                  /^-?\d+(?:\.\d{0,2})?/,
                                )?.[0] || "0"}%
                              </span>
                            </p>
                            <div className="min-w-[180px] h-1 bg-[#999999] relative rounded-full">
                              <div
                                className="absolute left-0 top-0 h-1 bg-[#660099] rounded-full"
                                style={{ width: progressWidth }}
                              />
                            </div>
                          </div>
                        )}
                    </div>
                  </div>

                  {progress !== "100" && (
                    <a
                      href={`/stamping/src20/mint?tick=${
                        encodeURIComponent(
                          src20.tick,
                        )
                      }&trxType=${encodeURIComponent(src20.tx_hash)}`}
                    >
                      <button className="bg-[#8800CC] rounded-md text-[#080808] text-sm font-black w-[66px] tablet:w-[84px] h-[36px] tablet:h-[48px]">
                        Mint
                      </button>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};
