/* ===== SRC20 CARD BASE COMPONENT ===== */
/*@baba-check styles*/
import { useState } from "preact/hooks";
import { SRC20Row } from "$globals";
import { unicodeEscapeToEmoji } from "$lib/utils/emojiUtils.ts";
import { Timeframe } from "$components/layout/types.ts";
import { cellAlign } from "$components/layout/types.ts";
import { _Icon } from "$icon";

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
  // fromPage is reserved for future use
  fromPage?: "src20" | "wallet" | "stamping/src20" | "home";
  // timeframe is reserved for future use
  timeframe?: Timeframe;
  onImageClick?: (imgSrc: string) => void;
  children?: preact.ComponentChildren;
  totalColumns: number;
}

/* ===== COMPONENT ===== */
export function SRC20CardBase({
  src20,
  fromPage: _fromPage = "src20",
  timeframe: _timeframe = "24H",
  onImageClick,
  children,
  totalColumns,
}: SRC20CardBaseProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Ensure proper image URL fallback chain
  const imageUrl = src20.stamp_url ||
    src20.deploy_img ||
    `/content/${src20.tx_hash}.svg` ||
    `/content/${src20.deploy_tx}`;

  return (
    <tr
      class="dark-gradient !rounded-xl border-2 border-transparent hover:border-stamp-primary-light hover:shadow-[0px_0px_20px_#9900EE] p-12"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <td class={cellAlign(0, totalColumns)}>
        <div class="flex items-center gap-4 p-3">
          <img
            src={imageUrl}
            class="w-8 h-8 rounded-sm cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              onImageClick?.(imageUrl);
            }}
            alt={unicodeEscapeToEmoji(src20.tick)}
          />
          <div class="flex flex-col">
            <div class="font-bold text-base uppercase tracking-wide">
              {(() => {
                const { text, emoji } = splitTextAndEmojis(
                  unicodeEscapeToEmoji(src20.tick),
                );
                return (
                  <>
                    {text && (
                      <span
                        class={isHovered
                          ? "text-stamp-purple-bright"
                          : "gray-gradient1"}
                      >
                        {text.toUpperCase()}
                      </span>
                    )}
                    {emoji && <span class="emoji-ticker">{emoji}</span>}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </td>
      {/* Other cells rendered by children */}
      {children}
    </tr>
  );
}

/* Social Links Component - To be implemented when needed
const SocialLinks = ({ src20 }: { src20: SRC20Row }) => {
  return (
    <div class="flex gap-2 items-center">
      {src20.email && (
        <Icon
          type="iconButton"
          name="email"
          weight="normal"
          size="xxs"
          color="grey"
          href={src20.email}
          target="_blank"
        />
      )}
      {src20.web && (
        <Icon
          type="iconButton"
          name="website"
          weight="normal"
          size="xxs"
          color="grey"
          href={src20.web}
          target="_blank"
        />
      )}
      {src20.tg && (
        <Icon
          type="iconButton"
          name="telegram"
          weight="normal"
          size="xxs"
          color="grey"
          href={src20.tg}
        />
      )}
      {src20.x && (
        <Icon
          type="iconButton"
          name="twitter"
          weight="normal"
          size="xxs"
          color="grey"
          href={src20.x}
          target="_blank"
        />
      )}
    </div>
  );
};
*/
