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
  fromPage,
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
          { width: "w-[20%]" }, // TOKEN
          { width: "w-[10%]" }, // PRICE
          { width: "w-[10%]" }, // CHANGE
          { width: "w-[10%]" }, // VOLUME
          { width: "w-[10%]" }, // MARKETCAP
          { width: "w-[10%]" }, // DEPLOY
          { width: "w-[15%]" }, // HOLDERS
          { width: "w-[15%]" }, // CHART
        ]).map((col) => <col key={col.key} className={col.className} />)}
      </colgroup>
      <thead>
        <tr>
          {headers.map((header, i) => (
            <th
              key={header}
              class={`${labelXs} pb-1.5 ${cellAlign(i, headers.length)}`}
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
                    {Math.round((src20.floor_unit_price ?? 0) * 1e8)
                      .toLocaleString()}
                    <span class="text-stamp-grey-light ml-1">SATS</span>
                  </td>
                  {/* CHANGE */}
                  <td
                    class={`${
                      cellAlign(2, headers.length)
                    } ${rowCardBorderCenter}`}
                  >
                    <span class="text-stamp-grey-light">N/A%</span>
                  </td>
                  {/* VOLUME */}
                  <td
                    class={`${
                      cellAlign(3, headers.length)
                    } ${rowCardBorderCenter}`}
                  >
                    {Math.round(src20.volume24 ?? 0).toLocaleString()}
                    <span class="text-stamp-grey-light ml-1">BTC</span>
                  </td>
                  {/* MARKETCAP */}
                  <td
                    class={`${
                      cellAlign(4, headers.length)
                    } ${rowCardBorderCenter}`}
                  >
                    {Math.round((src20.market_cap ?? 0) * 1e8)
                      .toLocaleString()}
                    <span class="text-stamp-grey-light ml-1">SATS</span>
                  </td>

                  {/* DEPLOY */}
                  <td
                    class={`${
                      cellAlign(5, headers.length)
                    } ${rowCardBorderCenter}`}
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
                    } ${rowCardBorderCenter}`}
                  >
                    {Number(src20.holders).toLocaleString()}
                  </td>

                  {/* CHART */}
                  <td
                    class={`${
                      cellAlign(7, headers.length)
                    } ${rowCardBorderRight}`}
                  >
                    <ChartWidget
                      fromPage="home"
                      data={src20.chart}
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
