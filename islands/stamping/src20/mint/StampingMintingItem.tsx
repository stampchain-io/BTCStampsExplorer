import { useState } from "preact/hooks";

import { SRC20Row } from "globals";

import { convertToEmoji } from "$lib/utils/util.ts";

interface StampingMintingItemProps {
  src20: SRC20Row;
}

const StampingMintingItem = ({ src20 }: StampingMintingItemProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const href = `/src20/${encodeURIComponent(convertToEmoji(src20.tick))}`;
  const mintHref = `/stamping/src20/mint?tick=${
    encodeURIComponent(src20.tick)
  }`;

  const progress = src20.progress || "0";
  const progressWidth = `${progress}%`;

  const handleMintClick = () => {
    globalThis.location.href = mintHref;
  };

  return (
    <div
      className="flex dark-gradient text-sm justify-between items-center rounded-md hover:border-[#9900EE] hover:shadow-[0px_0px_20px_#9900EE] w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-3 uppercase cursor-pointer flex gap-6">
        <img
          src={src20.stamp_url || src20.deploy_img ||
            `/content/${src20.tx_hash}.svg` ||
            `/content/${src20.deploy_tx}`}
          className="w-[75px] h-[75px]"
          alt={src20.tick}
        />
        <div className="flex flex-col justify-between">
          <a
            href={href}
            className={`text-2xl font-bold ${
              isHovered ? "text-[#AA00FF]" : "text-[#666666]"
            }`}
          >
            {convertToEmoji(src20.tick)}
          </a>
          <div className="flex flex-col gap-1">
            <p className="hidden md:block text-lg font-light text-[#999999]">
              PROGRESS <span className="font-bold">{progress}%</span>
            </p>

            {/* Show on mobile only */}
            <span className="block md:hidden font-bold text-lg text-[#999999]">
              {progress}%
            </span>
            <p className="block md:hidden text-lg font-light text-[#999999]">
              PROGRESS
            </p>

            {(progress !== "100") && (
              <div className="hidden md:block min-w-[200px] h-1 bg-[#999999] relative rounded-full">
                <div
                  className="absolute left-0 top-0 h-1 bg-[#660099] rounded-full"
                  style={{ width: progressWidth }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="hidden md:flex lg:hidden flex-col items-center p-3 text-center">
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
            {Number(src20.holders || 0).toLocaleString()}
          </span>
        </p>
      </div>

      {progress !== "100" && (
        <div className="p-3 text-sm text-center flex flex-col justify-center">
          <button
            onClick={handleMintClick}
            className="bg-[#8800CC] rounded-md text-[#080808] text-sm font-black w-[84px] h-[48px]"
          >
            Mint
          </button>
        </div>
      )}
    </div>
  );
};

export default StampingMintingItem;
