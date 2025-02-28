import {
  SRC20BaseCard,
  SRC20BaseCardProps,
} from "$islands/src20/cards/SRC20BaseCard.tsx";

import { abbreviateAddress, formatDate } from "$lib/utils/formatUtils.ts";

export function SRC20TokenOutmintedCard(props: SRC20BaseCardProps) {
  const { src20, fromPage } = props;

  const dataLabelSm =
    "text-sm mobileLg:text-base font-light text-stamp-grey-darker uppercase";
  const dataValueSm =
    "text-sm mobileLg:text-base font-medium text-stamp-grey-light";
  const _dataLabel =
    "text-base mobileLg:text-lg font-light text-stamp-grey-darker uppercase";
  const _dataValue =
    "text-base mobileLg:text-lg font-medium text-stamp-grey-light uppercase";
  const _dataValueLg =
    "text-2xl mobileLg:text-3xl font-black text-stamp-grey-light -mt-0.5";
  const _dataValueXl =
    "text-3xl mobileLg:text-4xl font-black text-stamp-grey-light -mt-1";

  return (
    <SRC20BaseCard {...props}>
      {fromPage === "src20" && (
        <>
          {/* Price, Change, Volume group */}
          <div class="flex flex-col -mb-3 mobileLg:-mb-6">
            <div class="hidden min-[720px]:flex flex-col justify-center text-center -space-y-0.5 ">
              <p class={dataLabelSm}>
                PRICE{" "}
                <span class={dataValueSm}>
                  {Math.round((src20.floor_unit_price ?? 0) * 1e8)
                    .toLocaleString()}
                </span>{" "}
                <span class="text-stamp-grey-light">SATS</span>
              </p>
              <p class={dataLabelSm}>
                CHANGE <span class={dataValueSm}>N/A</span>
                <span class="text-stamp-grey-light">%</span>
              </p>
              <p class={dataLabelSm}>
                VOLUME{" "}
                <span class={dataValueSm}>
                  {Math.round(src20.volume24 ?? 0).toLocaleString()}
                </span>{" "}
                <span class="text-stamp-grey-light">BTC</span>
              </p>
            </div>
          </div>

          {/* Holders, Deploy, Creator group */}
          <div class="flex flex-col -mb-3 mobileLg:-mb-6">
            <div class="hidden min-[480px]:flex flex-col justify-center text-right -space-y-0.5 ">
              <p class={dataLabelSm}>
                HOLDERS{" "}
                <span class={dataValueSm}>
                  {Number(src20.holders).toLocaleString()}
                </span>
              </p>
              <p class={dataLabelSm}>
                DEPLOY{" "}
                <span class={dataValueSm}>
                  {formatDate(new Date(src20.block_time), {
                    month: "short",
                    year: "numeric",
                  }).toUpperCase()}
                </span>
              </p>
              <p class={dataLabelSm}>
                CREATOR{" "}
                <span class={dataValueSm}>
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
              <p class={dataLabelSm}>
                HOLDERS{" "}
                <span class={dataValueSm}>
                  {Number(src20.holders).toLocaleString()}
                </span>
              </p>
              <p class={dataLabelSm}>
                DEPLOY{" "}
                <span class={dataValueSm}>
                  {formatDate(new Date(src20.block_time), {
                    month: "short",
                    year: "numeric",
                  }).toUpperCase()}
                </span>
              </p>
              <p class={dataLabelSm}>
                CREATOR{" "}
                <span class={dataValueSm}>
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
              <p class={dataLabelSm}>
                PRICE{" "}
                <span class={dataValueSm}>
                  {Math.round((src20.floor_unit_price ?? 0) * 1e8)
                    .toLocaleString()}
                </span>{" "}
                <span class="text-stamp-grey-light">SATS</span>
              </p>
              <p class={dataLabelSm}>
                CHANGE <span class={dataValueSm}>N/A</span>
                <span class="text-stamp-grey-light">%</span>
              </p>
              <p class={dataLabelSm}>
                VOLUME <span class={dataValueSm}>N/A</span>{" "}
                <span class="text-stamp-grey-light">BTC</span>
              </p>
            </div>
          </div>

          {/* Value group */}
          <div class="flex flex-col -mb-3 mobileLg:-mb-6">
            <div class="hidden min-[480px]:flex flex-col justify-center text-right -space-y-0.5 ">
              <p class={dataLabelSm}>
                VALUE{" "}
              </p>
              <p class={dataValueSm}>
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
