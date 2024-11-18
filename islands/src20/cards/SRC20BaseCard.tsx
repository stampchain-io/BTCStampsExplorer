import { useState } from "preact/hooks";
import { SRC20Row } from "globals";
import { convertToEmoji } from "$lib/utils/emojiUtils.ts";

export const middleLayoutClassName =
  "hidden tablet:flex text-center flex-col justify-center";
export const defaultTextClassName = "text-lg text-stamp-grey-darker font-light";
export const boldTextClassName = "font-bold text-stamp-grey";

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
    <div
      class="flex text-sm justify-between items-center rounded-md hover:border-stamp-primary-light hover:shadow-[0px_0px_20px_#9900EE] w-full bg-gradient-to-br from-[#0A000F00] via-[#14001FFF] to-[#1F002EFF] p-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left Section - Image and Title */}
      <div class="uppercase cursor-pointer flex gap-6">
        <img
          src={imageUrl}
          class="w-[86px] h-[86px]"
          onClick={() => onImageClick?.(imageUrl)}
          alt={src20.tick}
        />
        <div class="flex flex-col justify-between">
          <a
            href={href}
            class={`text-2xl font-bold ${
              isHovered ? "text-stamp-primary-hover" : "text-stamp-grey-darker"
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

          {variant !== "minting" && (
            <>
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
            </>
          )}

          {variant === "minting" && (
            <div class="flex flex-col gap-1">
              <p class={defaultTextClassName}>
                PROGRESS <span class={boldTextClassName}>{progress}%</span>
              </p>
              <div class="hidden mobileLg:block min-w-[260px] h-1 bg-[#999999] relative rounded-full">
                <div
                  class="absolute left-0 top-0 h-1 bg-[#660099] rounded-full"
                  style={{ width: progressWidth }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}
