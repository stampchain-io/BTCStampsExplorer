import { cellAlign, colGroup } from "$components/layout/types.ts";
import type { SRC20MintedTableProps } from "$types/ui.d.ts";
import type { SRC20Row } from "$types/src20.d.ts";
import ChartWidget from "$islands/layout/ChartWidget.tsx";
import { rowTable } from "$layout";
import { unicodeEscapeToEmoji } from "$lib/utils/ui/formatting/emojiUtils.ts";
import { formatDate } from "$lib/utils/ui/formatting/formatUtils.ts";
import { constructStampUrl } from "$lib/utils/ui/media/imageUtils.ts";
import { labelXs, valueDark, valueSm } from "$text";

// ✅ LOCAL: v2.3 market data helper functions
function getFloorPrice(src20: any): number {
  return src20?.market_data?.floor_price_btc || 0;
}

function getMarketCapBTC(src20: any): number {
  return src20?.market_data?.market_cap_btc || 0;
}

function getVolume24h(src20: any): number {
  return src20?.market_data?.volume_24h_btc || 0;
}

export function SRC20MintedTable({
  data,
  fromPage: _fromPage,
  timeframe,
  onImageClick,
}: SRC20MintedTableProps) {
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
          ]).map((col) => <col key={col.key} class={col.className} />)}
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
              data.map((src20: SRC20Row) => {
                const imageUrl = src20.deploy_img ||
                  src20.stamp_url ||
                  (src20.deploy_tx
                    ? constructStampUrl(src20.deploy_tx)
                    : null) ||
                  "/img/placeholder/stamp-no-image.svg";

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
                      {Math.round(getFloorPrice(src20) * 1e8)
                        .toLocaleString()}
                      <span class="text-stamp-grey-light ml-1">SATS</span>
                    </td>
                    {/* CHANGE */}
                    <td class={cellAlign(4, headers.length)}>
                      <span class="text-stamp-grey-light">N/A%</span>
                    </td>
                    {/* VOLUME */}
                    <td class={cellAlign(5, headers.length)}>
                      {Math.round(getVolume24h(src20)).toLocaleString()}
                      <span class="text-stamp-grey-light ml-1">BTC</span>
                    </td>
                    {/* MARKETCAP */}
                    <td class={cellAlign(6, headers.length)}>
                      {Math.round(getMarketCapBTC(src20) * 1e8)
                        .toLocaleString()}
                      <span class="text-stamp-grey-light ml-1">SATS</span>
                    </td>
                    {/* CHART */}
                    <td class={cellAlign(7, headers.length)}>
                      <ChartWidget
                        type="line"
                        fromPage="home"
                        data={src20.chart as [number, number][] || []}
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
                  NO MINTED TOKENS
                </td>
              </tr>
            )}
        </tbody>
      </table>
    </div>
  );
}
