import { Button } from "$components/shared/Button.tsx";
import {
  SRC20BaseCard,
  SRC20BaseCardProps,
} from "$islands/src20/cards/SRC20BaseCard.tsx";
import { formatDate } from "$lib/utils/formatUtils.ts";
import { BaseCardStyles } from "./styles.ts";

export function SRC20TokenMintingCard(props: SRC20BaseCardProps) {
  const { src20, fromPage } = props;

  const mintHref = `/stamping/src20/mint?tick=${
    encodeURIComponent(src20.tick)
  }&trxType=olga`;
  const progressWidth = `${src20.progress}%`;

  const handleMintClick = () => {
    globalThis.location.href = mintHref;
  };

  return (
    <SRC20BaseCard {...props}>
      {fromPage === "src20" && (
        <>
          {/* Holders & Deploy */}
          <div class="flex flex-col -mb-6 mobileLg:-mb-[44px]">
            <div class="hidden tablet:flex flex-col justify-center text-center -space-y-0.5 ">
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
            </div>
          </div>

          {/* Top Mints & Progress Bar */}
          <div class="flex flex-col -mb-3 mobileLg:-mb-[22px] -ml-24 tablet:ml-0 ">
            <div class="hidden min-[640px]:flex flex-col justify-center text-center -space-y-0.5 ">
              <p class={BaseCardStyles.dataLabelSm}>
                TOP MINTS{" "}
                <span class={BaseCardStyles.dataValueSm}>
                  {src20.top_mints_percentage?.toFixed(1) || "N/A"}%
                </span>
              </p>
              <div class="flex flex-col gap-1">
                <p class={BaseCardStyles.dataLabelSm}>
                  PROGRESS{" "}
                  <span class={BaseCardStyles.dataValueSm}>
                    {src20.progress}
                  </span>
                  <span class="text-stamp-grey-light">%</span>
                </p>
                <div class="relative min-w-[144px] mobileLg:min-w-[192px] h-1 mobileLg:h-1.5 bg-stamp-grey rounded-full">
                  <div
                    class="absolute left-0 top-0 h-1 mobileLg:h-1.5 bg-stamp-purple-dark rounded-full"
                    style={{ width: progressWidth }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {fromPage === "wallet" && (
        // Holders & Deploy
        <div class="flex flex-col justify-end">
          <div class="hidden min-[640px]:flex flex-col justify-center text-center -space-y-0.5 ">
            <p class={BaseCardStyles.dataLabelSm}>
              HOLDERS{" "}
              <span class={BaseCardStyles.dataValueSm}>
                {Number(src20?.mint_progress?.total_mints).toLocaleString()}
              </span>
            </p>
            <p class={BaseCardStyles.dataLabelSm}>
              TOP MINTS{" "}
              <span class={BaseCardStyles.dataValueSm}>
                {src20.top_mints_percentage?.toFixed(1) || "N/A"}%
              </span>
            </p>
            <div class="flex flex-col gap-1">
              <p class={BaseCardStyles.dataLabelSm}>
                PROGRESS{" "}
                <span class={BaseCardStyles.dataValueSm}>
                  {src20?.mint_progress?.progress}
                </span>
                <span class="text-stamp-grey-light">%</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {fromPage === "stamping/src20" && (
        <div class="flex-col gap-6 -mb-4 mobileLg:-mb-6 hidden mobileMd:flex tablet:hidden desktop:flex">
          <div class="flex flex-col justify-center text-center -space-y-0.5">
            <p class={BaseCardStyles.dataLabelSm}>
              SUPPLY{" "}
              <span class={BaseCardStyles.dataValueSm}>
                {Number(src20.max).toLocaleString()}
              </span>
            </p>
            <p className={BaseCardStyles.dataLabelSm}>
              HOLDERS{" "}
              <span className={BaseCardStyles.dataValueSm}>
                {Number(src20.holders || 0).toLocaleString()}
              </span>
            </p>
            <p class={BaseCardStyles.dataLabelSm}>
              TOP MINTS{" "}
              <span class={BaseCardStyles.dataValueSm}>
                {src20.top_mints_percentage?.toFixed(1) || "N/A"}%
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Mint Button */}
      <Button
        variant="mint"
        onClick={handleMintClick}
        class={(fromPage != "stamping/src20" && fromPage != "home")
          ? "hidden min-[480px]:block"
          : ""}
      >
        MINT
      </Button>
    </SRC20BaseCard>
  );
}
