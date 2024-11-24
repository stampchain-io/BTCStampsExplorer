import {
  boldTextClassName,
  defaultTextClassName,
  middleLayoutClassName,
  SRC20BaseCard,
  SRC20BaseCardProps,
} from "$islands/src20/cards/SRC20BaseCard.tsx";

import { abbreviateAddress, formatDate } from "$lib/utils/formatUtils.ts";

export function SRC20TokenOutmintedCard(props: SRC20BaseCardProps) {
  const { src20, variant } = props;

  return (
    <SRC20BaseCard {...props}>
      {variant !== "minting" && (
        <>
          {/* Price & Change & Volume */}
          <div class={middleLayoutClassName}>
            <p class={defaultTextClassName}>
              PRICE{" "}
              <span class={boldTextClassName}>
                {Math.round((src20.floor_unit_price ?? 0) * 1e8)
                  .toLocaleString()}
              </span>{" "}
              <span class="text-stamp-grey-light">SATS</span>
            </p>
            {/* TODO: not available from API request */}
            <p class={defaultTextClassName}>
              CHANGE <span class={boldTextClassName}>N/A</span>
              <span class="text-stamp-grey-light">%</span>
            </p>
            {/* TODO: not available from API request */}
            <p class={defaultTextClassName}>
              VOLUME <span class={boldTextClassName}>0.00</span>{" "}
              <span class="text-stamp-grey-light">BTC</span>
            </p>
          </div>

          {/* Holders & Deploy & Creator */}
          <div class={middleLayoutClassName + " text-right"}>
            <p class={defaultTextClassName}>
              HOLDERS{" "}
              <span class={boldTextClassName}>
                {Number(src20.holders).toLocaleString()}
              </span>
            </p>
            <p class={defaultTextClassName}>
              DEPLOY{" "}
              <span class={boldTextClassName}>
                {formatDate(new Date(src20.block_time), {
                  month: "short",
                  year: "numeric",
                }).toUpperCase()}
              </span>
            </p>
            <p class={defaultTextClassName}>
              CREATOR{" "}
              <span class={boldTextClassName}>
                {src20.creator_name ||
                  abbreviateAddress(src20.destination)}
              </span>
            </p>
          </div>
        </>
      )}

      {variant === "minting" && (
        <div class={middleLayoutClassName + " mobileMd:hidden"}>
          <p class={defaultTextClassName}>
            SUPPLY{" "}
            <span class={boldTextClassName}>
              {Number(src20.max).toLocaleString()}
            </span>
          </p>
          <p className={defaultTextClassName}>
            HOLDERS{" "}
            <span className={boldTextClassName}>
              {Number(src20.holders || 0).toLocaleString()}
            </span>
          </p>
          {/* Top Mints & Progress Bar */}
          <p class={defaultTextClassName}>
            TOP MINTS{" "}
            <span class={boldTextClassName}>
              0
            </span>{" "}
            %
          </p>
        </div>
      )}
    </SRC20BaseCard>
  );
}
