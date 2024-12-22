import { useState } from "preact/hooks";
import { SRC20Row } from "$globals";
import { unicodeEscapeToEmoji } from "$lib/utils/emojiUtils.ts";
import { stripTrailingZeros } from "$lib/utils/formatUtils.ts";

function splitTextAndEmojis(text: string): { text: string; emoji: string } {
  // Regex to match emojis
  const emojiRegex =
    /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}]/gu;

  // Find the first emoji's position
  const match = text.match(emojiRegex);
  if (!match) return { text, emoji: "" };

  const emojiIndex = text.indexOf(match[0]);
  return {
    text: text.slice(0, emojiIndex),
    emoji: text.slice(emojiIndex),
  };
}

export const middleLayoutClassName =
  "hidden tablet:flex text-center flex-col justify-center";
export const defaultTextClassName =
  "text-base mobileLg:text-lg text-stamp-grey-darker font-light";
export const boldTextClassName = "font-bold text-stamp-grey-light";
const dataLabelSm =
  "text-sm mobileLg:text-base font-light text-stamp-grey-darker uppercase";
const dataValueSm =
  "text-sm mobileLg:text-base font-medium text-stamp-grey-light";

export interface SRC20BaseCardProps {
  src20: SRC20Row;
  fromPage?: "src20" | "wallet" | "stamping/src20" | "home";
  onImageClick?: (imgSrc: string) => void;
}

export function SRC20BaseCard(
  { src20, fromPage = "src20", onImageClick, children }: SRC20BaseCardProps & {
    children: preact.ComponentChildren;
  },
) {
  const [isHovered, setIsHovered] = useState(false);

  const href = `/src20/${encodeURIComponent(unicodeEscapeToEmoji(src20.tick))}`;
  const progress = src20.progress || "0";
  const progressWidth = `${progress}%`;

  const imageUrl = src20.stamp_url ||
    src20.deploy_img ||
    `/content/${src20.tx_hash}.svg` ||
    `/content/${src20.deploy_tx}`;

  return (
    <a
      href={href}
      class="flex justify-between items-center border-2 border-transparent rounded-md hover:border-stamp-primary-light hover:shadow-[0px_0px_20px_#9900EE] w-full bg-gradient-to-br from-[#0A000F00] via-[#14001FFF] to-[#1F002EFF] p-3 mobileMd:p-6"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left Section - Image and Title */}
      <div class="cursor-pointer flex gap-[18px] mobileMd:gap-[30px]">
        <img
          src={imageUrl}
          class="w-[72px] h-[72px] mobileLg:w-[92px] mobileLg:h-[92px] rounded-sm"
          onClick={() => onImageClick?.(imageUrl)}
          alt={unicodeEscapeToEmoji(src20.tick)}
        />
        <div class="flex flex-col">
          <p class="text-2xl mobileLg:text-4xl font-black uppercase flex gap-4 relative z-[20]">
            {(() => {
              const { text, emoji } = splitTextAndEmojis(
                unicodeEscapeToEmoji(src20.tick),
              );
              return (
                <>
                  {text && (
                    <span
                      class={isHovered
                        ? "text-stamp-primary-hover"
                        : "gray-gradient1"}
                    >
                      {text}
                    </span>
                  )}
                  {emoji && <span class="emoji-ticker">{emoji}</span>}
                </>
              );
            })()}
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

          {(fromPage === "src20" || fromPage === "home") && (
            <div class="flex flex-col pt-0.75 mobileLg:pt-1.5 -space-y-0.5">
              <p class={dataLabelSm}>
                SUPPLY{" "}
                <span class={dataValueSm}>
                  {Number(src20.max).toLocaleString()}
                </span>
              </p>

              <p class={dataLabelSm}>
                LIMIT{" "}
                <span class={dataValueSm}>
                  {Number(src20.lim).toLocaleString()}
                </span>
              </p>
            </div>
          )}

          {fromPage === "wallet" && (
            <div class="flex flex-col pt-0.75 mobileLg:pt-1.5 -space-y-0.5">
              <p class={dataLabelSm}>
                AMOUNT
              </p>
              <p class={dataValueSm}>
                {stripTrailingZeros(Number(src20.amt).toFixed(2))}
              </p>
            </div>
          )}

          {fromPage === "stamping/src20" && (
            <div class="flex flex-col pt-1.5 mobileLg:pt-3 gap-1">
              <p class={dataLabelSm}>
                PROGRESS <span class={dataValueSm}>{progress}%</span>
              </p>
              <div class="relative min-w-[144px] mobileLg:min-w-[192px] h-1 mobileLg:h-1.5 bg-stamp-grey rounded-full">
                <div
                  class="absolute left-0 top-0 h-1 mobileLg:h-1.5 bg-stamp-purple-dark rounded-full"
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
