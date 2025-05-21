import { SRC20Row } from "$globals";
import { formatDate } from "$lib/utils/formatUtils.ts";
import { unicodeEscapeToEmoji } from "$lib/utils/emojiUtils.ts";
import ChartWidget from "$islands/layout/ChartWidget.tsx";
import { Timeframe } from "$layout";
import { cellAlign, colGroup } from "$components/layout/types.ts";
import {
  containerCardTable,
  rowCardBorderCenter,
  rowCardBorderLeft,
  rowCardBorderRight,
} from "$layout";
import { labelXs, textSm, valueDark } from "$text";

interface SRC20CardProps {
  data: SRC20Row[];
  fromPage: "src20" | "wallet" | "stamping/src20" | "home";
  timeframe: Timeframe;
  onImageClick: (imgSrc: string) => void;
}

export function SRC20Card({
  data,
  fromPage: _fromPage,
  timeframe,
  onImageClick,
}: SRC20CardProps) {
  const headers = [
    "TOKEN",
    "PRICE",
    "CHANGE",
    "VOLUME",
    "MARKETCAP",
    "DEPLOY",
    "HOLDERS",
    "",
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
          { width: "w-[40%] mobileMd:w-[25%] mobileLg:w-[19%] tablet:w-[16%]" }, // TOKEN
          { width: "w-[30%] mobileMd:w-[16%] mobileLg:w-[12%] tablet:w-[8%]" }, // PRICE
          { width: "w-[30%] mobileMd:w-[8%] mobileLg:w-[4%] tablet:w-[8%]" }, // CHANGE
          { width: "hidden mobileMd:w-[8%] mobileLg:w-[16%] tablet:w-[10%]" }, // VOLUME
          { width: "hidden mobileLg:w-[16%] tablet:w-[10%]" }, // MARKETCAP
          { width: "hidden tablet:w-[12%]" }, // DEPLOY
          { width: "hidden mobileLg:w-[13%] tablet:w-[10%]" }, // HOLDERS
          { width: "hidden mobileMd:w-[16%] mobileLg:w-[22%] tablet:w-[26%]" }, // CHART
        ]).map((col) => <col key={col.key} className={col.className} />)}
      </colgroup>
      <thead>
        <tr>
          {headers.map((header, i) => (
            <th
              key={header}
              class={`${labelXs} ${cellAlign(i, headers.length)}
              ${i === 7 ? "hidden mobileMd:table-cell" : "" // CHART
              }${i === 3 ? "hidden mobileMd:table-cell" : "" // VOLUME
              } ${i === 4 ? "hidden mobileLg:table-cell" : "" // MARKETCAP
              } ${i === 5 ? "hidden tablet:table-cell" : "" // DEPLOY
              } ${i === 6 ? "hidden mobileLg:table-cell" : "" // HOLDERS
              }
              `}
            >
              {header}
              {(header === "CHANGE" || header === "VOLUME") &&
                ` ${timeframe}`}
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

              return (
                <tr
                  key={src20.tx_hash}
                  class={`${containerCardTable} cursor-pointer group`}
                  onClick={(e) => {
                    // Only navigate if not clicking on image or chart
                    const target = e.target as HTMLElement;
                    const isImage = target.tagName === "IMG";
                    const isChart = target.closest("[data-chart-widget]"); // Add this data attribute to ChartWidget
                    if (
                      !isImage && !isChart && !e.ctrlKey && !e.metaKey &&
                      e.button !== 1
                    ) {
                      e.preventDefault();
                      const href = `/src20/${
                        encodeURIComponent(unicodeEscapeToEmoji(src20.tick))
                      }`;
                      globalThis.location.href = href;
                    }
                  }}
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
                        class="w-7 h-7 rounded-sm cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation(); // Prevent row click
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
                                  <span class="gray-gradient1 group-hover:[-webkit-text-fill-color:#AA00FF] inline-block transition-colors duration-300">
                                    {text.toUpperCase()}
                                  </span>
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
                  {/* PRICE */}
                  <td
                    class={`${
                      cellAlign(1, headers.length)
                    } ${rowCardBorderCenter}`}
                  >
                    {(() => {
                      const priceInBtc = src20.floor_unit_price ?? 0;
                      if (priceInBtc === 0) {
                        return "0 SATS";
                      }
                      const priceInSatsExact = priceInBtc * 1e8;
                      const priceInSatsRounded = Math.round(priceInSatsExact);
                      if (priceInSatsRounded === 0) {
                        return "< 1 SATS";
                      }
                      return priceInSatsRounded.toLocaleString() + " SATS";
                    })()}
                  </td>
                  {/* CHANGE */}
                  <td
                    class={`${
                      cellAlign(2, headers.length)
                    } ${rowCardBorderCenter}`}
                  >
                    {(src20 as any).change24 !== undefined &&
                        (src20 as any).change24 !== null
                      ? (
                        <span
                          class={(src20 as any).change24 >= 0
                            ? "text-green-500"
                            : "text-red-500"}
                        >
                          {(src20 as any).change24.toFixed(2)}%
                        </span>
                      )
                      : <span class="text-stamp-grey-light">N/A%</span>}
                  </td>
                  {/* VOLUME */}
                  <td
                    class={`${
                      cellAlign(3, headers.length)
                    } ${rowCardBorderCenter} hidden mobileMd:table-cell`}
                  >
                    {(src20 as any).volume24 !== undefined &&
                        (src20 as any).volume24 !== null
                      ? (src20 as any).volume24.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 8,
                      }) + " BTC"
                      : "N/A"}
                  </td>
                  {/* MARKETCAP */}
                  <td
                    class={`${
                      cellAlign(4, headers.length)
                    } ${rowCardBorderCenter} hidden mobileLg:table-cell`}
                  >
                    {(src20 as any).market_cap !== undefined &&
                        (src20 as any).market_cap !== null
                      ? (src20 as any).market_cap.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 8,
                      }) + " BTC"
                      : "N/A"}
                  </td>

                  {/* DEPLOY */}
                  <td
                    class={`${
                      cellAlign(5, headers.length)
                    } ${rowCardBorderCenter} hidden tablet:table-cell`}
                  >
                    {formatDate(new Date(src20.block_time), {
                      month: "numeric",
                      day: "numeric",
                      year: "numeric",
                    }).toUpperCase()}
                  </td>
                  {/* HOLDERS */}
                  <td
                    class={`${
                      cellAlign(6, headers.length)
                    } ${rowCardBorderCenter} hidden mobileLg:table-cell`}
                  >
                    {Number(src20.holders).toLocaleString()}
                  </td>

                  {/* CHART */}
                  <td
                    class={`${
                      cellAlign(7, headers.length)
                    } ${rowCardBorderRight} hidden mobileMd:table-cell !py-0`}
                  >
                    {console.log(
                      "Chart data for",
                      src20.tick,
                      (src20 as any).chart,
                    )}
                    <ChartWidget
                      fromPage="home"
                      data={(src20 as any).chart}
                      tick={src20.tick}
                      data-chart-widget
                    />
                  </td>
                </tr>
              );
            })
          )
          : (
            <tr>
              <td colSpan={headers.length} class={`${valueDark} w-full`}>
                NO TOKENS TO DISPLAY
              </td>
            </tr>
          )}
      </tbody>
    </table>
  );
}
