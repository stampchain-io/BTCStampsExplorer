import { useState } from "preact/hooks";
import { SRC20Row } from "globals";
import { convertToEmoji } from "$lib/utils/util.ts";

interface SRC20CardProps {
  src20: SRC20Row;
  variant?: "deploy" | "trending" | "minting";
  onImageClick?: (imgSrc: string) => void;
}

export function SRC20Card(
  { src20, variant = "deploy", onImageClick }: SRC20CardProps,
) {
  const [isHovered, setIsHovered] = useState(false);

  const href = `/src20/${encodeURIComponent(convertToEmoji(src20.tick))}`;
  const mintHref = `/stamping/src20/mint?tick=${
    encodeURIComponent(src20.tick)
  }&trxType=olga`;
  const progress = src20.progress || "0";
  const progressWidth = `${progress}%`;

  const handleMintClick = () => {
    globalThis.location.href = mintHref;
  };

  const imageUrl = src20.stamp_url ||
    src20.deploy_img ||
    `/content/${src20.tx_hash}.svg` ||
    `/content/${src20.deploy_tx}`;

  return (
    <div
      class="flex text-sm justify-between items-center rounded-md hover:border-[#9900EE] hover:shadow-[0px_0px_20px_#9900EE] w-full bg-gradient-to-br from-[#0A000F00] via-[#14001FFF] to-[#1F002EFF]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left Section - Image and Title */}
      <div class="p-3 uppercase cursor-pointer flex gap-6">
        <img
          src={imageUrl}
          class="w-[65px] h-[65px]"
          onClick={() => onImageClick?.(imageUrl)}
          alt={src20.tick}
        />
        <div class="flex flex-col justify-between">
          <a
            href={href}
            class={`text-2xl font-bold ${
              isHovered ? "text-[#AA00FF]" : "text-stamp-grey-darker"
            } flex gap-4`}
          >
            {convertToEmoji(src20.tick)}
            {/* Social Icons */}
            <div class="flex gap-2">
              {src20.email != null && (
                <a href={src20.email} target="_blank">
                  <img
                    width="20px"
                    src="/img/src20/details/EnvelopeSimple.svg"
                  />
                </a>
              )}
              {src20.web != null && (
                <a href={src20.web} target="_blank">
                  <img width="20px" src="/img/src20/details/Globe.svg" />
                </a>
              )}
              {src20.tg != null && (
                <a href={src20.tg} target="_blank">
                  <img width="20px" src="/img/src20/details/TelegramLogo.svg" />
                </a>
              )}
              {src20.x != null && (
                <a href={src20.x} target="_blank">
                  <img width="20px" src="/img/src20/details/XLogo.svg" />
                </a>
              )}
            </div>
          </a>

          {/* Progress Bar */}
          <div class="flex flex-col gap-1">
            <p class="text-lg font-light text-stamp-grey">
              PROGRESS <span class="font-bold">{progress}%</span>
            </p>
            <div class="hidden mobileLg:block min-w-[260px] h-1 bg-[#999999] relative rounded-full">
              <div
                class="absolute left-0 top-0 h-1 bg-[#660099] rounded-full"
                style={{ width: progressWidth }}
              />
            </div>
          </div>
        </div>
      </div>

      {variant !== "minting" && (
        <>
          {/* Middle Section - Supply and Limit */}
          <div class="hidden tablet:flex p-3 text-center flex-col justify-center">
            <p class="text-lg text-stamp-grey-darker font-light">
              SUPPLY{" "}
              <span class="font-bold text-stamp-grey">
                {Number(src20.max).toLocaleString()}
              </span>
            </p>
            <p class="text-lg text-stamp-grey-darker font-light">
              LIMIT{" "}
              <span class="font-bold text-stamp-grey">
                {Number(src20.lim).toLocaleString()}
              </span>
            </p>
          </div>

          {/* Right Section - Deploy Date and Holders */}
          <div class="hidden tablet:flex p-3 text-sm text-center flex-col justify-center">
            <p class="text-lg text-stamp-grey-darker font-light">
              DEPLOY{" "}
              <span class="font-bold text-stamp-grey">
                {new Date(src20.block_time).toLocaleString("default", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </p>
            <p class="text-lg text-stamp-grey-darker font-light">
              HOLDERS{" "}
              <span class="font-bold text-stamp-grey">
                {Number(src20.holders).toLocaleString()}
              </span>
            </p>
          </div>
        </>
      )}

      {variant === "minting" && (
        <div class="hidden tablet:flex desktop:hidden p-3 text-center flex-col justify-center">
          <p class="text-lg text-stamp-grey-darker font-light">
            SUPPLY{" "}
            <span class="font-bold text-stamp-grey">
              {Number(src20.max).toLocaleString()}
            </span>
          </p>
          <p class="text-lg text-stamp-grey-darker font-light">
            LIMIT{" "}
            <span class="font-bold text-stamp-grey">
              {Number(src20.lim).toLocaleString()}
            </span>
          </p>
          <p className="text-lg text-stamp-grey-darker font-light">
            MINTERS{" "}
            <span className="font-bold text-stamp-grey">
              {Number(src20.holders || 0).toLocaleString()}
            </span>
          </p>
        </div>
      )}

      {/* Mint Button */}
      <div class="p-3 text-sm text-center flex flex-col justify-center">
        <button
          onClick={handleMintClick}
          class="bg-[#8800CC] disabled:bg-[#440088] rounded-md text-[#080808] text-sm font-black w-[84px] h-[48px]"
          disabled={progress == "100" ? true : false}
        >
          Mint
        </button>
      </div>
    </div>
  );
}
