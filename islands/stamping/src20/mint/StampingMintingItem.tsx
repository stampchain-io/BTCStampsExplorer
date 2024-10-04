import { useState } from "preact/hooks";

import { SRC20Row } from "globals";

import { convertToEmoji } from "utils/util.ts";

interface StampingMintingItemProps {
  src20: SRC20Row;
}

const StampingMintingItem = (
  { src20 }: StampingMintingItemProps,
) => {
  const [isHovered, setIsHovered] = useState(false);

  const href = `/src20/${convertToEmoji(src20.tick)}`;

  const progress = src20.progress || "0";
  const progressWidth = `${progress}%`;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Desktop View */}
      <div class="hidden md:flex bg-gradient-to-br from-[#0A000F00] via-[#14001FFF] to-[#1F002EFF] text-sm justify-between items-center rounded-md hover:border-[#9900EE] hover:shadow-[0px_0px_20px_#9900EE]">
        <div class="p-3 uppercase cursor-pointer flex gap-6">
          <img
            src={`/content/${src20.tx_hash}.svg`}
            class="w-[65px] h-[65px]"
          />
          <div className="flex flex-col justify-between">
            <a
              href={href}
              class={`text-2xl font-bold ${
                isHovered ? "text-[#AA00FF]" : "text-[#666666]"
              }`}
            >
              {convertToEmoji(src20.tick)}
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
        <div class="p-3 text-center flex flex-col items-end">
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
          <p className="text-lg text-[#666666] font-light">
            MINTERS{" "}
            <span className="font-bold text-[#999999]">
              {Number(src20.holders).toLocaleString()}
            </span>
          </p>
        </div>
      </div>

      {/* Mobile View */}
      <div class="block md:hidden text-[#F5F5F5] bg-[#2B0E49] border-2 border-[#3F2A4E] p-2 hover:border-[#9900EE] hover:shadow-[0px_0px_20px_#9900EE]">
        <div class="w-full flex items-center gap-2 mb-2">
          <img
            src={`/content/${src20.tx_hash}.svg`}
            class="w-[74px] h-[74px] rounded-[3px]"
          />
          <div class="w-full">
            <div class="flex justify-between">
              <a
                href={href}
                class={`text-xl ${isHovered ? "text-[#AA00FF]" : ""}`}
              >
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
          <p className="text-lg text-[#666666] font-light">
            HOLDERS{" "}
            <span className="font-bold text-[#999999]">
              {Number(src20.holders).toLocaleString()}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default StampingMintingItem;
