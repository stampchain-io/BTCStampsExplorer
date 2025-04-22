import { SRC20Row } from "$globals";
import { abbreviateAddress, formatDate } from "$lib/utils/formatUtils.ts";
import { unicodeEscapeToEmoji } from "$lib/utils/emojiUtils.ts";
import ChartWidget from "$islands/layout/ChartWidget.tsx";
import { Timeframe } from "$layout";
import { cellAlign, colGroup } from "$components/layout/types.ts";
import { rowTable } from "$layout";
import { labelXs, valueDark, valueSm } from "$text";

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
    "DEPLOY",
    "HOLDERS",
    "PRICE",
    "CHANGE",
    "VOLUME",
    "MARKETCAP",
    "CHART",
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
    <div class="w-[500px] min-[500px]:w-full">
      <table class={valueSm}>
        <colgroup>
          {colGroup([
            { width: "w-[20%]" }, // TOKEN
            { width: "w-[10%]" }, // DEPLOY
            { width: "w-[10%]" }, // HOLDERS
            { width: "w-[10%]" }, // PRICE
            { width: "w-[10%]" }, // CHANGE
            { width: "w-[10%]" }, // VOLUME
            { width: "w-[15%]" }, // MARKETCAP
            { width: "w-[15%]" }, // CHART
          ]).map((col) => <col key={col.key} className={col.className} />)}
        </colgroup>
        <thead>
          <tr>
            {headers.map((header, i) => (
              <th
                key={header}
                class={`${labelXs} pb-1.5  ${cellAlign(i, headers.length)}`}
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
                  <tr key={src20.tx_hash} class={rowTable}>
                    {/* TOKEN */}
                    <td class={cellAlign(0, headers.length)}>
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
                                    <span class="hover:text-stamp-purple-bright">
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
                    {/* DEPLOY */}
                    <td class={cellAlign(1, headers.length)}>
                      {formatDate(new Date(src20.block_time), {
                        month: "numeric",
                        day: "numeric",
                        year: "numeric",
                      }).toUpperCase()}
                    </td>
                    {/* HOLDERS */}
                    <td class={cellAlign(2, headers.length)}>
                      {Number(src20.holders).toLocaleString()}
                    </td>
                    {/* PRICE */}
                    <td class={cellAlign(3, headers.length)}>
                      {Math.round((src20.floor_unit_price ?? 0) * 1e8)
                        .toLocaleString()}
                      <span class="text-stamp-grey-light ml-1">SATS</span>
                    </td>
                    {/* CHANGE */}
                    <td class={cellAlign(4, headers.length)}>
                      <span class="text-stamp-grey-light">N/A%</span>
                    </td>
                    {/* VOLUME */}
                    <td class={cellAlign(5, headers.length)}>
                      {Math.round(src20.volume24 ?? 0).toLocaleString()}
                      <span class="text-stamp-grey-light ml-1">BTC</span>
                    </td>
                    {/* MARKETCAP */}
                    <td class={cellAlign(6, headers.length)}>
                      {Math.round((src20.market_cap ?? 0) * 1e8)
                        .toLocaleString()}
                      <span class="text-stamp-grey-light ml-1">SATS</span>
                    </td>
                    {/* CHART */}
                    <td class={cellAlign(7, headers.length)}>
                      <ChartWidget
                        fromPage="home"
                        data={src20.chart}
                        tick={src20.tick}
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
    </div>
  );
}
