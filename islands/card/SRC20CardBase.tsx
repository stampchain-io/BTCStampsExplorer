/* ===== SRC20 CARD BASE COMPONENT ===== */
/*@baba-check styles*/
import { useState } from "preact/hooks";
import { SRC20Row } from "$globals";
import { unicodeEscapeToEmoji } from "$lib/utils/emojiUtils.ts";
import { stripTrailingZeros } from "$lib/utils/formatUtils.ts";
import { labelSm, textSm } from "$text";

/* ===== HELPER FUNCTIONS ===== */
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

/* ===== TYPES ===== */
export interface SRC20CardBaseProps {
  src20: SRC20Row;
  fromPage?: "src20" | "wallet" | "stamping/src20" | "home";
  onImageClick?: (imgSrc: string) => void;
}

/* ===== COMPONENT ===== */
export function SRC20CardBase(
  { src20, fromPage = "src20", onImageClick, children }: SRC20CardBaseProps & {
    children: preact.ComponentChildren;
  },
) {
  /* ===== STATE ===== */
  const [isHovered, setIsHovered] = useState(false);

  /* ===== COMPUTED VALUES ===== */
  const href = `/src20/${encodeURIComponent(unicodeEscapeToEmoji(src20.tick))}`;
  const progress = src20.progress || "0";
  const progressWidth = `${progress}%`;
  const imageUrl = src20.stamp_url ||
    src20.deploy_img ||
    `/content/${src20.tx_hash}.svg` ||
    `/content/${src20.deploy_tx}`;

  return (
    /* ===== RENDER ===== */
    <a
      href={href}
      class="flex justify-between items-center border-2 border-transparent rounded-lg hover:border-stamp-primary-light hover:shadow-[0px_0px_20px_#9900EE] w-full bg-gradient-to-br from-[#0A000F00] via-[#14001FFF] to-[#1F002EFF] p-3 mobileMd:p-6"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ===== LEFT SECTION - IMAGE AND TITLE ===== */}
      <div class="cursor-pointer flex gap-5">
        <img
          src={imageUrl}
          class="w-[72px] h-[72px] rounded-sm"
          onClick={() => onImageClick?.(imageUrl)}
          alt={unicodeEscapeToEmoji(src20.tick)}
        />
        <div class="flex flex-col">
          {/* ===== TITLE AND SOCIAL LINKS ===== */}
          <h5 class="font-extrabold text-xl uppercase tracking-wide flex gap-4 relative z-[20]">
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
              {/* ===== SOCIAL ICONS ===== */}
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
          </h5>

          {/* ===== CONDITIONAL CONTENT SECTIONS ===== */}
          {/* ===== SUPPLY AND LIMIT INFO ===== */}
          {(fromPage === "src20" || fromPage === "home") && (
            <div class="flex flex-col pt-0.75 mobileLg:pt-1.5 -space-y-0.5">
              <h6 class={labelSm}>
                SUPPLY{" "}
                <span class={textSm}>
                  {Number(src20.max).toLocaleString()}
                </span>
              </h6>

              <h6 class={labelSm}>
                LIMIT{" "}
                <span class={textSm}>
                  {Number(src20.lim).toLocaleString()}
                </span>
              </h6>
            </div>
          )}

          {/* ===== WALLET AMOUNT INFO ===== */}
          {fromPage === "wallet" && (
            <div class="flex flex-col pt-0.75 mobileLg:pt-1.5 -space-y-0.5">
              <h6 class={labelSm}>
                AMOUNT
              </h6>
              <h6 class={textSm}>
                {stripTrailingZeros(Number(src20.amt).toFixed(2))}
              </h6>
            </div>
          )}

          {/* ===== PROGRESS BAR ===== */}
          {fromPage === "stamping/src20" && (
            <div class="flex flex-col pt-1.5 mobileLg:pt-3 gap-1">
              <h6 class={labelSm}>
                PROGRESS <span class={textSm}>{progress}%</span>
              </h6>
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

      {/* ===== RIGHT SECTION - CHILDREN ===== */}
      {children}
    </a>
  );
}
