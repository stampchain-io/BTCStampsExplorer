import {
  SRC20BaseCard,
  SRC20BaseCardProps,
} from "$islands/src20/cards/SRC20BaseCard.tsx";
import { abbreviateAddress, formatDate } from "$lib/utils/formatUtils.ts";
import { BaseCardStyles } from "./styles.ts";

export function SRC20TokenOutmintedCard(props: SRC20BaseCardProps) {
  const { src20, fromPage } = props;

  return (
    <SRC20BaseCard {...props}>
      {fromPage === "src20" && (
        <>
          {/* Price, Change, Volume group */}
          <div class="flex flex-col -mb-3 mobileLg:-mb-6">
            <div class="hidden min-[720px]:flex flex-col justify-center text-center -space-y-0.5 ">
              <p class={BaseCardStyles.dataLabelSm}>
                PRICE{" "}
                <span class={BaseCardStyles.dataValueSm}>
                  {Math.round((src20.floor_unit_price ?? 0) * 1e8)
                    .toLocaleString()}
                </span>{" "}
                <span class="text-stamp-grey-light">SATS</span>
              </p>
              <p class={BaseCardStyles.dataLabelSm}>
                CHANGE <span class={BaseCardStyles.dataValueSm}>N/A</span>
                <span class="text-stamp-grey-light">%</span>
              </p>
              <p class={BaseCardStyles.dataLabelSm}>
                VOLUME{" "}
                <span class={BaseCardStyles.dataValueSm}>
                  {Math.round(src20.volume24 ?? 0).toLocaleString()}
                </span>{" "}
                <span class="text-stamp-grey-light">BTC</span>
              </p>
            </div>
          </div>

          {/* Holders, Deploy, Creator group */}
          <div class="flex flex-col -mb-3 mobileLg:-mb-6">
            <div class="hidden min-[480px]:flex flex-col justify-center text-right -space-y-0.5 ">
              <p class={BaseCardStyles.dataLabelSm}>
                HOLDERS{" "}
                <span class={BaseCardStyles.dataValueSm}>
                  {Number(src20.holders).toLocaleString()}
                </span>
              </p>
              <p class={BaseCardStyles.dataLabelSm}>
                DEPLOY{" "}
                <span class={BaseCardStyles.dataValueSm}>
                  {formatDate(new Date(src20.block_time), {
                    month: "short",
                    year: "numeric",
                  }).toUpperCase()}
                </span>
              </p>
              <p class={BaseCardStyles.dataLabelSm}>
                CREATOR{" "}
                <span class={BaseCardStyles.dataValueSm}>
                  {src20.creator_name ||
                    abbreviateAddress(src20.destination)}
                </span>
              </p>
            </div>
          </div>
        </>
      )}

      {fromPage === "home" && (
        <>
          {/* Holders, Deploy, Creator group */}
          <div class="flex flex-col -mb-3 mobileLg:-mb-6">
            <div class="hidden min-[480px]:flex flex-col justify-center text-right -space-y-0.5 ">
              <p class={BaseCardStyles.dataLabelSm}>
                HOLDERS{" "}
                <span class={BaseCardStyles.dataValueSm}>
                  {Number(src20.holders).toLocaleString()}
                </span>
              </p>
              <p class={BaseCardStyles.dataLabelSm}>
                DEPLOY{" "}
                <span class={BaseCardStyles.dataValueSm}>
                  {formatDate(new Date(src20.block_time), {
                    month: "short",
                    year: "numeric",
                  }).toUpperCase()}
                </span>
              </p>
              <p class={BaseCardStyles.dataLabelSm}>
                CREATOR{" "}
                <span class={BaseCardStyles.dataValueSm}>
                  {src20.creator_name ||
                    abbreviateAddress(src20.destination)}
                </span>
              </p>
            </div>
          </div>
        </>
      )}

      {fromPage === "wallet" && (
        <>
          {/* Price, Change, Volume group */}
          <div class="flex flex-col -mb-3 mobileLg:-mb-6">
            <div class="hidden min-[640px]:flex flex-col justify-center text-center -space-y-0.5 ">
              <p class={BaseCardStyles.dataLabelSm}>
                PRICE{" "}
                <span class={BaseCardStyles.dataValueSm}>
                  {Math.round((src20.floor_unit_price ?? 0) * 1e8)
                    .toLocaleString()}
                </span>{" "}
                <span class="text-stamp-grey-light">SATS</span>
              </p>
              <p class={BaseCardStyles.dataLabelSm}>
                CHANGE <span class={BaseCardStyles.dataValueSm}>N/A</span>
                <span class="text-stamp-grey-light">%</span>
              </p>
              <p class={BaseCardStyles.dataLabelSm}>
                VOLUME <span class={BaseCardStyles.dataValueSm}>N/A</span>{" "}
                <span class="text-stamp-grey-light">BTC</span>
              </p>
            </div>
          </div>

          {/* Value group */}
          <div class="flex flex-col -mb-3 mobileLg:-mb-6">
            <div class="hidden min-[480px]:flex flex-col justify-center text-right -space-y-0.5 ">
              <p class={BaseCardStyles.dataLabelSm}>
                VALUE{" "}
              </p>
              <p class={BaseCardStyles.dataValueSm}>
                {Math.round((src20.value ?? 0) * 1e8).toLocaleString()}{" "}
                <span class="text-stamp-grey-light">SATS</span>
              </p>
            </div>
          </div>
        </>
      )}
    </SRC20BaseCard>
  );
}
