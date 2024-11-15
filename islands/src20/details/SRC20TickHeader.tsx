import { abbreviateAddress, convertToEmoji } from "$lib/utils/util.ts";
import {
  Deployment,
  MarketListingSummary,
  MintStatus,
} from "$types/index.d.ts";
import { formatNumber } from "$lib/utils/util.ts";

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
}

function StatItem(
  { label, value, direction, currency }: {
    label: string;
    value: string | number;
    currency?: string;
    direction: string;
  },
) {
  return (
    <div
      class={`flex ${
        direction === "col" ? "flex-col" : "gap-2 items-center justify-end"
      }`}
    >
      <p class="text-lg font-light text-[#666666]">{label}</p>
      <p
        class={`font-bold text-[#999999] ${
          direction === "col" ? "text-3xl" : "text-lg"
        }`}
      >
        {value}
        {currency ? <span class="font-extralight">&nbsp;{currency}</span> : ""}
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
}: SRC20TickHeaderProps) {
  const tickValue = deployment.tick ? convertToEmoji(deployment.tick) : "N/A";
  const deployDate = new Date(deployment.block_time).toLocaleDateString(
    undefined,
    {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  );

  // Provide default values for marketInfo properties
  const floorUnitPriceBTC = marketInfo?.floor_unit_price ?? 0;
  const sum1dBTC = marketInfo?.sum_1d ?? 0;
  const mcapBTC = marketInfo?.mcap ?? 0;

  // Convert floorUnitPrice from BTC to Satoshis
  const floorUnitPriceSats = Math.round(floorUnitPriceBTC * 1e8);

  // Format BTC values to 8 decimal places
  const sum1dBTCFormatted = formatNumber(sum1dBTC, 4);
  const mcapBTCFormatted = formatNumber(mcapBTC, 4);

  // Format Satoshi value with commas (no decimals needed)
  const floorUnitPriceSatsFormatted = floorUnitPriceSats.toLocaleString();

  return (
    <div class="flex w-full flex-col gap-6">
      <div class="w-full flex flex-wrap gap-3 tablet:gap-6 p-3 tablet:p-6 dark-gradient">
        <div class="flex flex-col tablet:flex-row justify-between gap-3 w-full">
          <div className="flex gap-3">
            <img
              src={`/content/${deployment.tx_hash}.svg`}
              class="max-w-[135px] rounded-lg"
              alt={`${deployment.tick} token image`}
              loading="lazy"
            />
            <div>
              <div class="flex gap-6 items-center">
                <p class="text-3xl tablet:text-6xl uppercase font-black text-[#660099]">
                  {tickValue}
                </p>
                <div class="flex gap-2 items-center">
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
              <p className="text-[#666666] text-2xl font-light">CREATOR</p>
              <p className="text-[#999999] text-2xl font-bold">
                {deployment.creator_name ||
                  abbreviateAddress(deployment.destination)}
              </p>
            </div>
          </div>
          <div class="flex flex-col gap-2 justify-end items-start ml-auto">
            <div>
              <StatItem label="Deploy" value={deployDate} direction="row" />
              <StatItem
                label="Block #"
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

        <p class="text-sm text-[#CCCCCC] font-medium">
          This is an SRC-20 token, there are many like it, but this one is{" "}
          {deployment.tick.toUpperCase()}. This was deployed on block{" "}
          {deployment.block_index}{" "}
          without a description on the deploy. We hope you enjoy.
        </p>
      </div>

      {/* Token Information */}
      <div class="flex flex-wrap gap-3 tablet:gap-6 p-3 tablet:p-6 justify-between dark-gradient">
        <StatItem
          label="Supply"
          value={formatNumber(deployment.max, 0)}
          direction="col"
        />
        <StatItem
          label="LIMIT"
          value={formatNumber(deployment.lim, 0)}
          direction="col"
        />
        <StatItem label="DECIMALS" value={deployment.deci} direction="col" />
      </div>

      <div class="flex flex-wrap gap-3 tablet:gap-6 p-3 tablet:p-6 justify-between dark-gradient">
        {/* Price in Satoshis */}
        <StatItem
          label="PRICE"
          value={floorUnitPriceSatsFormatted}
          currency="SATS"
          direction="col"
        />
        <StatItem
          label="24H CHANGE"
          value="N/A" // FIXME: not available from API mcap request
          currency="%"
          direction="col"
        />
      </div>

      {/* Market Information */}
      <div class="flex flex-wrap gap-3 tablet:gap-6 p-3 tablet:p-6 justify-between dark-gradient">
        {/* Market Cap in BTC */}
        <StatItem
          label="MARKET CAP"
          value={mcapBTCFormatted}
          currency="BTC"
          direction="col"
        />
        {/* 24H Volume in BTC */}
        <StatItem
          label="24H VOLUME"
          value={sum1dBTCFormatted}
          currency="BTC"
          direction="col"
        />
        {/* 7 DAY Volume in BTC */}
        <StatItem
          label="7 DAY VOLUME"
          value={sum1dBTCFormatted * 7}
          currency="BTC"
          direction="col"
        />
      </div>
    </div>
  );
}
