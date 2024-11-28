import { useState } from "preact/hooks";
import { SRC20Row } from "globals";
import { convertToEmoji } from "$lib/utils/emojiUtils.ts";

export const middleLayoutClassName =
  "hidden tablet:flex text-center flex-col justify-center";
export const defaultTextClassName =
  "text-base mobileLg:text-lg text-stamp-grey-darker font-light";
export const boldTextClassName = "font-bold text-stamp-grey-light";

export interface SRC20BaseCardProps {
  src20: SRC20Row;
  variant?: "deploy" | "trending" | "minting";
  onImageClick?: (imgSrc: string) => void;
}

export function SRC20BaseCard(
  { src20, variant = "deploy", onImageClick, children }: SRC20BaseCardProps & {
    children: preact.ComponentChildren;
  },
) {
  const [isHovered, setIsHovered] = useState(false);

  const href = `/src20/${encodeURIComponent(convertToEmoji(src20.tick))}`;
  const progress = src20.progress || "0";
  const progressWidth = `${progress}%`;

  const imageUrl = src20.stamp_url ||
    src20.deploy_img ||
    `/content/${src20.tx_hash}.svg` ||
    `/content/${src20.deploy_tx}`;

  return (
    <a
      href={href}
      class="flex text-sm justify-between items-center border-2 border-transparent rounded-md hover:border-stamp-primary-light hover:shadow-[0px_0px_20px_#9900EE] w-full bg-gradient-to-br from-[#0A000F00] via-[#14001FFF] to-[#1F002EFF] p-3 mobileMd:p-6"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left Section - Image and Title */}
      <div class="uppercase cursor-pointer flex gap-[18px] mobileMd:gap-[30px]">
        <img
          src={imageUrl}
          class="w-[86px] h-[86px] mobileLg:w-[102px] mobileLg:h-[102px] rounded-sm"
          onClick={() => onImageClick?.(imageUrl)}
          alt={convertToEmoji(src20.tick)}
        />
        <div class="flex flex-col">
          <p
            class={`text-2xl mobileLg:text-4xl font-black ${
              isHovered ? "text-stamp-primary-hover" : "gray-gradient1"
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
          </p>

          {variant !== "minting" && (
            <div class="flex flex-col pt-1.5">
              <p class={defaultTextClassName}>
                SUPPLY{" "}
                <span class={boldTextClassName}>
                  {Number(src20.max).toLocaleString()}
                </span>
              </p>

              <p class={defaultTextClassName}>
                LIMIT{" "}
                <span class={boldTextClassName}>
                  {Number(src20.lim).toLocaleString()}
                </span>
              </p>
            </div>
          )}

          {variant === "minting" && (
            <div class="flex flex-col gap-1 pt-3">
              <p class={defaultTextClassName}>
                PROGRESS <span class={boldTextClassName}>{progress}%</span>
              </p>
              <div class="hidden mobileMd:block min-w-[260px] h-1.5 bg-stamp-grey relative rounded-full">
                <div
                  class="absolute left-0 top-0 h-1.5 bg-stamp-purple-dark rounded-full"
                  style={{ width: progressWidth }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {children}
    </a>
  );
}
