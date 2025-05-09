/* reinamora - update Trending calculations */
import { SRC20Row } from "$globals";
import { unicodeEscapeToEmoji } from "$lib/utils/emojiUtils.ts";
import { Timeframe } from "$layout";
import { labelXs, textSm, valueDark } from "$text";
import { Button } from "$button";
import { cellAlign, colGroup } from "$components/layout/types.ts";
import {
  containerCardTable,
  rowCardBorderCenter,
  rowCardBorderLeft,
  rowCardBorderRight,
} from "$layout";

interface SRC20CardSmMintingProps {
  data: SRC20Row[];
  fromPage: "src20" | "wallet" | "stamping/src20" | "home";
  timeframe: Timeframe;
  onImageClick: (imgSrc: string) => void;
}

export function SRC20CardSmMinting({
  data,
  _fromPage,
  _timeframe,
  onImageClick,
}: SRC20CardSmMintingProps) {
  const headers = [
    "TOKEN",
    "MINTS",
    "PROGRESS",
    "", // MINT button
  ];

  function splitTextAndEmojis(text: string): { text: string; emoji: string } {
    const emojiRegex =
      /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}]/gu;
    const match = text.match(emojiRegex);
    if (!match) return { text, emoji: "" };
    const emojiIndex = text.indexOf(match[0]);
    return {
      text: text.slice(0, emojiIndex),
      emoji: text.slice(emojiIndex),
    };
  }

  return (
    <table class={`w-full ${textSm} border-separate border-spacing-y-3`}>
      <colgroup>
        {colGroup([
          { width: "w-[25%]" }, // TOKEN
          { width: "w-[18%]" }, // MINTS
          { width: "w-[18%]" }, // PROGRESS
          { width: "w-[39%]" }, // MINT button
        ]).map((col) => <col key={col.key} className={col.className} />)}
      </colgroup>
      <thead>
        <tr>
          {headers.map((header, i) => (
            <th
              key={header}
              class={`${labelXs} ${cellAlign(i, headers.length)} ${
                i === 1 ? "hidden min-[600px]:table-cell" : "" // MINTS
              }`}
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length
          ? (
            data.map((src20) => {
              const imageUrl = src20.stamp_url ||
                src20.deploy_img ||
                `/content/${src20.tx_hash}.svg` ||
                `/content/${src20.deploy_tx}`;

              const href = `/src20/${
                encodeURIComponent(unicodeEscapeToEmoji(src20.tick))
              }`;

              const mintHref = `/tool/src20/mint?tick=${
                encodeURIComponent(src20.tick)
              }&trxType=olga`;

              const handleMintClick = (event: MouseEvent) => {
                event.preventDefault();
                globalThis.location.href = mintHref;
              };

              return (
                <tr
                  key={src20.tx_hash}
                  class={`${containerCardTable} cursor-pointer group`}
                >
                  {/* TOKEN */}
                  <td
                    class={`${
                      cellAlign(0, headers.length)
                    } ${rowCardBorderLeft}`}
                  >
                    <div class="flex items-center gap-4">
                      <img
                        src={imageUrl}
                        class="hidden min-[420px]:flex w-7 h-7 rounded-sm cursor-pointer"
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
                                  <a
                                    href={href}
                                    onClick={(e) => {
                                      if (
                                        !e.ctrlKey && !e.metaKey &&
                                        e.button !== 1
                                      ) {
                                        e.preventDefault();
                                        globalThis.location.href = href;
                                      }
                                    }}
                                  >
                                    <span class="gray-gradient1 group-hover:[-webkit-text-fill-color:#AA00FF] inline-block transition-colors duration-300">
                                      {text.toUpperCase()}
                                    </span>
                                  </a>
                                )}
                                {emoji && (
                                  <span class="emoji-ticker">{emoji}</span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </td>
                  {/* MINTS */}
                  <td
                    class={`${
                      cellAlign(1, headers.length)
                    } ${rowCardBorderCenter} hidden min-[600px]:table-cell`}
                  >
                    {src20.mint_count || "N/A"}
                  </td>
                  {/* PROGRESS */}
                  <td
                    class={`${
                      cellAlign(2, headers.length)
                    } ${rowCardBorderCenter}`}
                  >
                    <div class="flex items-center justify-center w-full">
                      <div class="flex flex-col w-[100px] min-[420px]:w-[120px] mobileLg:w-[160px] gap-1">
                        <div class="!text-xs text-center">
                          {Number(src20.progress)}
                          <span class="text-stamp-grey-light">%</span>
                        </div>
                        <div class="relative h-1.5 bg-stamp-grey rounded-full">
                          <div
                            class="absolute left-0 top-0 h-1.5 bg-stamp-purple-dark rounded-full"
                            style={{ width: `${src20.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                  {/* MINT BUTTON */}
                  <td
                    class={`${
                      cellAlign(3, headers.length)
                    } ${rowCardBorderRight}`}
                  >
                    <Button
                      variant="outline"
                      color="purple"
                      size="xs"
                      href={mintHref}
                      onClick={handleMintClick}
                    >
                      MINT
                    </Button>
                  </td>
                </tr>
              );
            })
          )
          : (
            <tr>
              <td colSpan={headers.length} class={`${valueDark} w-full`}>
                NO MINTING TOKENS
              </td>
            </tr>
          )}
      </tbody>
    </table>
  );
}
