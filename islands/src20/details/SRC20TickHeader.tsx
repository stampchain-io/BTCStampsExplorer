import { convertToEmoji } from "$lib/utils/emojiUtils.ts";
import {
  Deployment,
  MarketListingSummary,
  MintStatus,
} from "$types/index.d.ts";
import {
  abbreviateAddress,
  formatDate,
  formatNumber,
} from "$lib/utils/formatUtils.ts";

export interface SRC20TickHeaderProps {
  deployment: Deployment & {
    email?: string;
    web?: string;
    tg?: string;
    x?: string;
  };
  mintStatus: MintStatus;
  totalMints: number;
  totalTransfers: number;
  marketInfo?: MarketListingSummary;
  align?: "left" | "center" | "right";
}

function StatItem(
  { label, value, direction, currency, align = "left" }: {
    label: string;
    value: string | number;
    currency?: string;
    direction: string;
    align?: "left" | "center" | "right";
  },
) {
  const alignmentClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align];

  return (
    <div
      class={`flex ${
        direction === "col" ? "flex-col" : "gap-2 items-center justify-end"
      } ${alignmentClass}`}
    >
      <p class="text-base mobileLg:text-lg font-light text-stamp-grey-darker ">
        {label}
      </p>
      <p
        class={`font-bold text-stamp-grey-light ${
          direction === "col"
            ? "text-2xl mobileLg:text-3xl"
            : "text-base mobileLg:text-lg"
        }`}
      >
        {value}
        {currency
          ? (
            <span class="font-light">
              &nbsp;{currency}
            </span>
          )
          : ""}
      </p>
    </div>
  );
}

export function SRC20TickHeader({
  deployment,
  mintStatus,
  totalMints,
  totalTransfers,
  marketInfo,
  align,
}: SRC20TickHeaderProps) {
  const tickValue = deployment.tick
    ? (() => {
      console.log("Original tick:", deployment.tick);
      const converted = convertToEmoji(deployment.tick);
      console.log("Converted tick:", converted);
      return converted;
    })()
    : "N/A";
  const deployDate = formatDate(new Date(deployment.block_time), {
    month: "short",
    year: "numeric",
  });

  // Provide default values for marketInfo properties
  const floorUnitPriceBTC = marketInfo?.floor_unit_price ?? 0;
  const sum1dBTC = marketInfo?.sum_1d ?? 0;
  const mcapBTC = marketInfo?.mcap ?? 0;

  // Convert floorUnitPrice from BTC to Satoshis
  const floorUnitPriceSats = Math.round(floorUnitPriceBTC * 1e8);

  // Format BTC values to 8 decimal places
  const sum1dBTCFormatted = formatNumber(sum1dBTC, 4);
  const sum7dBTCFormatted = formatNumber(sum1dBTC * 7, 4);
  const mcapBTCFormatted = formatNumber(mcapBTC, 4);

  // Format Satoshi value with commas (no decimals needed)
  const floorUnitPriceSatsFormatted = floorUnitPriceSats.toLocaleString();

  return (
    <div class="flex w-full flex-col gap-6">
      <div class="w-full flex flex-wrap gap-3 mobileMd:gap-6 p-3 mobileMd:p-6 dark-gradient">
        <div class="flex flex-row w-full">
          <div className="flex gap-3">
            <img
              src={`/content/${deployment.tx_hash}.svg`}
              class="max-w-[99px] mobileMd:max-w-[105px] mobileLg:max-w-[111px] desktop:max-w-[125px] rounded-sm"
              alt={`${deployment.tick} token image`}
              loading="lazy"
            />
            <div>
              <div class="flex gap-6 items-center">
                <p class="inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl desktop:text-6xl font-black gray-gradient1 uppercase">
                  {tickValue}
                </p>
                <div class="flex gap-3 items-center">
                  {deployment.email && (
                    <a href={deployment.email} target="_blank">
                      <img src="/img/src20/details/EnvelopeSimple.svg" />
                    </a>
                  )}
                  {deployment.web && (
                    <a href={deployment.web} target="_blank">
                      <img src="/img/src20/details/Globe.svg" />
                    </a>
                  )}
                  {deployment.tg && (
                    <a href={deployment.tg} target="_blank">
                      <img src="/img/src20/details/TelegramLogo.svg" />
                    </a>
                  )}
                  {deployment.x && (
                    <a href={deployment.x} target="_blank">
                      <img src="/img/src20/details/XLogo.svg" />
                    </a>
                  )}
                </div>
              </div>
              <p className="text-[#666666] text-base mobileLg:text-lg font-light">
                CREATOR
              </p>
              <p className="text-stamp-grey-light text-xl mobileLg:text-2xl font-bold">
                {deployment.creator_name ||
                  abbreviateAddress(deployment.destination)}
              </p>
            </div>
          </div>
          <div class="flex flex-col gap-2 justify-end items-start ml-auto">
            <div>
              <StatItem label="DEPLOY" value={deployDate} direction="row" />
              <StatItem
                label="BLOCK #"
                value={deployment.block_index}
                direction="row"
              />
              <StatItem
                label="TX ID"
                value={abbreviateAddress(deployment.tx_hash)}
                direction="row"
              />
            </div>
          </div>
        </div>
        {
          /*
        <p class="text-sm text-[#CCCCCC] font-medium">
          This is an SRC-20 token, there are many like it, but this one is{" "}
          {deployment.tick.toUpperCase()}. This was deployed on block{" "}
          {deployment.block_index}{" "}
          without a description on the deploy. We hope you enjoy.
        </p>
        */
        }
      </div>

      {/* Token Information */}
      <div class="flex flex-wrap gap-3 mobileMd:gap-6 p-3 mobileMd:p-6 justify-between dark-gradient">
        <StatItem
          label="SUPPLY"
          value={formatNumber(deployment.max, 0)}
          direction="col"
        />
        <StatItem
          label="LIMIT"
          value={formatNumber(deployment.lim, 0)}
          direction="col"
          align="center"
        />
        <div class="hidden mobileMd:block">
          <StatItem
            label="DECIMALS"
            value={deployment.deci}
            direction="col"
            align="right"
          />
        </div>
      </div>

      <div class="flex flex-wrap gap-3 mobileMd:gap-6 p-3 mobileMd:p-6 justify-between dark-gradient">
        {/* Price in Satoshis */}
        <StatItem
          label="PRICE"
          value={floorUnitPriceSatsFormatted}
          currency="SATS"
          direction="col"
        />
        <StatItem
          label="24H CHANGE"
          value="N/A" // FIXME: not available from API request
          currency="%"
          direction="col"
          align="right"
        />
      </div>

      {/* Market Information */}
      <div class="flex flex-wrap gap-3 mobileMd:gap-6 p-3 mobileMd:p-6 justify-between dark-gradient">
        {/* Market Cap in BTC */}
        <StatItem
          label="MARKET CAP"
          value={mcapBTCFormatted}
          currency="BTC"
          direction="col"
        />
        {/* 24H Volume in BTC */}
        <div class="hidden mobileMd:block">
          <StatItem
            label="24H VOLUME"
            value={sum1dBTCFormatted}
            currency="BTC"
            direction="col"
            align="center"
          />
        </div>
        {/* 7 DAY Volume in BTC */}
        <StatItem
          label="7 DAY VOLUME"
          value={sum7dBTCFormatted}
          currency="BTC"
          direction="col"
          align="right"
        />
      </div>
    </div>
  );
}
