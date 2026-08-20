/* ===== SRC20 DETAIL HEADER COMPONENT ===== */
import { Icon, PlaceholderImage } from "$icon";
import {
  body,
  container2,
  containerGap,
  containerPill,
  StatItem,
} from "$layout";
import { unicodeEscapeToEmoji } from "$lib/utils/ui/formatting/emojiUtils.ts";
import {
  abbreviateAddress,
  formatDate,
  formatNumber,
} from "$lib/utils/ui/formatting/formatUtils.ts";
import { constructStampUrl } from "$lib/utils/ui/media/imageUtils.ts";
import {
  cardFileType,
  cardPrice,
  titlePrimary,
  valueNegative,
  valueNeutral,
  valuePositive,
} from "$text";
import type {
  SRC20DetailHeaderProps,
  SRC20DetailInfoProps,
} from "$types/ui.d.ts";
import { useState } from "preact/hooks";

/* ===== COMPONENT ===== */
export function SRC20DetailHeader({
  deployment,
  marketInfo,
  // highcharts, // ===== CHARTS WIDGET (temporarily disabled) =====
}: SRC20DetailHeaderProps) {
  /* ===== STATE ===== */
  const [imgError, setImgError] = useState(false);

  /* ===== COMPUTED VALUES ===== */
  // Process tick value (handle emoji)
  const tickValue = deployment.tick
    ? unicodeEscapeToEmoji(deployment.tick)
    : "N/A";

  // ✅ ENHANCED IMAGE URL LOGIC: Use new stamp_url and deploy_img fields
  // 1. Use deploy_img if provided (for deploy operations: https://stampchain.io/stamps/{deploy_tx}.svg)
  // 2. Use stamp_url if provided (for transaction stamps: https://stampchain.io/stamps/{tx_hash}.svg)
  // 3. Fallback to constructing URL from deployment.tx_hash if available
  // 4. If unavailable (or fails to load), fall back to the placeholder icon
  const imageUrl = imgError ? null : deployment.deploy_img ||
    deployment.stamp_url ||
    (deployment.tx_hash ? constructStampUrl(deployment.tx_hash) : null);

  const floorPriceBTC = marketInfo?.floor_price_btc ?? 0; // ✅ v2.3 standardized field
  const volume24hBTC = marketInfo?.volume_24h_btc ?? 0; // ✅ v2.3 standardized field
  const marketCapBTC = marketInfo?.market_cap_btc ?? 0; // ✅ v2.3 standardized field
  const change24h = marketInfo?.change_24h ?? null; // ✅ v2.3 standardized field

  // Convert floorPrice from BTC to Satoshis with smart formatting
  const floorPriceSats = floorPriceBTC * 1e8;

  // Smart price formatting
  const formatPrice = (sats: number): string => {
    if (sats === 0) return "0 SATS";
    if (sats < 0.0001) return sats.toFixed(6) + " SATS";
    if (sats < 1) return sats.toFixed(4) + " SATS";
    if (sats < 10) return sats.toFixed(2) + " SATS";
    if (sats < 100) return sats.toFixed(1) + " SATS";
    if (sats < 1000) return Math.round(sats).toLocaleString() + " SATS";
    return Math.round(sats).toLocaleString() + " SATS";
  };

  // Smart BTC volume formatting
  const formatBTCVolume = (btc: number): string => {
    if (btc === 0) return "0 BTC";
    if (btc < 0.0001) return btc.toFixed(6) + " BTC";
    if (btc < 0.01) return btc.toFixed(4) + " BTC";
    if (btc < 0.1) return btc.toFixed(3) + " BTC";
    if (btc < 1) return btc.toFixed(2) + " BTC";
    if (btc < 100) return btc.toFixed(2) + " BTC";
    return Math.round(btc).toLocaleString() + " BTC";
  };

  // Smart market cap formatting
  const formatMarketCap = (btc: number): string => {
    if (btc === 0) return "0 BTC";
    if (btc < 1) return btc.toFixed(2) + " BTC";
    if (btc < 100) return btc.toFixed(2) + " BTC";
    if (btc < 1000) return btc.toFixed(1) + " BTC";
    return Math.round(btc).toLocaleString() + " BTC";
  };

  const floorPriceSatsFormatted = formatPrice(floorPriceSats);
  const volume24hBTCFormatted = formatBTCVolume(volume24hBTC);
  const marketCapBTCFormatted = formatMarketCap(marketCapBTC);

  /* ===== SHARED SUB-COMPONENTS (rendered once per breakpoint layout) ===== */
  const tokenImageAndName = (
    <div class="flex gap-3">
      <div class="w-10 h-10 shrink-0 rounded-2xl overflow-hidden">
        {imageUrl
          ? (
            <img
              src={imageUrl}
              class="w-full h-full object-contain rounded-2xl"
              alt={`${deployment.tick} token image`}
              loading="lazy"
              onError={() => setImgError(true)}
            />
          )
          : (
            <PlaceholderImage
              variant="no-image"
              className="!rounded-2xl"
            />
          )}
      </div>
      {/* Token name */}
      <div class="flex">
        <h1 class={`${titlePrimary} uppercase`}>
          {tickValue}
        </h1>
      </div>
    </div>
  );

  const pricePill = (
    <div class={`${containerPill} ${cardPrice} !text-sm`}>
      {floorPriceSatsFormatted}
    </div>
  );

  const changePill = (
    <div
      class={`${containerPill} ${cardFileType} !text-sm ${
        change24h === null
          ? valueNeutral
          : change24h >= 0
          ? valuePositive
          : valueNegative
      }`}
    >
      {change24h !== null
        ? `${change24h >= 0 ? "+" : ""}${change24h.toFixed(2)}%`
        : "N/A %"}
    </div>
  );

  const supplyValue = formatNumber(deployment.max ?? 0, 0);

  /* ===== RENDER ===== */
  return (
    <>
      <div class={`${body} ${containerGap}`}>
        {/* ===== TOKEN INFO CARD ===== */}
        <div class={`relative ${container2} p-0.5 flex-wrap`}>
          {/* ===== MOBILE LAYOUT (base, below mobileLg) ===== */}
          <div class="flex flex-col gap-3 mobileLg:hidden">
            {/* Row 1: image + ticker ... price pill */}
            <div class="flex items-center justify-between gap-5">
              {tokenImageAndName}
              <div class="flex items-center justify-end gap-2">
                {pricePill}
                <div class="hidden min-[460px]:block">{changePill}</div>
              </div>
            </div>

            {/* Row 2: volume + market cap + supply ... change pill */}
            <div class="flex items-center">
              <div class="flex-1">
                <StatItem
                  label="VOLUME"
                  value={volume24hBTCFormatted}
                  align="left"
                />
              </div>
              <div class="flex-1">
                <StatItem
                  label="MARKET CAP"
                  value={marketCapBTCFormatted}
                  align="center"
                />
              </div>
              <div class="flex-1 flex justify-end">
                <StatItem
                  label="SUPPLY"
                  value={supplyValue}
                  align="right"
                  class="hidden min-[460px]:block text-color-neutral-400"
                />
                <div class="flex min-[460px]:hidden">
                  {changePill}
                </div>
              </div>
            </div>
          </div>

          {/* ===== DESKTOP LAYOUT (mobileLg and up) ===== */}
          <div class="hidden mobileLg:flex flex-col gap-3">
            <div class="flex flex-row w-full items-center justify-between">
              {tokenImageAndName}

              {/* ===== PRICE + 24H CHANGE PILLS ===== */}
              <div class="flex items-center gap-2">
                {pricePill}
                {changePill}
              </div>

              {/* ===== VOLUME + MARKET CAP + SUPPLY ===== */}
              <div class="flex items-center gap-5">
                <StatItem
                  label="VOLUME"
                  value={volume24hBTCFormatted}
                  align="left"
                />
                <StatItem
                  label="MARKET CAP"
                  value={marketCapBTCFormatted}
                  class="text-right min-[800px]:text-center"
                />
                <StatItem
                  label="SUPPLY"
                  value={supplyValue}
                  align="right"
                  class="hidden min-[800px]:block text-color-neutral-400"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ===== SRC20 DETAIL INFO (rendered in the DetailsTableBase "INFO" tab) ===== */
export function SRC20DetailInfo({ deployment }: SRC20DetailInfoProps) {
  const deployDate = formatDate(new Date(deployment.block_time || 0), {
    month: "short",
    year: "numeric",
  });

  const creatorLink = (
    <a
      href={`/wallet/${deployment.destination}`}
      class="link-neutral-200"
    >
      {deployment.creator_name ||
        abbreviateAddress(deployment.destination || "", 8)}
    </a>
  );

  const txHashLink = deployment.tx_hash
    ? (
      <a
        href={`https://www.blockchain.com/explorer/transactions/btc/${deployment.tx_hash}`}
        target="_blank"
        rel="noopener noreferrer"
        class="link-neutral-200"
      >
        {abbreviateAddress(deployment.tx_hash, 8)}
      </a>
    )
    : "N/A";

  const limitValue = deployment.lim !== undefined
    ? formatNumber(deployment.lim as number, 0)
    : "N/A";

  const supplyValue = formatNumber(deployment.max ?? 0, 0);

  const hasSocialLinks = Boolean(
    deployment.x || deployment.tg || deployment.web || deployment.email,
  );

  const socialLinks = (
    <div class="flex shrink-0 justify-end items-start -mt-4 -mr-2 gap-1 w-fit">
      {deployment.x && (
        <Icon
          type="iconButton"
          name="twitter"
          weight="normal"
          size="xxs"
          color="greyLight"
          href={deployment.x}
          target="_blank"
        />
      )}
      {deployment.tg && (
        <Icon
          type="iconButton"
          name="telegram"
          weight="normal"
          size="xxs"
          color="greyLight"
          href={deployment.tg}
          target="_blank"
        />
      )}
      {deployment.web && (
        <Icon
          type="iconButton"
          name="website"
          weight="normal"
          size="xxs"
          color="greyLight"
          href={deployment.web}
          target="_blank"
        />
      )}
      {deployment.email && (
        <Icon
          type="iconButton"
          name="email"
          weight="normal"
          size="xxs"
          color="greyLight"
          href={deployment.email}
          target="_blank"
        />
      )}
    </div>
  );

  return (
    <div class="flex flex-col gap-5">
      {(deployment.description || hasSocialLinks) && (
        <div
          class={`flex items-center justify-between ${container2} px-3 py-2 gap-5`}
        >
          {deployment.description && (
            <div class="flex-1 min-w-0">
              <StatItem
                label="ABOUT"
                value={deployment.description}
                align="left"
                class="!whitespace-normal break-words"
              />
            </div>
          )}
          {hasSocialLinks && socialLinks}
        </div>
      )}

      <div class={`${container2} px-3 py-2 gap-3 flex-wrap`}>
        {/* Row 1: supply + limit + decimals */}
        <div class="flex items-center justify-between gap-5">
          <StatItem
            label="SUPPLY"
            value={supplyValue}
            align="left"
          />
          <StatItem label="LIMIT" value={limitValue} align="center" />
          <StatItem
            label="DECIMALS"
            value={deployment.deci}
            align="right"
            class="text-color-neutral-400"
          />
        </div>

        {/* Row 2: creator + deploy */}
        <div class="flex items-center justify-between gap-5">
          <StatItem label="CREATOR" value={creatorLink} align="left" />
          <StatItem
            label="DEPLOY"
            value={deployDate.toUpperCase()}
            align="right"
            class="text-color-neutral-400"
          />
        </div>

        {/* Row 3: tx hash + block # */}
        <div class="flex items-center justify-between gap-5">
          <StatItem label="TX HASH" value={txHashLink} align="left" />
          <StatItem
            label="BLOCK #"
            value={deployment.block_index}
            align="right"
            class="text-color-neutral-400"
          />
        </div>
      </div>
    </div>
  );
}
